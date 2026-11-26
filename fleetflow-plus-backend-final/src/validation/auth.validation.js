const Joi = require("joi");
const { parsePhoneNumberFromString } = require("libphonenumber-js/max");
const { PUBLIC_ROLES } = require("../constants/roles");

// Name validation
const name = Joi.string().trim().min(3).max(32).required().messages({
  "string.empty": "Name is required",
  "string.min": "Name must contain at least 3 characters",
  "string.max": "Name cannot exceed 32 characters",
  "any.required": "Name is required",
});

// Email validation
const email = Joi.string()
  .trim()
  .lowercase()
  .max(254)
  .email({ tlds: { allow: false } })
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  .required()
  .messages({
    "string.empty": "Email is required",
    "string.email": "Enter a valid email address",
    "string.pattern.base": "Enter a valid email address",
    "any.required": "Email is required",
  });

// Password validation
const password = Joi.string()
  .min(9)
  .max(32)
  .pattern(/[A-Z]/, { name: "uppercase" })
  .pattern(/[a-z]/, { name: "lowercase" })
  .pattern(/[^\p{L}\p{N}\s]/u, { name: "symbol" })
  .custom((value, helpers) => {
    if (Buffer.byteLength(value, "utf8") > 72) {
      return helpers.error("string.max", { limit: 72 });
    }

    return value;
  })
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.min": "Password must contain at least 9 characters",
    "string.max": "Password must not exceed 32 characters or 72 UTF-8 bytes",
    "string.pattern.name":
      "Password must contain at least one {#name} character",
    "any.required": "Password is required",
  });

// Confirm password validation
const confirmPassword = Joi.string()
  .valid(Joi.ref("password"))
  .required()
  .messages({
    "string.empty": "Confirm password is required",
    "any.only": "Passwords must match",
    "any.required": "Confirm password is required",
  });

// International phone number validation
const phone = Joi.string()
  .trim()
  .pattern(/^\+[1-9]\d{6,14}$/)
  .custom((value, helpers) => {
    const parsed = parsePhoneNumberFromString(value);

    if (!parsed || !parsed.isValid() || parsed.number !== value) {
      return helpers.error("any.invalid");
    }

    // Return standardized E.164 phone number
    return parsed.number;
  })
  .required()
  .messages({
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
    "any.invalid": "Enter a valid international phone number",
    "string.pattern.base":
      "Include a valid international country code, such as +91, +1, +44 or +7",
  });

// Optional phone number for seeded admin only
const adminPhone = phone.optional().empty("").allow(null).default(null);

// OTP validation
const otp = Joi.string()
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    "string.empty": "OTP is required",
    "string.pattern.base": "OTP must contain exactly 6 digits",
    "any.required": "OTP is required",
  });

// Reverification token validation
const token = Joi.string().max(4096).required();

// Authentication schemas
const schemas = {
  register: Joi.object({
    name,
    email,
    phone,

    role: Joi.string()
      .valid(...PUBLIC_ROLES)
      .required()
      .messages({
        "any.only": "Select a valid account role",
        "any.required": "Account role is required",
      }),

    password,
    confirmPassword,
  }),

  login: Joi.object({
    email,
    password: Joi.string().min(1).max(256).required(),
  }),

  verifyEmail: Joi.object({
    email,
    otp,
  }),

  resendOTP: Joi.object({
    reverifyToken: token,
  }),

  forgotPassword: Joi.object({
    email,
  }),

  resetPassword: Joi.object({
    email,
    otp,
    password,
    confirmPassword,
  }),

  empty: Joi.object({}).required(),

  // Admin seed validation
  seed: Joi.object({
    name,
    email,
    password,
    phone: adminPhone,
  }),
};

module.exports = schemas;
