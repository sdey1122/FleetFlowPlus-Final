const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const rate = require("../middleware/rateLimit.middleware");
const validate = require("../validation");
const s = require("../validation/shipment.validation");
const c = require("../controller/shipment.controller");
router.get("/places", rate("places", 90, 60), c.search);
router.post("/route", rate("routes", 30, 60), validate(s.route), c.route);
router.use(
  auth,
  role("customer"),
  rate("shipment", 120, 60, (req) => req.user.id),
);
router.patch(
  "/profile",
  rate("profile", 8, 600, (req) => req.user.id),
  validate(require("../validation/profile.validation")),
  require("../controller/profile.controller").update,
);
router.post(
  "/quotes",
  rate("quotes", 15, 60, (req) => req.user.id),
  validate(s.quote),
  c.quote,
);
router.get("/overview", c.overview);
router.get("/orders", c.list);
router.post("/orders", validate(s.checkout), c.checkout);
router.get("/orders/:id", c.detail);
router.post("/orders/:id/checkout", validate(s.empty), c.retry);
router.post("/orders/:id/verify", validate(s.verify), c.verify);
router.post("/orders/:id/sync", validate(s.empty), c.sync);
router.get("/orders/:id/receipts/:paymentId", c.receipt);
module.exports = router;
