// Real Express/JOI route test with fake Redis and SMTP; no network or real secrets needed.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { relayHeaders } = require("../src/utils/mailRelaySignature");
const secret = "test-relay-secret-".repeat(4);

test("relay route rejects unsigned requests, replays and invalid payloads; sends once", async (t) => {
  Object.assign(process.env, { NODE_ENV: "development", RENDER: "false", FRONTEND_URL: "http://localhost:5173", BACKEND_URL: "http://localhost:6050", COOKIE_SAME_SITE: "lax", EMAIL_DELIVERY_MODE: "smtp", EMAIL_RELAY_ENABLED: "true", EMAIL_SERVICE_SECRET: secret, AMP_EMAIL_ENABLED: "false" });
  const seen = new Set();
  const deliveries = [];
  const stub = (path, exports) => { const id = require.resolve(path); require.cache[id] = { id, filename: id, loaded: true, exports }; };
  stub("../src/config/redis", {
    setIfAbsent: async (key) => { if (seen.has(key)) return null; seen.add(key); return "OK"; },
    eval: async () => 1,
  });
  stub("../src/services/mail.service", { sendViaSMTP: async (...args) => { deliveries.push(args); } });
  const app = express();
  app.use("/internal/email/send-otp", require("../src/routes/mailRelay.routes"));
  app.use(require("../src/middleware/error.middleware"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/internal/email/send-otp`;
  const body = JSON.stringify({ purpose: "reset", user: { name: "Test User", email: "user@example.com" }, otp: "000001" });
  const headers = relayHeaders(secret, body);
  const post = (value, h) => fetch(url, { method: "POST", body: value, headers: h });
  assert.equal((await post(body, { "Content-Type": "application/json" })).status, 401);
  assert.equal((await post(body.replace("000001", "000002"), headers)).status, 401);
  assert.equal((await post(body, headers)).status, 200);
  assert.equal((await post(body, headers)).status, 409);
  const bad = JSON.stringify({ ...JSON.parse(body), otp: "123", arbitraryHtml: "bad" });
  assert.equal((await post(bad, relayHeaders(secret, bad))).status, 400);
  process.env.EMAIL_RELAY_ENABLED = "false";
  assert.equal((await post(body, relayHeaders(secret, body))).status, 404);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0][2], "000001");
});
