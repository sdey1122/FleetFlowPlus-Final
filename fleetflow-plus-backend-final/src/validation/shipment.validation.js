const Joi = require("joi");
const { isValidPhoneNumber } = require("libphonenumber-js/max");
const { GOODS, TIERS } = require("../constants/shipping");
const phone = Joi.string()
  .pattern(/^\+[1-9]\d{6,14}$/)
  .custom((v, h) => (isValidPhoneNumber(v) ? v : h.error("any.invalid")))
  .required();
const name = Joi.string().trim().min(2).max(80).required();
const text = (n) => Joi.string().trim().min(3).max(n).required();
const place = Joi.object({
  label: text(500),
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
}).required();
const id = Joi.string().hex().length(24).required();
const quote = Joi.object({
  pickup: place,
  destination: place,
  pickupAddress: text(500),
  deliveryAddress: text(500),
  senderName: name,
  senderPhone: phone,
  recipientName: name,
  recipientPhone: phone,
  category: Joi.string()
    .valid(...GOODS)
    .required(),
  description: text(300),
  weight: Joi.number().positive().max(100).required(),
  length: Joi.number().positive().max(250).required(),
  width: Joi.number().positive().max(250).required(),
  height: Joi.number().positive().max(250).required(),
  instructions: Joi.string().trim().max(300).allow("").default(""),
  declaredSafe: Joi.boolean().valid(true).required(),
});
module.exports = {
  quote,
  route: Joi.object({ pickup: place, destination: place }),
  checkout: Joi.object({
    quoteId: id,
    tier: Joi.string()
      .valid(...Object.keys(TIERS))
      .required(),
  }),
  verify: Joi.object({
    razorpay_order_id: Joi.string()
      .pattern(/^order_[A-Za-z0-9]+$/)
      .max(80)
      .required(),
    razorpay_payment_id: Joi.string()
      .pattern(/^pay_[A-Za-z0-9]+$/)
      .max(80)
      .required(),
    razorpay_signature: Joi.string().hex().length(64).required(),
  }),
  empty: Joi.object({}),
};
