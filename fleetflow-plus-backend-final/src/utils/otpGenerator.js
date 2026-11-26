const { randomInt, createHmac, createHash } = require("node:crypto");
const generateOTP = () => String(randomInt(0, 1000000)).padStart(6, "0");
const otpDigest = (purpose, email, otp) =>
  createHmac("sha256", process.env.OTP_SECRET)
    .update(JSON.stringify([purpose, email, otp]))
    .digest("hex");
const digest = (value) => createHash("sha256").update(value).digest("hex");
module.exports = { generateOTP, otpDigest, digest };
