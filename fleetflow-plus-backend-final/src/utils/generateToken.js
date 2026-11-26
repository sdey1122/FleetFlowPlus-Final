const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const { getEnv } = require("../config/env");
const { apiError } = require("./apiResponse");
const settings = () => ({
  access: ["JWT_ACCESS_SECRET", getEnv().accessTTL],
  refresh: ["JWT_REFRESH_SECRET", getEnv().refreshTTL],
  reverify: ["JWT_REVERIFY_SECRET", getEnv().reverifyTTL],
});
const signToken = (purpose, sub, claims = {}) => {
  const [key, expiresIn] = settings()[purpose];
  return jwt.sign({ ...claims, purpose }, process.env[key], {
    algorithm: "HS256",
    subject: String(sub),
    issuer: "fleetflow-plus",
    audience: `fleetflow:${purpose}`,
    jwtid: randomUUID(),
    expiresIn,
  });
};
const verifyToken = (purpose, token) => {
  try {
    const [key] = settings()[purpose];
    const result = jwt.verify(token, process.env[key], {
      algorithms: ["HS256"],
      issuer: "fleetflow-plus",
      audience: `fleetflow:${purpose}`,
    });
    if (result.purpose !== purpose || typeof result.sub !== "string")
      throw new Error("Invalid claims");
    return result;
  } catch {
    throw apiError(401, "INVALID_TOKEN", "Invalid or expired token.");
  }
};
module.exports = { signToken, verifyToken };
