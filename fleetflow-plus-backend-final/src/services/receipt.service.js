const PDFDocument = require("pdfkit");
const fs = require("node:fs");
const { apiError } = require("../utils/apiResponse");
const money = (p) => `INR ${(p / 100).toFixed(2)}`;
const date = (d) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
function receipt(order, paymentId, res) {
  const a = order.attempts.find((x) => x.paymentId === paymentId);
  if (!a || !["captured", "failed"].includes(a.status))
    throw apiError(
      404,
      "RECEIPT_NOT_FOUND",
      "No final transaction record found.",
    );
  const paid = a.status === "captured";
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `FleetFlow Plus ${paid ? "receipt" : "transaction report"} ${order.number}`,
    },
  });
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${order.number}-${paymentId}.pdf"`,
    "Cache-Control": "no-store",
  });
  doc.pipe(res);
  const customFont = process.env.RECEIPT_FONT_PATH;
  if (customFont && fs.existsSync(customFont))
    doc.registerFont("ReceiptUnicode", customFont);
  const normalFont =
    customFont && fs.existsSync(customFont) ? "ReceiptUnicode" : "Helvetica";
  const boldFont =
    normalFont === "ReceiptUnicode" ? normalFont : "Helvetica-Bold";
  doc.font(normalFont);
  doc.fillColor("#A6342C").fontSize(24).text("FleetFlow Plus");
  doc
    .fillColor("#282825")
    .fontSize(10)
    .text("LOGISTICS IN MOTION  |  RAZORPAY TEST MODE");
  doc.moveDown();
  doc.fontSize(20).text(paid ? "Payment receipt" : "Failed transaction report");
  doc.fontSize(10).text("Test transaction only. Not a GST tax invoice.");
  doc.moveDown();
  const line = (k, v) => {
    doc.font(boldFont).fontSize(10).text(k);
    doc.font(normalFont).text(String(v ?? "-"));
    doc.moveDown(0.45);
  };
  line("Order / tracking", `${order.number} / ${order.trackingId}`);
  line("Order date (IST)", date(order.createdAt));
  line("Payment attempt / date (IST)", `${a.paymentId} / ${date(a.at)}`);
  line(
    "Payment status / method",
    `${a.status.toUpperCase()} / ${a.method || "-"}`,
  );
  line(
    "Customer",
    `${order.customerSnapshot.name} | ${order.customerSnapshot.email} | ${order.customerSnapshot.phone || "-"}`,
  );
  const s = order.shipment;
  line(
    "Pickup",
    `${s.senderName} | ${s.senderPhone} | ${s.pickupAddress} | ${s.pickup.label}`,
  );
  line(
    "Delivery",
    `${s.recipientName} | ${s.recipientPhone} | ${s.deliveryAddress} | ${s.destination.label}`,
  );
  line(
    "Shipment",
    `${s.category} | ${s.description} | ${s.weight} kg | ${s.length} x ${s.width} x ${s.height} cm`,
  );
  line(
    "Service / distance",
    `${order.price.label} | ${(order.route.distance / 1000).toFixed(1)} km`,
  );
  line("Chargeable weight", `${order.price.chargeable} kg`);
  line("Delivery charge", money(order.price.delivery));
  line("Platform fee", money(order.price.platformFee));
  line("GST (18%)", money(order.price.tax));
  line("Quoted total", money(order.price.total));
  line("Amount paid for this attempt", money(paid ? a.amount : 0));
  if (!paid) line("Failure code", a.errorCode || "PAYMENT_FAILED");
  doc.end();
}
module.exports = { receipt };
