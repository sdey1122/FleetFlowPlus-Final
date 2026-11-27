const express = require("express");
const Joi = require("joi");
const { getEnv } = require("../config/env");
const redis = require("../config/redis");
const { apiError } = require("../utils/apiResponse");
const { verifyRelay, MAX_CLOCK_SKEW } = require("../utils/mailRelaySignature");
const { sendViaSMTP } = require("../services/mail.service");
const rateLimit = require("../middleware/rateLimit.middleware");

const router = express.Router();
const schema = Joi.object({
  purpose: Joi.string().valid("verify", "reset").required(),
  user: Joi.object({
    name: Joi.string().trim().min(3).max(32).required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(254)
      .required(),
  }).required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
  reverifyToken: Joi.when("purpose", {
    is: "verify",
    then: Joi.string().max(4096).required(),
    otherwise: Joi.forbidden(),
  }),
}).required();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  const env = getEnv();
  if (!env.emailRelayEnabled || env.emailDeliveryMode !== "smtp") {
    return next(apiError(404, "NOT_FOUND", "Requested route not found."));
  }
  next();
});

router.post(
  "/",
  express.raw({ type: "application/json", limit: "16kb" }),
  async (req, res, next) => {
    const nonce = req.get("X-FleetFlow-Mail-Nonce");
    const valid = verifyRelay({
      secret: process.env.EMAIL_SERVICE_SECRET,
      timestamp: req.get("X-FleetFlow-Mail-Timestamp"),
      nonce,
      signature: req.get("X-FleetFlow-Mail-Signature"),
      body: req.body,
    });
    if (!valid)
      throw apiError(401, "RELAY_UNAUTHORIZED", "Invalid relay credentials.");
    // Atomic replay protection, shared by all Vercel instances.
    const reserved = await redis.setIfAbsent(
      `mail-relay:nonce:${nonce}`,
      "1",
      MAX_CLOCK_SKEW * 2 + 5,
    );
    if (reserved !== "OK")
      throw apiError(409, "RELAY_REPLAY", "Request already received.");
    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      throw apiError(400, "INVALID_RELAY_BODY", "Invalid mail request.");
    }
    const { error, value } = schema.validate(payload, {
      allowUnknown: false,
      convert: false,
    });
    if (error)
      throw apiError(400, "INVALID_RELAY_BODY", "Invalid mail request.");
    req.body = value;
    next();
  },
  rateLimit("relay-global", 120, 60, () => "mail-service"),
  rateLimit("relay-recipient", 12, 600, (req) =>
    req.body.user.email.toLowerCase(),
  ),
  async (req, res) => {
    const { purpose, user, otp, reverifyToken } = req.body;
    // Never call sendOTP here: this endpoint always sends directly via SMTP.
    await sendViaSMTP(purpose, user, otp, reverifyToken);
    return res
      .status(200)
      .json({ success: true, message: "Email accepted by SMTP." });
  },
);

module.exports = router;
