const { randomUUID } = require("node:crypto");
const mongoose = require("mongoose");
const Quote = require("../model/quote.model");
const Order = require("../model/order.model");
const routing = require("./routing.service");
const { price } = require("./pricing.service");
const { QUOTE_MINUTES } = require("../constants/shipping");
const { apiError } = require("../utils/apiResponse");
const notifications = require("./notification.service");
const { expenseWindow, expenseSeries } = require("./expense-series.service");
const assertId = (id) => {
  if (!/^[a-f0-9]{24}$/i.test(id))
    throw apiError(400, "INVALID_ID", "Invalid order ID.");
};
const view = (o) => {
  const x = o.toObject ? o.toObject() : o;
  const { __v, gatewayState, ...rest } = x;
  return { ...rest, id: String(x._id) };
};
async function quote(user, shipment) {
  const [pickup, destination] = await Promise.all([
    routing.reverse(shipment.pickup),
    routing.reverse(shipment.destination),
  ]);
  const route = await routing.route(pickup, destination);
  const q = await Quote.create({
    customer: user.id,
    shipment: { ...shipment, pickup, destination },
    route,
    prices: price(shipment, route.distance),
    expiresAt: new Date(Date.now() + QUOTE_MINUTES * 60000),
  });
  return { id: q.id, route: q.route, prices: q.prices, expiresAt: q.expiresAt };
}
async function own(user, id) {
  assertId(id);
  const order = await Order.findOne({ _id: id, customer: user.id });
  if (!order) throw apiError(404, "ORDER_NOT_FOUND", "Order not found.");
  return order;
}
async function publish(order) {
  const key = `shipment:${order.id}`;
  await notifications.safe(async () => {
    await notifications.orderEvent(
      order.customer,
      `${key}:placed`,
      "Order placed",
      `${order.number} — shipment request created.`,
      "order",
    );
    for (const p of order.attempts) {
      if (p.status === "failed")
        await notifications.orderEvent(
          order.customer,
          `${key}:failed:${p.paymentId}`,
          "Payment failed",
          `${order.number} — payment attempt failed.`,
          "payment",
        );
    }
    if (order.paymentStatus === "paid") {
      await notifications.orderEvent(
        order.customer,
        `${key}:paid`,
        "Payment completed",
        `${order.number} — payment verified.`,
        "payment",
      );
      await notifications.orderEvent(
        order.customer,
        `${key}:dispatch`,
        "Awaiting dispatch",
        `${order.number} — ready for dispatcher assignment.`,
        "order",
      );
    }
  });
}
async function create(user, { quoteId, tier }) {
  await Order.init();
  let o = await Order.findOne({ customer: user.id, quoteId });
  if (o) {
    if (o.price.tier !== tier)
      throw apiError(
        409,
        "QUOTE_ALREADY_USED",
        "This quote already has an order. Open order history.",
      );
    await publish(o);
    return o;
  }
  const q = await Quote.findOne({
    _id: quoteId,
    customer: user.id,
    expiresAt: { $gt: new Date() },
  });
  if (!q)
    throw apiError(409, "QUOTE_EXPIRED", "Quote expired. Request a new quote.");
  const p = q.prices.find((x) => x.tier === tier);
  if (!p) throw apiError(400, "INVALID_TIER", "Invalid service tier.");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 18).toUpperCase();
  try {
    o = await Order.create({
      customer: user.id,
      quoteId: q.id,
      number: `FFP-${suffix}`,
      trackingId: `TRK-${suffix}`,
      customerSnapshot: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      shipment: q.shipment,
      route: { distance: q.route.distance, duration: q.route.duration },
      price: p,
      timeline: [{ event: "Order placed", at: new Date() }],
    });
  } catch (e) {
    if (e.code !== 11000) throw e;
    o = await Order.findOne({ customer: user.id, quoteId });
    if (!o || o.price.tier !== tier)
      throw apiError(409, "QUOTE_ALREADY_USED", "Quote already used.");
  }
  await publish(o);
  return o;
}
async function list(user, query) {
  const page = Math.max(
    0,
    Math.min(10000, Math.floor(Number(query.page) || 0)),
  );
  const limit = Math.max(
    1,
    Math.min(50, Math.floor(Number(query.limit) || 10)),
  );
  const filter = { customer: user.id };
  if (["paid", "pending", "failed"].includes(query.payment))
    filter.paymentStatus = query.payment;
  if (typeof query.search === "string" && query.search.trim()) {
    const q = query.search
      .trim()
      .slice(0, 80)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { number: { $regex: q, $options: "i" } },
      { trackingId: { $regex: q, $options: "i" } },
    ];
  }
  const sortFields = {
    createdAt: "createdAt",
    number: "number",
    amount: "price.total",
    paymentStatus: "paymentStatus",
    status: "status",
  };
  const sortKey =
    typeof query.sort === "string" && Object.hasOwn(sortFields, query.sort)
      ? sortFields[query.sort]
      : "createdAt";
  const direction = query.direction === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sortKey]: direction, _id: direction })
      .skip(page * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  return { items: items.map(view), total };
}
async function overview(user, months = 12, year, grouping = "weekly") {
  const window = expenseWindow(months, year, grouping);
  const customer = new mongoose.Types.ObjectId(user.id);
  const [result] = await Order.aggregate([
    { $match: { customer } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              paid: {
                $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
              },
              awaiting: {
                $sum: {
                  $cond: [{ $eq: ["$status", "awaiting_dispatch"] }, 1, 0],
                },
              },
              expenses: {
                $sum: {
                  $cond: [
                    { $eq: ["$paymentStatus", "paid"] },
                    "$price.total",
                    0,
                  ],
                },
              },
            },
          },
        ],
        daily: [
          {
            $match: {
              paymentStatus: "paid",
              paidAt: { $gte: window.matchFrom, $lt: window.matchUntil },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$paidAt",
                  timezone: "Asia/Kolkata",
                },
              },
              total: { $sum: "$price.total" },
            },
          },
          { $sort: { _id: 1 } },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              number: 1,
              createdAt: 1,
              paymentStatus: 1,
              status: 1,
              price: 1,
            },
          },
        ],
      },
    },
  ]);
  return {
    summary: result?.summary[0] || {
      totalOrders: 0,
      paid: 0,
      awaiting: 0,
      expenses: 0,
    },
    ...expenseSeries(window, result?.daily || []),
    recent: result?.recent || [],
  };
}
module.exports = { quote, own, create, list, overview, view, publish };
