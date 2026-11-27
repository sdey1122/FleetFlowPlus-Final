const { apiError } = require("../utils/apiResponse");
const credentials = () => {
  const id = process.env.RAZORPAY_KEY_ID,
    secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id?.startsWith("rzp_test_") || !secret)
    throw apiError(
      503,
      "PAYMENT_NOT_CONFIGURED",
      "Razorpay test credentials required.",
    );
  return { id, secret };
};
async function gateway(path, body) {
  const { id, secret } = credentials();
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!r?.ok)
    throw apiError(
      503,
      "PAYMENT_GATEWAY_UNAVAILABLE",
      "Payment gateway unavailable.",
    );
  return r.json();
}
module.exports = { credentials, gateway };
