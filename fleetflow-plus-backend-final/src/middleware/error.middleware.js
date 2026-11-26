const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const duplicate = error.code === 11000;
  const status = duplicate
    ? 409
    : Number.isInteger(error.status) &&
        error.status >= 400 &&
        error.status <= 599
      ? error.status
      : 500;
  if (status >= 500)
    console.error("Request failed:", error.name, error.code || "");
  return res
    .status(status)
    .json({
      success: false,
      code: duplicate
        ? "ACCOUNT_EXISTS"
        : typeof error.code === "string" && error.status
          ? error.code
          : "REQUEST_FAILED",
      message: duplicate
        ? "An account with that email already exists."
        : status >= 500
          ? "Service temporarily unavailable. Please try again."
          : error.message,
      ...(error.details && status < 500 ? { details: error.details } : {}),
    });
};
module.exports = errorHandler;
