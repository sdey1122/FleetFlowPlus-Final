const { Redis } = require("@upstash/redis");

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  automaticDeserialization: false,
});
const prefix = process.env.REDIS_PREFIX || "fleetflow:";
const key = (value) => `${prefix}${value}`;

// Preserve the command interface used by the existing OTP/session services.
// REST does not require a TCP connection or disconnect().
const redis = {
  ping: () => client.ping(),
  get: (name) => client.get(key(name)),
  set: (name, value, mode, seconds) => {
    if (mode !== undefined && mode !== "EX") throw new Error("Unsupported Redis SET mode");
    return mode === "EX"
      ? client.set(key(name), value, { ex: Number(seconds) })
      : client.set(key(name), value);
  },
  setIfAbsent: (name, value, seconds) =>
    client.set(key(name), value, { nx: true, ex: seconds }),
  del: (...names) => client.del(...names.map(key)),
  ttl: (name) => client.ttl(key(name)),
  expire: (name, seconds) => client.expire(key(name), seconds),
  exists: (...names) => client.exists(...names.map(key)),
  eval: (script, numberOfKeys, ...params) => client.eval(
    script,
    params.slice(0, numberOfKeys).map(key),
    params.slice(numberOfKeys).map(String),
  ),
};

module.exports = redis;
