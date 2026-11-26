const express = require("express");

const auth = require("../services/auth.service");
const schemas = require("../validation/auth.validation");
const validate = require("../validation");

const connectDB = require("../config/dbcon");

const rateLimit = require("../middleware/rateLimit.middleware");

const { verifyToken } = require("../utils/generateToken");

const { apiError } = require("../utils/apiResponse");

const router = express.Router();

// Validate AMP email request headers
const ampCors = (req, res, next) => {
  if (process.env.AMP_EMAIL_ENABLED !== "true") {
    return next(apiError(404, "NOT_FOUND", "Route unavailable."));
  }

  const expectedSender = process.env.EMAIL_USER;

  const sender = req.get("AMP-Email-Sender");
  const origin = req.get("Origin");
  const legacySender = req.query.__amp_source_origin;

  res.set("Cache-Control", "no-store");
  res.vary("Origin");
  res.vary("AMP-Email-Sender");

  // Gmail origin for legacy AMP CORS requests
  if (origin) {
    if (origin !== "https://mail.google.com") {
      return next(apiError(403, "INVALID_ORIGIN", "Invalid origin."));
    }

    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, AMP-Email-Sender");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
  }

  // AMP CORS version 2
  if (sender && sender === expectedSender) {
    res.set("AMP-Email-Allow-Sender", sender);

    return next();
  }

  // AMP CORS version 1
  if (
    !sender &&
    origin === "https://mail.google.com" &&
    legacySender === expectedSender
  ) {
    res.set("AMP-Access-Control-Allow-Source-Origin", expectedSender);

    res.set(
      "Access-Control-Expose-Headers",
      "AMP-Access-Control-Allow-Source-Origin",
    );

    return next();
  }

  return next(apiError(403, "INVALID_EMAIL_SENDER", "Invalid email sender."));
};

router.use(ampCors);

router.use(
  express.urlencoded({
    extended: false,
    limit: "16kb",
  }),
);

router.post(
  "/",

  rateLimit("amp-resend-ip", 120, 600),

  validate(schemas.resendOTP),

  (req, res, next) => {
    req.reverifyClaims = verifyToken("reverify", req.body.reverifyToken);

    next();
  },

  // Prevent repeated requests for the same account
  rateLimit("amp-resend-account", 5, 600, (req) => req.reverifyClaims.sub),

  async (req, res) => {
    await connectDB();

    await auth.resendOTP(req.body);

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully.",
    });
  },
);

module.exports = router;
