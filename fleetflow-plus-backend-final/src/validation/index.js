const { apiError } = require("../utils/apiResponse");
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.required().validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  });
  if (error)
    return next(
      apiError(
        400,
        "VALIDATION_ERROR",
        "Please check the submitted fields.",
        error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/"/g, ""),
        })),
      ),
    );
  req.body = value;
  next();
};
module.exports = validate;
