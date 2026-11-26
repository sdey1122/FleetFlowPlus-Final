const router = require("express").Router();
const connectDB = require("../config/dbcon");
const redis = require("../config/redis");
router.get("/health", async (req, res) => {
  await connectDB();
  await redis.ping();
  return res.json({ success: true, message: "FleetFlow Plus is healthy." });
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
module.exports = router;
