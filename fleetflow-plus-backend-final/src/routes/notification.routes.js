const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const rate = require("../middleware/rateLimit.middleware");
const c = require("../controller/notification.controller");
const { apiError } = require("../utils/apiResponse");
router.use(
  auth,
  rate("notifications", 180, 60, (req) => req.user.id),
);
router.get("/", c.list);
router.patch("/read-all", c.markAll);
router.patch(
  "/:id/read",
  (req, res, next) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id))
      return next(apiError(400, "INVALID_ID", "Invalid notification ID"));
    next();
  },
  c.markOne,
);
module.exports = router;
