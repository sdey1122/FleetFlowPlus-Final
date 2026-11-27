const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventKey: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    kind: {
      type: String,
      enum: ["welcome", "account", "security", "contact", "order", "payment"],
      required: true,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ recipient: 1, eventKey: 1 }, { unique: true });
schema.index({ recipient: 1, createdAt: -1 });
schema.index({ recipient: 1, readAt: 1 });
module.exports = mongoose.model("Notification", schema);
