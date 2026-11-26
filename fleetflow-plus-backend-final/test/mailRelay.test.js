const test = require("node:test");
const assert = require("node:assert/strict");
const { relayHeaders, verifyRelay, RELAY_PATH } = require("../src/utils/mailRelaySignature");
const { sendViaRelay } = require("../src/services/mailRelay.service");
const { validateEnv } = require("../src/config/env");

const secret = "test-relay-secret-".repeat(4);
const user = { name: "Test User", email: "user@example.com", password: "do-not-forward" };
const body = Buffer.from(JSON.stringify({ purpose: "reset", user: { name: user.name, email: user.email }, otp: "000001" }));

test("relay signature rejects body tampering, wrong secret and stale/future timestamps", () => {
  const now = 1790000000;
  const headers = relayHeaders(secret, body, now);
  const args = {
    secret, now, body,
    timestamp: headers["X-FleetFlow-Mail-Timestamp"],
    nonce: headers["X-FleetFlow-Mail-Nonce"],
    signature: headers["X-FleetFlow-Mail-Signature"],
  };
  assert.equal(verifyRelay(args), true);
  assert.equal(verifyRelay({ ...args, body: Buffer.from("modified") }), false);
  assert.equal(verifyRelay({ ...args, secret: "incorrect" }), false);
  assert.equal(verifyRelay({ ...args, now: now + 61 }), false);
  assert.equal(verifyRelay({ ...args, now: now - 61 }), false);
  assert.equal(verifyRelay({ ...args, signature: "invalid" }), false);
  assert.notEqual(relayHeaders(secret, body, now)["X-FleetFlow-Mail-Nonce"], args.nonce);
});

test("remote send forwards only necessary fields with valid HMAC and no redirects", async (t) => {
  process.env.EMAIL_SERVICE_URL = "https://mail.example.com";
  process.env.EMAIL_SERVICE_SECRET = secret;
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  let called = 0;
  global.fetch = async (url, options) => {
    called++;
    assert.equal(url.href, `https://mail.example.com${RELAY_PATH}`);
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.deepEqual(JSON.parse(options.body), {
      purpose: "verify", user: { name: user.name, email: user.email }, otp: "000001", reverifyToken: "test-token",
    });
    assert.equal(verifyRelay({ secret, body: Buffer.from(options.body),
      timestamp: options.headers["X-FleetFlow-Mail-Timestamp"],
      nonce: options.headers["X-FleetFlow-Mail-Nonce"],
      signature: options.headers["X-FleetFlow-Mail-Signature"], }), true);
    return { ok: true, json: async () => ({ success: true }) };
  };
  await sendViaRelay("verify", user, "000001", "test-token");
  assert.equal(called, 1);
  global.fetch = async (url, options) => {
    assert.equal(JSON.parse(options.body).reverifyToken, undefined);
    return { ok: false, json: async () => ({ success: false }) };
  };
  await assert.rejects(sendViaRelay("reset", user, "000001"), { code: "EMAIL_RELAY_FAILED" });
  global.fetch = async () => { throw new Error("timeout"); };
  await assert.rejects(sendViaRelay("reset", user, "000001"), { code: "EMAIL_RELAY_FAILED" });
});

test("environment accepts local testing and remote Render without SMTP password; rejects invalid production settings", (t) => {
  const original = { ...process.env };
  t.after(() => { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); });
  Object.assign(process.env, {
    NODE_ENV: "development", RENDER: "false", FRONTEND_URL: "http://localhost:5173", BACKEND_URL: "http://localhost:6050",
    COOKIE_SAME_SITE: "lax", AMP_EMAIL_ENABLED: "false", EMAIL_DELIVERY_MODE: "smtp", EMAIL_RELAY_ENABLED: "false",
    MONGODB_URI: "mongodb://localhost:27017/test", ADMIN_EMAIL: "admin@example.com", UPSTASH_REDIS_REST_URL: "https://redis.example.com",
    UPSTASH_REDIS_REST_TOKEN: "fake", EMAIL_HOST: "smtp.example.com", EMAIL_USER: "sender@example.com", EMAIL_PASS: "fake", EMAIL_FROM: "sender@example.com",
    JWT_ACCESS_SECRET: "a".repeat(64), JWT_REFRESH_SECRET: "b".repeat(64), JWT_REVERIFY_SECRET: "c".repeat(64), OTP_SECRET: "d".repeat(64),
    OTP_EXPIRES_IN: "300", OTP_RESEND_COOLDOWN: "5", OTP_MAX_ATTEMPTS: "99",
  });
  assert.equal(validateEnv().attempts, 99);
  Object.assign(process.env, { NODE_ENV: "production", RENDER: "true", FRONTEND_URL: "https://front.example.com", BACKEND_URL: "https://api.example.com",
    EMAIL_DELIVERY_MODE: "remote", EMAIL_SERVICE_URL: "https://mail.example.com", EMAIL_SERVICE_SECRET: secret,
    OTP_EXPIRES_IN: "60", OTP_RESEND_COOLDOWN: "60", OTP_MAX_ATTEMPTS: "5" });
  delete process.env.EMAIL_PASS;
  assert.equal(validateEnv().emailDeliveryMode, "remote");
  process.env.EMAIL_SERVICE_URL = "https://api.example.com";
  assert.throws(validateEnv, /separate HTTPS/);
  process.env.EMAIL_SERVICE_URL = "https://mail.example.com";
  process.env.OTP_MAX_ATTEMPTS = "99";
  assert.throws(validateEnv, /Production requires/);
  Object.assign(process.env, { RENDER: "false", BACKEND_URL: "https://mail.example.com", EMAIL_DELIVERY_MODE: "smtp", EMAIL_RELAY_ENABLED: "true", EMAIL_PASS: "fake", OTP_MAX_ATTEMPTS: "5" });
  assert.equal(validateEnv().emailRelayEnabled, true);
  process.env.EMAIL_DELIVERY_MODE = "remote";
  assert.throws(validateEnv, /requires SMTP mode/);
});

test("AMP template uses main backend origin and dynamic expiry", (t) => {
  const original = { ...process.env };
  t.after(() => { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); });
  Object.assign(process.env, { NODE_ENV: "development", RENDER: "false", FRONTEND_URL: "http://localhost:5173", BACKEND_URL: "https://mail.example.com",
    AMP_EMAIL_ENABLED: "true", AMP_RESEND_BACKEND_URL: "https://main.example.com", COOKIE_SAME_SITE: "lax", EMAIL_DELIVERY_MODE: "smtp", EMAIL_RELAY_ENABLED: "false", OTP_EXPIRES_IN: "300", OTP_RESEND_COOLDOWN: "5" });
  const html = require("../src/templates/email/verifyEmail.amp")({ name: "Test User", otp: "000001", reverifyToken: "token" });
  assert.ok(html.includes('https://main.example.com/auth/email-resend'));
  assert.ok(html.includes('Valid for 300 seconds'));
  assert.ok(html.includes('Please wait 5 seconds'));
});
