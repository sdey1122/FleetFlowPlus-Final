const router = require("express").Router();
const validate = require("../validation");
const rate = require("../middleware/rateLimit.middleware");
const schema = require("../validation/contact.validation");
const controller = require("../controller/contact.controller");
router.post(
  "/",
  rate("contact-ip", 5, 3600),
  validate(schema),
  controller.submit,
);
module.exports = router;
