const redis = require("../config/redis");
const { digest } = require("../utils/otpGenerator");
const { apiError } = require("../utils/apiResponse");
const script = `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n`;
const rateLimit =
  (bucket, limit, window, identity = (req) => req.ip) =>
  async (req, res, next) => {
    const key = `limit:${bucket}:${digest(String(identity(req)))}`;
    const n = Number(await redis.eval(script, 1, key, window));
    if (n > limit) {
      res.set("Retry-After", String(Math.max(1, await redis.ttl(key))));
      throw apiError(429, "RATE_LIMIT", "Too many attempts. Try again later.");
    }
    next();
  };
module.exports = rateLimit;
