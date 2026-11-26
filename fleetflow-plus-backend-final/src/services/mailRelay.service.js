const { RELAY_PATH, relayHeaders } = require("../utils/mailRelaySignature");

const sendViaRelay = async (purpose, user, otp, reverifyToken) => {
  const body = JSON.stringify({
    purpose,
    user: { name: user.name, email: user.email },
    otp,
    ...(purpose === "verify" ? { reverifyToken } : {}),
  });
  const endpoint = new URL(RELAY_PATH, process.env.EMAIL_SERVICE_URL);
  if (endpoint.protocol !== "https:") throw new Error("Mail relay requires HTTPS");

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: relayHeaders(process.env.EMAIL_SERVICE_SECRET, body),
      body,
      redirect: "error", // never forward signed credentials to another origin
      signal: AbortSignal.timeout(45000),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error("Relay rejected delivery");
  } catch {
    // No automatic retry: a timeout can occur after SMTP accepted the message.
    const error = new Error("Remote OTP email delivery failed");
    error.code = "EMAIL_RELAY_FAILED";
    throw error;
  }
};

module.exports = { sendViaRelay };
