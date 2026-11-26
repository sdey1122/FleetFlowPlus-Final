const router = require("express").Router();
const controller = require("../controller/auth.controller");
const schemas = require("../validation/auth.validation");
const validate = require("../validation");
const rate = require("../middleware/rateLimit.middleware");
const authenticate = require("../middleware/auth.middleware");
const { apiError } = require("../utils/apiResponse");
const requireJSON = (req, res, next) => {
  if (!req.is("application/json"))
    return next(apiError(415, "JSON_REQUIRED", "Use application/json."));
  next();
};
const cookieGuard = (req, res, next) => {
  if (req.get("X-FleetFlow-Client") !== "web")
    return next(
      apiError(
        403,
        "CLIENT_HEADER_REQUIRED",
        "X-FleetFlow-Client: web is required.",
      ),
    );
  next();
};
const perEmail = (bucket, n, seconds) =>
  rate(bucket, n, seconds, (req) => req.body.email);
router.post(
  "/register",
  requireJSON,
  rate("register-ip", 10, 3600),
  validate(schemas.register),
  controller.register,
);
router.post(
  "/verify-email",
  requireJSON,
  rate("verify-ip", 40, 300),
  validate(schemas.verifyEmail),
  perEmail("verify-email", 20, 300),
  controller.verifyEmail,
);
router.post(
  "/resend-otp",
  requireJSON,
  rate("resend-ip", 20, 600),
  validate(schemas.resendOTP),
  controller.resendOTP,
);
router.post(
  "/login",
  requireJSON,
  rate("login-ip", 40, 900),
  validate(schemas.login),
  perEmail("login-email", 10, 900),
  controller.login,
);
router.post(
  "/refresh-token",
  requireJSON,
  cookieGuard,
  rate("refresh-ip", 120, 60),
  validate(schemas.empty),
  controller.refresh,
);
router.post(
  "/forgot-password",
  requireJSON,
  rate("forgot-ip", 20, 600),
  validate(schemas.forgotPassword),
  perEmail("forgot-email", 5, 600),
  controller.forgotPassword,
);
router.post(
  "/reset-password",
  requireJSON,
  rate("reset-ip", 40, 300),
  validate(schemas.resetPassword),
  perEmail("reset-email", 20, 300),
  controller.resetPassword,
);
router.post(
  "/logout",
  requireJSON,
  cookieGuard,
  validate(schemas.empty),
  controller.logout,
);
router.get("/me", authenticate, controller.me);
module.exports = router;
