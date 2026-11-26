const bcrypt = require("bcryptjs");
const User = require("../model/auth.model");
const { getEnv } = require("../config/env");
const { PUBLIC_ROLES } = require("../constants/roles");
const { apiError } = require("../utils/apiResponse");
const { signToken, verifyToken } = require("../utils/generateToken");
const { issueOTP, cancelOTP, consumeOTP } = require("./otp.service");
const { sendOTP } = require("./mail.service");
const { createSession, rotateSession } = require("./session.service");
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isEmailVerified: u.isEmailVerified,
  profileImage: u.profileImage,
  bio: u.bio,
  dob: u.dob,
  createdAt: u.createdAt,
});

const reverify = (user) =>
  signToken("reverify", user.id, { email: user.email });
const deliver = async (purpose, user, token) => {
  const { otp, expiresIn } = await issueOTP(purpose, user.email);
  try {
    await sendOTP(purpose, user, otp, token);
    return { otpSent: true, expiresIn };
  } catch (error) {
    console.error("SMTP delivery failed:", error.code || error.name);
    await cancelOTP(purpose, user.email, otp);
    return { otpSent: false, expiresIn: 0 };
  }
};

const register = async (data) => {
  // Prevent unauthorized role registration
  if (
    !PUBLIC_ROLES.includes(data.role) ||
    data.email === process.env.ADMIN_EMAIL?.trim().toLowerCase()
  ) {
    throw apiError(
      403,
      "ROLE_NOT_ALLOWED",
      "This account cannot be registered publicly.",
    );
  }

  // Check duplicate email
  const existingEmail = await User.exists({
    email: data.email,
  });

  if (existingEmail) {
    throw apiError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists.",
    );
  }

  // Check duplicate phone number
  const existingPhone = await User.exists({
    phone: data.phone,
  });

  if (existingPhone) {
    throw apiError(
      409,
      "PHONE_ALREADY_EXISTS",
      "An account with this phone number already exists.",
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    password: hashedPassword,
  });

  // Generate reverification token
  const reverifyToken = reverify(user);

  // Generate and send verification OTP
  const delivery = await deliver("verify", user, reverifyToken);

  // Return registration response
  return {
    user: publicUser(user),
    reverifyToken,
    ...delivery,
  };
};

const verifyEmail = async ({ email, otp }) => {
  const user = await User.findOne({ email });
  if (!user || user.isEmailVerified)
    throw apiError(
      400,
      "INVALID_VERIFICATION",
      "No pending verification for this account.",
    );
  await consumeOTP("verify", email, otp);
  const verified = await User.findOneAndUpdate(
    { _id: user.id, isEmailVerified: false },
    { $set: { isEmailVerified: true, verifiedAt: new Date() } },
    { new: true },
  );
  if (!verified)
    throw apiError(409, "ALREADY_VERIFIED", "Email is already verified.");
  return publicUser(verified);
};
const resendOTP = async ({ reverifyToken }) => {
  const claims = verifyToken("reverify", reverifyToken);
  const user = await User.findOne({
    _id: claims.sub,
    email: claims.email,
    isEmailVerified: false,
  });
  if (!user)
    throw apiError(
      400,
      "INVALID_VERIFICATION",
      "No pending verification for this account.",
    );
  const freshToken = reverify(user);
  const delivery = await deliver("verify", user, freshToken);
  if (!delivery.otpSent)
    throw apiError(
      503,
      "EMAIL_UNAVAILABLE",
      "Could not send verification email.",
    );
  return { email: user.email, reverifyToken: freshToken, ...delivery };
};
// Valid bcrypt hash used to keep unknown-account login work similar to known-account login.
const dummyHash = bcrypt.hashSync("FleetFlowDummy!Password", 12);
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select(
    "+password +sessionVersion",
  );
  const valid = await bcrypt.compare(password, user?.password || dummyHash);
  if (!user || !valid || Buffer.byteLength(password, "utf8") > 72)
    throw apiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  if (!user.isEmailVerified)
    throw apiError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before logging in.",
      { email: user.email, reverifyToken: reverify(user) },
    );
  return { user: publicUser(user), ...(await createSession(user)) };
};
const refresh = async (token) => {
  const claims = verifyToken("refresh", token);
  const user = await User.findById(claims.sub).select("+sessionVersion");
  if (!user?.isEmailVerified || user.sessionVersion !== claims.sv)
    throw apiError(401, "SESSION_EXPIRED", "Please log in again.");
  return {
    user: publicUser(user),
    ...(await rotateSession(token, user, claims)),
  };
};
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email, isEmailVerified: true });
  if (user) {
    try {
      await deliver("reset", user);
    } catch (error) {
      if (error.code !== "OTP_COOLDOWN") throw error;
    }
  }
  // Keep the same public response for known, unknown and cooling-down accounts.
  return { expiresIn: getEnv().otpTTL };
};
const resetPassword = async ({ email, otp, password }) => {
  const user = await User.findOne({ email, isEmailVerified: true });
  if (!user)
    throw apiError(400, "INVALID_OTP", "Invalid or expired reset code.");
  await consumeOTP("reset", email, otp);
  const hash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { _id: user.id },
    { $set: { password: hash }, $inc: { sessionVersion: 1 } },
  );
};
module.exports = {
  publicUser,
  register,
  verifyEmail,
  resendOTP,
  login,
  refresh,
  forgotPassword,
  resetPassword,
};
