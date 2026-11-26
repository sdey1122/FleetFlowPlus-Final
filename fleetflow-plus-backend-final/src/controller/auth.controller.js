const auth = require("../services/auth.service");
const { revokeSession } = require("../services/session.service");
const { getEnv } = require("../config/env");
const { success, apiError } = require("../utils/apiResponse");
const cookieName = "fleetflow_refresh";
const cookieOptions = () => ({
  httpOnly: true,
  secure: getEnv().production,
  sameSite: getEnv().sameSite,
  path: "/auth",
});
const withSession = (res, message, result) => {
  const { refreshToken, ...data } = result;
  res.cookie(cookieName, refreshToken, {
    ...cookieOptions(),
    maxAge: getEnv().refreshTTL * 1000,
  });
  return success(res, 200, message, data);
};
const register = async (req, res) => {
  const result = await auth.register(req.body);
  return success(
    res,
    201,
    result.otpSent
      ? "Registration successful. Check your email."
      : "Account created. Email delivery failed; request a new OTP.",
    result,
  );
};
const verifyEmail = async (req, res) =>
  success(res, 200, "Email verified successfully.", {
    user: await auth.verifyEmail(req.body),
  });
const resendOTP = async (req, res) =>
  success(
    res,
    200,
    "New verification code sent.",
    await auth.resendOTP(req.body),
  );
const login = async (req, res) =>
  withSession(res, "Login successful.", await auth.login(req.body));
const refresh = async (req, res) => {
  const token = req.cookies[cookieName];
  if (!token) throw apiError(401, "AUTH_REQUIRED", "Refresh cookie missing.");
  return withSession(res, "Session refreshed.", await auth.refresh(token));
};
const forgotPassword = async (req, res) =>
  success(
    res,
    200,
    "If an eligible account exists, a reset code will be sent.",
    await auth.forgotPassword(req.body),
  );
const resetPassword = async (req, res) => {
  await auth.resetPassword(req.body);
  res.clearCookie(cookieName, cookieOptions());
  return success(res, 200, "Password reset successful. Please log in.");
};
const logout = async (req, res) => {
  if (req.cookies[cookieName]) await revokeSession(req.cookies[cookieName]);
  res.clearCookie(cookieName, cookieOptions());
  return success(res, 200, "Logged out successfully.");
};
const me = async (req, res) =>
  success(res, 200, "Account retrieved.", { user: auth.publicUser(req.user) });
module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  me,
};
