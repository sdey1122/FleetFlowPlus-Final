const { getEnv } = require("../../config/env");

// Prevent HTML injection
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

// Dynamic OTP expiration text
const formatExpiry = (seconds) => {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;

    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
};

// Reusable email template
const baseTemplate = ({
  label,
  title,
  name,
  body,
  otp,
  actionUrl,
  actionText,

  // Customizable content
  codeLabel = "YOUR SECURITY CODE",

  additionalBody = "",

  securityTitle = "Keep your account secure.",

  securityNote = "Never share your security code. If you did not request this, you can safely ignore this email.",

  tagline = "Going further, together.",

  signature = "The FleetFlow Plus Team",
}) => {
  const expiresIn = formatExpiry(getEnv().otpTTL);

  return `
    <!DOCTYPE html>
    <html lang="en">

      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>${escapeHTML(title)}</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background:#EAE7DC;
        color:#292824;
        font-family:Arial,sans-serif;
      ">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
        >

          <tr>
            <td align="center" style="padding:32px 12px;">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width:560px;
                  background:#FAF9F6;
                  border:1px solid #D8C3A5;
                  border-radius:10px;
                "
              >

                <!-- Brand header -->

                <tr>
                  <td style="
                    padding:26px 30px;
                    border-bottom:1px solid #D8C3A5;
                  ">

                    <strong style="
                      font-size:22px;
                      letter-spacing:-0.7px;
                    ">
                      FleetFlow
                      <span style="color:#A83B33;">
                        Plus
                      </span>
                    </strong>

                    <div style="
                      font-size:10px;
                      letter-spacing:2px;
                      margin-top:6px;
                      color:#625E56;
                    ">
                      LOGISTICS IN MOTION
                    </div>

                  </td>
                </tr>

                <!-- Main content -->

                <tr>
                  <td style="
                    padding:28px 30px;
                    font-size:15px;
                    line-height:1.65;
                  ">

                    <div style="
                      color:#A83B33;
                      font-size:11px;
                      letter-spacing:1.5px;
                      font-weight:bold;
                    ">
                      ${escapeHTML(label)}
                    </div>

                    <h1 style="
                      font-size:26px;
                      line-height:1.3;
                      margin:14px 0 20px;
                      font-weight:650;
                    ">
                      ${escapeHTML(title)}
                    </h1>

                    <p>
                      Hi <strong>${escapeHTML(name)}</strong>,
                    </p>

                    <p>
                      ${escapeHTML(body)}
                    </p>

                    ${
                      additionalBody
                        ? `<p>${escapeHTML(additionalBody)}</p>`
                        : ""
                    }

                    <!-- OTP section -->

                    ${
                      otp
                        ? `
                          <div style="
                            padding:22px 12px;
                            background:#EAE7DC;
                            border-left:4px solid #E85A4F;
                            text-align:center;
                            margin:24px 0;
                          ">

                            <div style="
                              font-size:11px;
                              letter-spacing:2px;
                              color:#625E56;
                            ">
                              ${escapeHTML(codeLabel)}
                            </div>

                            <div style="
                              font-family:monospace;
                              font-size:32px;
                              letter-spacing:7px;
                              font-weight:bold;
                              margin:10px 0;
                            ">
                              ${escapeHTML(otp)}
                            </div>

                            <div style="
                              font-size:12px;
                              color:#A83B33;
                            ">
                              Valid for ${escapeHTML(expiresIn)}
                              from generation.
                            </div>

                          </div>
                        `
                        : ""
                    }

                    <!-- Action button -->

                    ${
                      actionUrl
                        ? `
                          <p style="
                            margin:26px 0;
                            text-align:center;
                          ">

                            <a
                              href="${escapeHTML(actionUrl)}"
                              style="
                                display:inline-block;
                                background:#E85A4F;
                                color:#292824;
                                text-decoration:none;
                                padding:13px 22px;
                                border-radius:6px;
                                font-size:14px;
                                font-weight:bold;
                              "
                            >
                              ${escapeHTML(actionText)}
                              &rarr;
                            </a>

                          </p>
                        `
                        : ""
                    }

                    <!-- Security instructions -->

                    <div style="
                      border-top:1px solid #D8C3A5;
                      padding-top:20px;
                      margin-top:26px;
                    ">

                      <strong style="
                        font-size:14px;
                        color:#292824;
                      ">
                        ${escapeHTML(securityTitle)}
                      </strong>

                      <p style="
                        color:#625E56;
                        font-size:13px;
                        line-height:1.7;
                        margin-top:8px;
                      ">
                        ${escapeHTML(securityNote)}
                      </p>

                    </div>

                    <!-- Closing message -->

                    <p style="
                      font-family:Georgia,serif;
                      font-style:italic;
                      color:#A83B33;
                      font-size:15px;
                      margin-top:25px;
                    ">
                      ${escapeHTML(tagline)}
                    </p>

                    <p style="
                      font-weight:600;
                      font-size:13px;
                    ">
                      ${escapeHTML(signature)}
                    </p>

                  </td>
                </tr>

                <!-- Footer -->

                <tr>
                  <td style="
                    padding:20px 30px;
                    background:#D8C3A5;
                    font-size:12px;
                    line-height:1.8;
                  ">

                    <strong>
                      FleetFlow Plus &bull; Account Security
                    </strong>

                    <br>

                    This is an automated email.
                    Please do not reply.

                    <br>

                    &copy; ${new Date().getFullYear()}
                    FleetFlow Plus. All rights reserved.

                  </td>
                </tr>

              </table>

            </td>
          </tr>

        </table>

      </body>
    </html>
  `;
};

module.exports = {
  baseTemplate,
  escapeHTML,
};
