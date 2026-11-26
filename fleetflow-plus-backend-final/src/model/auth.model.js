const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
      required: function () {
        return this.role !== ROLES.ADMIN;
      },
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      required: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    sessionVersion: {
      type: Number,
      default: 0,
      select: false,
    },

    profileImage: {
      type: String,
      default: () => process.env.DEFAULT_PROFILE_IMAGE_URL || "",
    },

    profileImagePublicId: {
      type: String,
      default: null,
      select: false,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    dob: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate phone numbers
schema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: "string" },
    },
  },
);

module.exports = mongoose.model("User", schema);
