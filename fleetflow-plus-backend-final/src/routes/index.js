const router = require("express").Router();
const connectDB = require("../config/dbcon");
const redis = require("../config/redis");
router.get("/health", async (req, res) => {
  await connectDB();
  await redis.ping();
  return res.json({
    success: true,
    message: "FleetFlow Plus is healthy.",
    release: "part-2-location-notifications-fix-1",
  });
});
router.use(
  "/auth",
  async (req, res, next) => {
    await connectDB();
    res.set("Cache-Control", "no-store");
    next();
  },
  require("./auth.routes"),
);
const db = async (req, res, next) => {
  await connectDB();
  res.set("Cache-Control", "no-store");
  next();
};
router.use("/notifications", db, require("./notification.routes"));
router.use("/contact", db, require("./contact.routes"));
router.use("/shipments", db, require("./shipment.routes"));
module.exports = router;
