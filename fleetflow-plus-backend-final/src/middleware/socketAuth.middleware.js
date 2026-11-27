const User = require("../model/auth.model");
const { verifyToken } = require("../utils/generateToken");
const { readSession } = require("../services/session.service");
const checkSocketSession = async (token) => {
  const claims = verifyToken("access", token);
  await readSession(claims);
  const user = await User.findById(claims.sub).select("+sessionVersion");
  if (!user?.isEmailVerified || user.sessionVersion !== claims.sv)
    throw new Error("Unauthorized");
  return claims;
};
const socketAuth = async (socket, next) => {
  try {
    socket.data.claims = await checkSocketSession(socket.handshake.auth?.token);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};
module.exports = { checkSocketSession, socketAuth };
