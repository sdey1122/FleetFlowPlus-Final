require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/dbcon");
const User = require("../model/auth.model");
const { ROLES } = require("../constants/roles");
const { seed } = require("../validation/auth.validation");
const run = async () => {
  const { error, value } = seed.validate(
    {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      phone: process.env.ADMIN_PHONE || null,
    },
    { abortEarly: false },
  );
  if (error)
    throw new Error(
      error.details.map((d) => `${d.path.join(".")}: ${d.type}`).join(", "),
    );
  await connectDB();
  await User.init();
  const existing = await User.findOne({ email: value.email });
  if (existing) {
    if (existing.role !== ROLES.ADMIN)
      throw new Error(
        "Seed email is occupied by a non-admin account. Refusing role escalation.",
      );
    console.log("Admin already exists. No changes made.");
    return;
  }
  await User.create({
    name: value.name,
    email: value.email,
    password: await bcrypt.hash(value.password, 12),
    phone: value.phone,
    role: ROLES.ADMIN,
    isEmailVerified: true,
    verifiedAt: new Date(),
  });
  console.log("Admin created successfully.");
};
run()
  .catch((error) => {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
