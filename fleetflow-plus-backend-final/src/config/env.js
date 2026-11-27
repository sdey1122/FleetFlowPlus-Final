// Read and validate positive integer environment variables
const readInt = (key, fallback) => {
  const value = Number(process.env[key]?.trim() || fallback);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid ${key}: expected a positive integer`);
  }

  return value;
};

// Convert JWT duration into seconds
const ttl = (value) => {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    throw new Error("JWT duration must use s, m, h or d");
  }

  const seconds =
    Number(match[1]) *
    {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    }[match[2]];

  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 31536000) {
    throw new Error("Invalid JWT duration");
  }

  return seconds;
};

// Read and validate URL
const readURL = (key, fallback) => {
  const value = process.env[key]?.trim() || fallback;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    return url;
  } catch {
    throw new Error(`Invalid ${key}: expected a valid URL`);
  }
};

// Environment configuration
const getEnv = () => {
  const production = process.env.NODE_ENV === "production";

  const front = readURL("FRONTEND_URL", "http://localhost:5173");

  const back = readURL("BACKEND_URL", "http://localhost:6050");

  const sameSite = process.env.COOKIE_SAME_SITE || "lax";

  const ampEmailEnabled = process.env.AMP_EMAIL_ENABLED === "true";

  const emailDeliveryMode = process.env.EMAIL_DELIVERY_MODE?.trim() || "smtp";
  const emailRelayEnabled = process.env.EMAIL_RELAY_ENABLED === "true";
  const ampResendBackend = ampEmailEnabled
    ? readURL("AMP_RESEND_BACKEND_URL", back.origin)
    : back;

  if (!["smtp", "remote"].includes(emailDeliveryMode)) {
    throw new Error("EMAIL_DELIVERY_MODE must be smtp or remote");
  }
  if (emailRelayEnabled && emailDeliveryMode !== "smtp") {
    throw new Error("EMAIL_RELAY_ENABLED requires SMTP mode");
  }
  if (process.env.RENDER === "true" && emailDeliveryMode !== "remote") {
    throw new Error("Set EMAIL_DELIVERY_MODE=remote on Render Free");
  }

  // Cookie configuration
  if (
    !["lax", "strict", "none"].includes(sameSite) ||
    (sameSite === "none" && !production)
  ) {
    throw new Error("Invalid COOKIE_SAME_SITE");
  }

  // Production URL security
  if (production && front.protocol !== "https:") {
    throw new Error("Production FRONTEND_URL must be HTTPS");
  }

  if (production && back.protocol !== "https:") {
    throw new Error("Production BACKEND_URL must be HTTPS");
  }

  // AMP email requires HTTPS
  if (ampEmailEnabled && ampResendBackend.protocol !== "https:") {
    throw new Error(
      "AMP email requires a publicly accessible HTTPS AMP_RESEND_BACKEND_URL (or BACKEND_URL)",
    );
  }

  return {
    production,

    frontend: front.origin,

    backend: back.origin,

    port: readInt("PORT", 6050),

    sameSite,

    // JWT configuration
    accessTTL: ttl(process.env.JWT_ACCESS_EXPIRES_IN || "15m"),

    refreshTTL: ttl(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),

    reverifyTTL: ttl(process.env.JWT_REVERIFY_EXPIRES_IN || "24h"),

    // Dynamic OTP configuration
    otpTTL: readInt("OTP_EXPIRES_IN", 60),

    cooldown: readInt("OTP_RESEND_COOLDOWN", 60),

    attempts: readInt("OTP_MAX_ATTEMPTS", 5),

    // AMP Email
    ampEmailEnabled,
    ampResendBackend: ampResendBackend.origin,
    emailDeliveryMode,
    emailRelayEnabled,
  };
};

// Validate required environment variables
const validateEnv = () => {
  const env = getEnv();

  const secretKeys = [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_REVERIFY_SECRET",
    "OTP_SECRET",
  ];

  const requiredKeys = [
    // MongoDB
    "MONGODB_URI",

    // Admin
    "ADMIN_EMAIL",

    // Upstash Redis REST
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",

    // SMTP credentials only on the actual sending deployment
    ...(env.emailDeliveryMode === "smtp"
      ? ["EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM"]
      : []),
    // AMP sender identity is public; the SMTP password is not needed on Render
    ...(env.ampEmailEnabled ? ["EMAIL_USER"] : []),
    ...(env.emailDeliveryMode === "remote" ? ["EMAIL_SERVICE_URL"] : []),
    ...(env.emailDeliveryMode === "remote" || env.emailRelayEnabled
      ? ["EMAIL_SERVICE_SECRET"]
      : []),

    // Security secrets
    ...secretKeys,
  ];

  // Check required environment variables
  for (const key of requiredKeys) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing ${key}`);
    }
  }

  // Validate security secrets
  if (
    secretKeys.some((key) => Buffer.byteLength(process.env[key]) < 32) ||
    new Set(secretKeys.map((key) => process.env[key])).size !==
      secretKeys.length
  ) {
    throw new Error("Use four different secrets of at least 32 bytes");
  }

  // Validate Upstash REST URL
  const redisUrl = readURL("UPSTASH_REDIS_REST_URL");

  if (redisUrl.protocol !== "https:") {
    throw new Error("UPSTASH_REDIS_REST_URL must use HTTPS");
  }

  if (env.emailDeliveryMode === "remote" || env.emailRelayEnabled) {
    const secret = process.env.EMAIL_SERVICE_SECRET;
    if (
      Buffer.byteLength(secret) < 32 ||
      secretKeys.some((key) => process.env[key] === secret)
    ) {
      throw new Error(
        "Use a separate EMAIL_SERVICE_SECRET of at least 32 bytes",
      );
    }
  }
  if (env.emailDeliveryMode === "remote") {
    const relay = readURL("EMAIL_SERVICE_URL");
    if (
      relay.protocol !== "https:" ||
      relay.username ||
      relay.password ||
      relay.pathname !== "/" ||
      relay.search ||
      relay.hash ||
      relay.origin === env.backend
    ) {
      throw new Error(
        "EMAIL_SERVICE_URL must be the separate HTTPS Vercel backend origin",
      );
    }
  }

  // OTP restrictions apply ONLY in production.
  // Local development allows configurable positive integers.
  if (env.production) {
    if (env.otpTTL !== 60 || env.cooldown !== 60 || env.attempts !== 5) {
      throw new Error(
        "Production requires OTP_EXPIRES_IN=60, " +
          "OTP_RESEND_COOLDOWN=60 and OTP_MAX_ATTEMPTS=5",
      );
    }
  }

  return env;
};

module.exports = {
  getEnv,
  validateEnv,
  ttl,
};
