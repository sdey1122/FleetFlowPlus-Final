const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shipment: { type: mongoose.Schema.Types.Mixed, required: true },
    route: { type: mongoose.Schema.Types.Mixed, required: true },
    prices: { type: [mongoose.Schema.Types.Mixed], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model("ShipmentQuote", schema);
