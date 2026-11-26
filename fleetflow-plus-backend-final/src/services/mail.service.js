const nodemailer = require("nodemailer");
const { getEnv } = require("../config/env");
const { sendViaRelay } = require("./mailRelay.service");

const verifyTemplate = require("../templates/email/verifyEmail.template");

const verifyAMPTemplate = require("../templates/email/verifyEmail.amp");

const resetTemplate = require("../templates/email/resetPassword.template");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,

      port: Number(process.env.EMAIL_PORT || 587),

      secure: process.env.EMAIL_SECURE === "true",

      requireTLS: process.env.EMAIL_SECURE !== "true",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }

  return transporter;
};

const sendViaSMTP = async (purpose, user, otp, reverifyToken) => {
  if (getEnv().emailDeliveryMode !== "smtp") {
    throw new Error("Direct SMTP is disabled in remote mode");
  }
  const verify = purpose === "verify";

  const html = verify
    ? verifyTemplate({
        name: user.name,
        otp,
      })
    : resetTemplate({
        name: user.name,
        otp,
      });

  const mailOptions = {
    from: process.env.EMAIL_FROM,

    to: user.email,

    subject: verify
      ? "Welcome to FleetFlow Plus — Verify your email"
      : "FleetFlow Plus Security — Password reset request",

    html,

    text: `
      Hi ${user.name},

      Your FleetFlow Plus ${
        verify ? "verification" : "password reset"
      } code is ${otp}.

      Valid for ${getEnv().otpTTL} seconds from generation.

      Never share this code.

      If your code expires, request a new one
      from FleetFlow Plus.
    `,
  };

  // Include interactive email content when enabled
  if (verify && process.env.AMP_EMAIL_ENABLED === "true") {
    mailOptions.amp = verifyAMPTemplate({
      name: user.name,
      otp,
      reverifyToken,
    });
  }

  const result = await getTransporter().sendMail(mailOptions);

  if (!result.accepted?.length) {
    throw new Error("SMTP did not accept recipient");
  }
};

// Keep the existing signature used by auth.service.js.
const sendOTP = async (purpose, user, otp, reverifyToken) => {
  if (getEnv().emailDeliveryMode === "remote") {
    return sendViaRelay(purpose, user, otp, reverifyToken);
  }
  return sendViaSMTP(purpose, user, otp, reverifyToken);
};

module.exports = { sendOTP, sendViaSMTP };
