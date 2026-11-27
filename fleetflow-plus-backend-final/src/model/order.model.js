const mongoose = require("mongoose");
const attempt = new mongoose.Schema(
  {
    paymentId: { type: String, required: true },
    status: {
      type: String,
      enum: ["authorized", "failed", "captured"],
      required: true,
    },
    amount: Number,
    method: String,
    at: Date,
    errorCode: String,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    number: { type: String, required: true, unique: true },
    trackingId: { type: String, required: true, unique: true },
    customerSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    shipment: { type: mongoose.Schema.Types.Mixed, required: true },
    route: { type: mongoose.Schema.Types.Mixed, required: true },
    price: { type: mongoose.Schema.Types.Mixed, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "failed", "paid"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "payment_pending",
        "awaiting_dispatch",
        "dispatcher_assigned",
        "driver_assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "payment_pending",
    },
    gatewayState: {
      type: String,
      enum: ["new", "creating", "ready", "uncertain"],
      default: "new",
    },
    gatewayOrderId: { type: String },
    attempts: { type: [attempt], default: [] },
    paidAt: Date,
    paidPaymentId: String,
    dispatcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    timeline: {
      type: [new mongoose.Schema({ event: String, at: Date }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ customer: 1, createdAt: -1 });
schema.index({ customer: 1, paymentStatus: 1, paidAt: 1 });
schema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true });
schema.index({ status: 1, createdAt: 1 });
module.exports = mongoose.model("ShipmentOrder", schema);
