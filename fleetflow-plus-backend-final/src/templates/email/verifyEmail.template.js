const { baseTemplate } = require("./base.template");

const verifyEmailTemplate = ({ name, otp }) =>
  baseTemplate({
    label: "ACCOUNT VERIFICATION",

    title: "Welcome aboard.",

    name,

    body: "Thank you for joining FleetFlow Plus. You're one step closer to a smarter, better-connected logistics experience.",

    additionalBody:
      "To activate your account, enter the verification code below in the email verification window. If your code expires, request a fresh code.",

    otp,

    codeLabel: "EMAIL VERIFICATION CODE",

    securityTitle: "A quick security reminder.",

    securityNote:
      "This verification code is intended only for you. Never share it with anyone. If you did not create a FleetFlow Plus account, you can safely ignore this email.",

    tagline: "Every great journey starts somewhere.",

    signature: "The FleetFlow Plus Team",
  });

module.exports = verifyEmailTemplate;
