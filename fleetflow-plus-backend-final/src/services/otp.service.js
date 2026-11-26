const redis = require("../config/redis");
const { getEnv } = require("../config/env");
const { generateOTP, otpDigest, digest } = require("../utils/otpGenerator");
const { apiError } = require("../utils/apiResponse");
const key = (purpose, email) => `otp:{${digest(`${purpose}:${email}`)}}`;
const ISSUE = `if redis.call('EXISTS',KEYS[2])==1 then return redis.call('TTL',KEYS[2]) end; redis.call('HSET',KEYS[1],'digest',ARGV[1],'attempts',ARGV[2]); redis.call('EXPIRE',KEYS[1],ARGV[3]); redis.call('SET',KEYS[2],ARGV[1],'EX',ARGV[4]); return -1`;
const CONSUME = `local d=redis.call('HGET',KEYS[1],'digest'); if not d then return 0 end; if d==ARGV[1] then redis.call('DEL',KEYS[1]); return 1 end; local a=redis.call('HINCRBY',KEYS[1],'attempts',-1); if a<=0 then redis.call('DEL',KEYS[1]); return -1 end; return -2`;
const CANCEL = `if redis.call('HGET',KEYS[1],'digest')==ARGV[1] then redis.call('DEL',KEYS[1]) end; if redis.call('GET',KEYS[2])==ARGV[1] then redis.call('DEL',KEYS[2]) end; return 1`;
const issueOTP = async (purpose, email) => {
  const { otpTTL, cooldown, attempts } = getEnv();
  const otp = generateOTP(),
    hash = otpDigest(purpose, email, otp),
    k = key(purpose, email);
  const wait = Number(
    await redis.eval(
      ISSUE,
      2,
      k,
      `${k}:cooldown`,
      hash,
      attempts,
      otpTTL,
      cooldown,
    ),
  );
  if (wait !== -1)
    throw apiError(
      429,
      "OTP_COOLDOWN",
      "Please wait before requesting another code.",
      { retryAfter: Math.max(wait, 1) },
    );
  return { otp, expiresIn: otpTTL };
};
const cancelOTP = async (purpose, email, otp) => {
  const k = key(purpose, email);
  await redis.eval(
    CANCEL,
    2,
    k,
    `${k}:cooldown`,
    otpDigest(purpose, email, otp),
  );
};
const consumeOTP = async (purpose, email, otp) => {
  const result = Number(
    await redis.eval(
      CONSUME,
      1,
      key(purpose, email),
      otpDigest(purpose, email, otp),
    ),
  );
  if (result !== 1)
    throw apiError(
      400,
      result === 0
        ? "OTP_EXPIRED"
        : result === -1
          ? "OTP_ATTEMPTS_EXHAUSTED"
          : "INVALID_OTP",
      result === 0
        ? "Code expired. Request a new OTP."
        : result === -1
          ? "Too many incorrect codes. Request a new OTP."
          : "Incorrect verification code.",
    );
};
module.exports = { issueOTP, cancelOTP, consumeOTP };
