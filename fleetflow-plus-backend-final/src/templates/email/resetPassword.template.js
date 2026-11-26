const { baseTemplate } = require("./base.template");
const { getEnv } = require("../../config/env");

const resetPasswordTemplate = ({ name, otp }) =>
  baseTemplate({
    label: "ACCOUNT SECURITY / PASSWORD RECOVERY",

    title: "Reset your password.",

    name,

    body: "We received a request to reset the password associated with your FleetFlow Plus account.",

    additionalBody:
      "To continue, enter the following one-time code in the password reset window and create a new password.",

    otp,

    codeLabel: "PASSWORD RESET CODE",

    actionUrl: `${getEnv().frontend}/#reset-password`,

    actionText: "Continue password reset",

    securityTitle: "Didn't request a password reset?",

    securityNote:
      "You can safely ignore this email. Your current password will remain unchanged unless the reset process is completed. Never share this code with anyone, including our support team.",

    tagline: "Your security. Our responsibility.",

    signature: "FleetFlow Plus Security Team",
  });

module.exports = resetPasswordTemplate;
