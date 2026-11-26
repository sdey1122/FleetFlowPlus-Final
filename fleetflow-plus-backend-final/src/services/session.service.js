const { randomUUID } = require("node:crypto");
const redis = require("../config/redis");
const { getEnv } = require("../config/env");
const { signToken, verifyToken } = require("../utils/generateToken");
const { digest } = require("../utils/otpGenerator");
const { apiError } = require("../utils/apiResponse");
const key = (sid) => `session:${sid}`;
const invalid = () =>
  apiError(401, "SESSION_EXPIRED", "Session expired. Please log in again.");
const tokenPair = (user, sid) => {
  const claims = { sid, sv: user.sessionVersion };
  return {
    accessToken: signToken("access", user.id, claims),
    refreshToken: signToken("refresh", user.id, claims),
  };
};
const createSession = async (user) => {
  const sid = randomUUID(),
    tokens = tokenPair(user, sid);
  const record = JSON.stringify({
    sub: user.id,
    sv: user.sessionVersion,
    hash: digest(tokens.refreshToken),
  });
  await redis.set(key(sid), record, "EX", getEnv().refreshTTL);
  return tokens;
};
const readSession = async (claims) => {
  if (typeof claims.sid !== "string" || !Number.isInteger(claims.sv))
    throw invalid();
  const raw = await redis.get(key(claims.sid));
  if (!raw) throw invalid();
  const session = JSON.parse(raw);
  if (session.sub !== claims.sub || session.sv !== claims.sv) throw invalid();
  return { raw, session };
};
const ROTATE = `if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1`;
const rotateSession = async (token, user, claims) => {
  const { raw, session } = await readSession(claims);
  if (session.hash !== digest(token)) throw invalid();
  const tokens = tokenPair(user, claims.sid);
  const updated = JSON.stringify({
    ...session,
    hash: digest(tokens.refreshToken),
  });
  if (
    Number(
      await redis.eval(
        ROTATE,
        1,
        key(claims.sid),
        raw,
        updated,
        getEnv().refreshTTL,
      ),
    ) !== 1
  )
    throw invalid();
  return tokens;
};
const revokeSession = async (token) => {
  let claims;
  try {
    claims = verifyToken("refresh", token);
  } catch {
    return;
  }
  let record;
  try {
    record = await readSession(claims);
  } catch (error) {
    if (error.status === 401) return;
    throw error;
  }
  if (record.session.hash === digest(token))
    await redis.eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      1,
      key(claims.sid),
      record.raw,
    );
};
module.exports = { createSession, readSession, rotateSession, revokeSession };
