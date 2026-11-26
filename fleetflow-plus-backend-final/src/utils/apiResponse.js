const apiError = (status, code, message, details) =>
  Object.assign(new Error(message), { status, code, details });
const success = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, data });
module.exports = { apiError, success };
