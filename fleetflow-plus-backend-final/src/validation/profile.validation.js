const Joi = require("joi");
module.exports = Joi.object({
  bio: Joi.string().trim().max(500).allow("").required(),
  dob: Joi.date().iso().max("now").allow(null).required(),
  imageData: Joi.string()
    .max(820000)
    .pattern(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/)
    .optional(),
});
