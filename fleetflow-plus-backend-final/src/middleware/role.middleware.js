const { apiError } = require("../utils/apiResponse");
const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return next(apiError(403, "FORBIDDEN", "You do not have permission."));
    next();
  };
module.exports = allowRoles;
