const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { createHmac } = require("node:crypto");
let o,
  remote,
  paid,
  providerPayment,
  creates = 0,
  publishes = 0;
const init = () => {
  creates = publishes = 0;
  paid = false;
  providerPayment = null;
  remote = null;
  o = {
    id: "local",
    number: "FFP-TEST",
    price: { total: 12345 },
    gatewayState: "new",
    paymentStatus: "pending",
    status: "payment_pending",
    attempts: [],
    timeline: [],
    isModified: () => true,
    save: async () => {},
  };
};
const Model = {
  findById: async () => o,
  findOne: async (q) => (q.gatewayOrderId === o.gatewayOrderId ? o : null),
  findOneAndUpdate: async (q, u) => {
    if (q.gatewayState && q.gatewayState !== o.gatewayState) return null;
    if (q.gatewayOrderId?.$exists === false && o.gatewayOrderId) return null;
    Object.assign(o, u.$set);
    return o;
  },
  updateOne: async (q, u) => {
    if (q.gatewayState === o.gatewayState) Object.assign(o, u.$set);
  },
};
const gateway = async (path, body) => {
  if (path === "/orders" && body) {
    creates++;
    remote = {
      id: "order_ABCD",
      amount: body.amount,
      currency: "INR",
      receipt: body.receipt,
      notes: body.notes,
    };
    return remote;
  }
  if (path.startsWith("/orders?")) return { items: remote ? [remote] : [] };
  if (path.includes("/payments?"))
    return { items: providerPayment ? [providerPayment] : [] };
  if (path.startsWith("/payments/")) return providerPayment;
  if (path === "/orders/order_ABCD")
    return {
      ...remote,
      status: paid ? "paid" : "attempted",
      amount_paid: paid ? 12345 : 0,
    };
  throw new Error("Unexpected " + path);
};
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === "../model/order.model") return Model;
  if (name === "../config/razorpay")
    return {
      gateway,
      credentials: () => ({ id: "rzp_test_example", secret: "secret" }),
    };
  if (name === "./order.service")
    return {
      view: (x) => x,
      publish: async () => {
        publishes++;
      },
    };
  return load.call(this, name, ...args);
};
let service;
try {
  service = require("../src/services/payment.service");
} finally {
  Module._load = load;
}
process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-test-secret";
const sign = (secret, body) =>
  createHmac("sha256", secret).update(body).digest("hex");
const payment = (status) => ({
  id: "pay_ABCD",
  order_id: "order_ABCD",
  amount: 12345,
  currency: "INR",
  status,
  method: "upi",
  created_at: 1700000000,
  error_code: status === "failed" ? "BAD_REQUEST_ERROR" : undefined,
});
test("signature rejects tampered raw bodies and invalid hex", () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const sig = sign("s", body);
  assert.ok(service.signature("s", body, sig));
  assert.ok(!service.signature("s", Buffer.from("{}"), sig));
  assert.ok(!service.signature("s", body, "xyz"));
});
test("checkout uses one gateway order per shipment and preserves server amount", async () => {
  init();
  const a = await service.checkout(o);
  const b = await service.checkout(o);
  assert.equal(a.order.gatewayOrderId, b.order.gatewayOrderId);
  assert.equal(creates, 1);
  assert.equal(remote.amount, 12345);
});
test("ambiguous gateway response reconciles by exact receipt without duplicate creation", async () => {
  init();
  await service.checkout(o);
  delete o.gatewayOrderId;
  o.gatewayState = "uncertain";
  await service.checkout(o);
  assert.equal(creates, 1);
  assert.equal(o.gatewayOrderId, "order_ABCD");
});
test("failed payment persists, valid captured payment upgrades order once, stale failure cannot demote", async () => {
  init();
  await service.checkout(o);
  await service.apply(o, payment("failed"));
  assert.equal(o.paymentStatus, "failed");
  assert.equal(o.attempts.length, 1);
  providerPayment = payment("captured");
  paid = true;
  const r = {
    razorpay_order_id: "order_ABCD",
    razorpay_payment_id: "pay_ABCD",
    razorpay_signature: sign("secret", "order_ABCD|pay_ABCD"),
  };
  await service.verify(o, r);
  await service.verify(o, r);
  await service.apply(o, payment("failed"));
  assert.equal(o.paymentStatus, "paid");
  assert.equal(o.status, "awaiting_dispatch");
  assert.equal(o.attempts.length, 1);
  assert.equal(o.timeline.length, 2);
});
test("rejects invalid signature, wrong amount and unconfirmed capture", async () => {
  init();
  await service.checkout(o);
  await assert.rejects(
    () =>
      service.verify(o, {
        razorpay_order_id: "order_ABCD",
        razorpay_payment_id: "pay_ABCD",
        razorpay_signature: "0".repeat(64),
      }),
    (e) => e.code === "INVALID_PAYMENT_SIGNATURE",
  );
  await assert.rejects(
    () => service.apply(o, { ...payment("failed"), amount: 1 }),
    (e) => e.code === "PAYMENT_MISMATCH",
  );
  await assert.rejects(
    () => service.apply(o, payment("captured")),
    (e) => e.code === "PAYMENT_CAPTURE_PENDING",
  );
  assert.notEqual(o.paymentStatus, "paid");
});
test("authorized payment prevents another checkout until capture is resolved", async () => {
  init();
  await service.checkout(o);
  await service.apply(o, payment("authorized"));
  assert.equal(o.paymentStatus, "pending");
  await assert.rejects(
    () => service.checkout(o),
    (e) => e.code === "PAYMENT_CAPTURE_PENDING",
  );
});
