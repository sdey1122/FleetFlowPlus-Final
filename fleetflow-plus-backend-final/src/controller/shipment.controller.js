const { success, apiError } = require("../utils/apiResponse");
const orders = require("../services/order.service");
const pay = require("../services/payment.service");
const routing = require("../services/routing.service");
const { receipt } = require("../services/receipt.service");
exports.search = async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 3 || q.length > 160)
    throw apiError(400, "INVALID_SEARCH", "Enter 3–160 characters.");
  return success(
    res,
    200,
    "Locations",
    await routing.search(q, req.query.autocomplete === "true"),
  );
};
exports.route = async (req, res) =>
  success(
    res,
    200,
    "Route calculated",
    await routing.route(req.body.pickup, req.body.destination),
  );
exports.quote = async (req, res) =>
  success(res, 201, "Quote created", await orders.quote(req.user, req.body));
exports.checkout = async (req, res) =>
  success(
    res,
    200,
    "Checkout ready",
    await pay.checkout(await orders.create(req.user, req.body)),
  );
exports.retry = async (req, res) => {
  let o = await orders.own(req.user, req.params.id);
  if (o.gatewayOrderId) o = await pay.sync(o);
  return success(res, 200, "Checkout ready", await pay.checkout(o));
};
exports.verify = async (req, res) =>
  success(
    res,
    200,
    "Payment status verified",
    orders.view(
      await pay.verify(await orders.own(req.user, req.params.id), req.body),
    ),
  );
exports.sync = async (req, res) =>
  success(
    res,
    200,
    "Payment status synchronized",
    orders.view(await pay.sync(await orders.own(req.user, req.params.id))),
  );
exports.list = async (req, res) =>
  success(res, 200, "Orders retrieved", await orders.list(req.user, req.query));
exports.overview = async (req, res) =>
  success(
    res,
    200,
    "Customer overview",
    await orders.overview(
      req.user,
      req.query.months,
      req.query.year,
      req.query.grouping,
    ),
  );
exports.detail = async (req, res) =>
  success(
    res,
    200,
    "Order retrieved",
    orders.view(await orders.own(req.user, req.params.id)),
  );
exports.receipt = async (req, res) =>
  receipt(await orders.own(req.user, req.params.id), req.params.paymentId, res);
exports.webhook = async (req, res) => {
  await pay.webhook(req.body, req.get("X-Razorpay-Signature"));
  res.json({ success: true });
};
