const { escapeHTML } = require("./base.template");
const { getEnv } = require("../../config/env");

const verifyEmailAMP = ({ name, otp, reverifyToken }) => {
  const endpoint = new URL("/auth/email-resend", getEnv().ampResendBackend);

  if (endpoint.protocol !== "https:") {
    throw new Error("AMP email requires an HTTPS backend");
  }

  return `
    <!doctype html>
    <html amp4email>
      <head>
        <meta charset="utf-8">

        <script async
          src="https://cdn.ampproject.org/v0.js">
        </script>

        <script async custom-element="amp-form"
          src="https://cdn.ampproject.org/v0/amp-form-0.1.js">
        </script>

        <style amp4email-boilerplate>
          body { visibility: hidden }
        </style>

        <style amp-custom>
          body {
            font-family: Arial, sans-serif;
            background: #EAE7DC;
            color: #292824;
            margin: 0;
            padding: 20px;
          }

          .container {
            max-width: 540px;
            margin: auto;
            background: #FAF9F6;
            padding: 26px;
            border: 1px solid #D8C3A5;
            border-radius: 10px;
          }

          .brand {
            font-size: 23px;
            font-weight: 700;
          }

          .accent {
            color: #B8463D;
          }

          .subtitle {
            font-size: 11px;
            letter-spacing: 2px;
          }

          h2 {
            font-size: 24px;
            line-height: 1.4;
          }

          p {
            font-size: 15px;
            line-height: 1.7;
          }

          .otp-box {
            background: #EAE7DC;
            padding: 22px;
            text-align: center;
            border-left: 4px solid #E85A4F;
          }

          .otp {
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 7px;
            margin: 12px 0;
          }

          button {
            background: #E85A4F;
            color: #292824;
            border: none;
            border-radius: 6px;
            padding: 13px 22px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          }

          .success {
            color: #246B45;
            font-size: 14px;
            padding: 12px 0;
          }

          .error {
            color: #B8463D;
            font-size: 14px;
            padding: 12px 0;
          }

          .footer {
            margin-top: 25px;
            border-top: 1px solid #D8C3A5;
            padding-top: 16px;
            font-size: 12px;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="brand">
            FleetFlow <span class="accent">Plus</span>
          </div>

          <div class="subtitle">
            LOGISTICS IN MOTION
          </div>

          <h2>Your journey starts here.</h2>

          <p>Hi ${escapeHTML(name)},</p>

          <p>
            Verify your email address using the security
            code below.
          </p>

          <div class="otp-box">
            YOUR SECURITY CODE

            <div class="otp">
              ${escapeHTML(otp)}
            </div>

            Valid for ${getEnv().otpTTL} seconds from generation.
          </div>

          <p>
            Has your verification code expired?
            Request a fresh code directly from this email.
          </p>

          <form
            method="post"
            action-xhr="${escapeHTML(endpoint.href)}"
          >
            <input
              type="hidden"
              name="reverifyToken"
              value="${escapeHTML(reverifyToken)}"
            >

            <button type="submit">
              Request New OTP
            </button>

            <div submitting>
              Sending your new verification code...
            </div>

            <div submit-success class="success">
              New OTP sent successfully.
              Please check your inbox.
            </div>

            <div submit-error class="error">
              Unable to send a new OTP.
              Please wait ${getEnv().cooldown} seconds or request a code
              from FleetFlow Plus.
            </div>
          </form>

          <p>
            Never share your security code with anyone.
          </p>

          <div class="footer">
            <i>Going further, together.</i>

            <p>FleetFlow Plus — Account Security</p>
          </div>

        </div>
      </body>
    </html>
  `;
};

module.exports = verifyEmailAMP;
