const { createHmac, randomUUID, timingSafeEqual } = require("node:crypto");

const RELAY_PATH = "/internal/email/send-otp";
const MAX_CLOCK_SKEW = 60; // seconds
const nowSeconds = () => Math.floor(Date.now() / 1000);

const signRelay = (secret, timestamp, nonce, body) => createHmac("sha256", secret)
  .update(`POST\n${RELAY_PATH}\n${timestamp}\n${nonce}\n`)
  .update(body)
  .digest("hex");

const relayHeaders = (secret, body, now = nowSeconds()) => {
  const timestamp = String(now);
  const nonce = randomUUID();
  return {
    "Content-Type": "application/json",
    "X-FleetFlow-Mail-Timestamp": timestamp,
    "X-FleetFlow-Mail-Nonce": nonce,
    "X-FleetFlow-Mail-Signature": signRelay(secret, timestamp, nonce, body),
  };
};

const verifyRelay = ({ secret, timestamp, nonce, signature, body, now = nowSeconds() }) => {
  if (!secret || !/^\d{10}$/.test(timestamp || "") ||
      Math.abs(now - Number(timestamp)) > MAX_CLOCK_SKEW ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(nonce || "") ||
      !/^[a-f0-9]{64}$/.test(signature || "") || !Buffer.isBuffer(body)) return false;
  const expected = signRelay(secret, timestamp, nonce, body);
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
};

module.exports = { RELAY_PATH, MAX_CLOCK_SKEW, relayHeaders, verifyRelay };
