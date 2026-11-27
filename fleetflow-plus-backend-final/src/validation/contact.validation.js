const Joi = require("joi");
module.exports = Joi.object({
  name: Joi.string().trim().min(3).max(80).required(),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254)
    .required(),
  message: Joi.string().trim().min(10).max(2000).required(),
});
