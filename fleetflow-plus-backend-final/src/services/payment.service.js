const { createHmac, timingSafeEqual } = require("node:crypto");
const Order = require("../model/order.model");
const { gateway, credentials } = require("../config/razorpay");
const orders = require("./order.service");
const { apiError } = require("../utils/apiResponse");
const signature = (secret, body, received) => {
  if (
    !secret ||
    typeof received !== "string" ||
    !/^[a-f0-9]{64}$/i.test(received)
  )
    return false;
  return timingSafeEqual(
    createHmac("sha256", secret).update(body).digest(),
    Buffer.from(received, "hex"),
  );
};
async function checkout(order) {
  const { id: key } = credentials();
  if (!process.env.RAZORPAY_WEBHOOK_SECRET)
    throw apiError(
      503,
      "PAYMENT_NOT_CONFIGURED",
      "Configure the Razorpay webhook secret.",
    );
  if (order.paymentStatus === "paid") return { order: orders.view(order), key };
  if (order.attempts.some((a) => a.status === "authorized"))
    throw apiError(
      409,
      "PAYMENT_CAPTURE_PENDING",
      "A payment is awaiting capture. Refresh payment status before retrying.",
    );
  if (!order.gatewayOrderId) {
    const claimed = await Order.findOneAndUpdate(
      { _id: order.id, gatewayState: "new" },
      { $set: { gatewayState: "creating" }, $inc: { __v: 1 } },
      { new: true },
    );
    if (!claimed) {
      order = await Order.findById(order.id);
      if (!order.gatewayOrderId) {
        const remote = await gateway(
          `/orders?receipt=${encodeURIComponent(order.number)}&count=10`,
        );
        const matches = (remote.items || []).filter(
          (x) =>
            x.receipt === order.number &&
            x.notes?.fleetflow_order === order.id &&
            x.amount === order.price.total &&
            x.currency === "INR" &&
            /^order_[A-Za-z0-9]+$/.test(x.id),
        );
        if (matches.length !== 1)
          throw apiError(
            409,
            "CHECKOUT_UNCERTAIN",
            "Checkout is being created or needs reconciliation. Do not create another payment. Contact support if it persists.",
          );
        order =
          (await Order.findOneAndUpdate(
            { _id: order.id, gatewayOrderId: { $exists: false } },
            {
              $set: { gatewayOrderId: matches[0].id, gatewayState: "ready" },
              $inc: { __v: 1 },
            },
            { new: true },
          )) || (await Order.findById(order.id));
        order = await sync(order);
      }
    } else {
      try {
        const remote = await gateway("/orders", {
          amount: order.price.total,
          currency: "INR",
          receipt: order.number,
          partial_payment: false,
          notes: { fleetflow_order: order.id },
        });
        if (
          remote.amount !== order.price.total ||
          remote.currency !== "INR" ||
          !/^order_[A-Za-z0-9]+$/.test(remote.id)
        )
          throw new Error("Unexpected gateway response");
        order =
          (await Order.findOneAndUpdate(
            { _id: order.id, gatewayState: "creating" },
            {
              $set: { gatewayOrderId: remote.id, gatewayState: "ready" },
              $inc: { __v: 1 },
            },
            { new: true },
          )) || (await Order.findById(claimed.id));
      } catch (e) {
        await Order.updateOne(
          { _id: claimed.id, gatewayState: "creating" },
          { $set: { gatewayState: "uncertain" }, $inc: { __v: 1 } },
        );
        throw e;
      }
    }
  }
  if (
    order.paymentStatus !== "paid" &&
    order.attempts.some((a) => a.status === "authorized")
  )
    throw apiError(
      409,
      "PAYMENT_CAPTURE_PENDING",
      "A payment is awaiting capture. Refresh payment status before retrying.",
    );
  return { order: orders.view(order), key };
}
async function apply(order, p) {
  if (
    p.order_id !== order.gatewayOrderId ||
    p.amount !== order.price.total ||
    p.currency !== "INR" ||
    !/^pay_[A-Za-z0-9]+$/.test(p.id)
  )
    throw apiError(
      409,
      "PAYMENT_MISMATCH",
      "Payment does not match this order.",
    );
  if (!["captured", "failed", "authorized"].includes(p.status)) return order;
  if (p.status === "captured") {
    const remote = await gateway(`/orders/${order.gatewayOrderId}`);
    if (
      remote.id !== order.gatewayOrderId ||
      remote.currency !== "INR" ||
      remote.amount !== order.price.total ||
      remote.amount_paid !== order.price.total ||
      remote.status !== "paid"
    )
      throw apiError(
        409,
        "PAYMENT_CAPTURE_PENDING",
        "Gateway payment confirmation is pending. Refresh status.",
      );
  }
  for (let n = 0; n < 5; n++) {
    const o = await Order.findById(order.id);
    if (!o) throw apiError(404, "ORDER_NOT_FOUND", "Order not found.");
    const prev = o.attempts.find((a) => a.paymentId === p.id);
    const rank = { authorized: 0, failed: 1, captured: 2 };
    if (!prev || rank[p.status] > rank[prev.status]) {
      const a = {
        paymentId: p.id,
        status: p.status,
        amount: p.amount,
        method: p.method || "",
        at: new Date((p.created_at || Date.now() / 1000) * 1000),
        errorCode:
          p.status === "failed"
            ? String(p.error_code || "PAYMENT_FAILED").slice(0, 80)
            : "",
      };
      if (prev) Object.assign(prev, a);
      else o.attempts.push(a);
    }
    if (p.status === "captured" && o.paymentStatus !== "paid") {
      o.paymentStatus = "paid";
      o.status = "awaiting_dispatch";
      o.paidAt = new Date();
      o.paidPaymentId = p.id;
      o.timeline.push(
        { event: "Payment completed", at: o.paidAt },
        { event: "Awaiting dispatch", at: o.paidAt },
      );
    } else if (o.paymentStatus !== "paid")
      o.paymentStatus = o.attempts.some((a) => a.status === "authorized")
        ? "pending"
        : o.attempts.some((a) => a.status === "failed")
          ? "failed"
          : "pending";
    try {
      if (o.isModified()) await o.save();
      await orders.publish(o);
      return o;
    } catch (e) {
      if (e.name !== "VersionError") throw e;
    }
  }
  throw apiError(
    409,
    "PAYMENT_SYNC_BUSY",
    "Payment is being processed. Refresh order status.",
  );
}
async function verify(order, body) {
  const { secret } = credentials();
  if (
    body.razorpay_order_id !== order.gatewayOrderId ||
    !signature(
      secret,
      `${order.gatewayOrderId}|${body.razorpay_payment_id}`,
      body.razorpay_signature,
    )
  )
    throw apiError(
      400,
      "INVALID_PAYMENT_SIGNATURE",
      "Payment signature invalid.",
    );
  const p = await gateway(`/payments/${body.razorpay_payment_id}`);
  return apply(order, p);
}
async function sync(order) {
  if (!order.gatewayOrderId) return order;
  for (let skip = 0; skip < 500; skip += 100) {
    const r = await gateway(
      `/orders/${order.gatewayOrderId}/payments?count=100&skip=${skip}`,
    );
    const items = r.items || [];
    for (const p of items) order = await apply(order, p);
    if (items.length < 100) break;
  }
  await orders.publish(order);
  return order;
}
async function webhook(raw, sig) {
  if (
    !Buffer.isBuffer(raw) ||
    !signature(process.env.RAZORPAY_WEBHOOK_SECRET, raw, sig)
  )
    throw apiError(401, "INVALID_WEBHOOK", "Invalid webhook signature.");
  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    throw apiError(400, "INVALID_WEBHOOK", "Invalid webhook payload.");
  }
  if (
    ![
      "payment.captured",
      "payment.failed",
      "payment.authorized",
      "order.paid",
    ].includes(event.event)
  )
    return;
  const p = event.payload?.payment?.entity;
  const gatewayId = p?.order_id || event.payload?.order?.entity?.id;
  if (!gatewayId) return;
  const o = await Order.findOne({ gatewayOrderId: gatewayId });
  if (!o) return;
  if (p?.id && /^pay_[A-Za-z0-9]+$/.test(p.id))
    await apply(o, await gateway(`/payments/${p.id}`));
  else await sync(o);
}
module.exports = { checkout, verify, sync, webhook, signature, apply };
