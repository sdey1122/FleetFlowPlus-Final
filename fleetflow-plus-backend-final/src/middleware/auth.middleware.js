const User = require("../model/auth.model");
const { verifyToken } = require("../utils/generateToken");
const { apiError } = require("../utils/apiResponse");
const { readSession } = require("../services/session.service");
const authenticate = async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get("Authorization") || "");
  if (!match) throw apiError(401, "AUTH_REQUIRED", "Please log in.");
  const claims = verifyToken("access", match[1]);
  await readSession(claims);
  const user = await User.findById(claims.sub).select("+sessionVersion");
  if (!user?.isEmailVerified || user.sessionVersion !== claims.sv)
    throw apiError(401, "SESSION_EXPIRED", "Please log in again.");
  req.user = user;
  next();
};
module.exports = authenticate;
