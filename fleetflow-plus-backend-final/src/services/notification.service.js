const Notification = require("../model/notification.model");
const User = require("../model/auth.model");
const { notify } = require("../config/socket");
const { randomUUID } = require("node:crypto");

// The compound unique index makes event creation idempotent per recipient.
const create = async (recipient, eventKey, title, message, kind) => {
  await Notification.init();
  try {
    const result = await Notification.updateOne(
      { recipient, eventKey },
      { $setOnInsert: { recipient, eventKey, title, message, kind } },
      { upsert: true },
    );
    if (result.upsertedCount) notify(String(recipient));
  } catch (error) {
    // Concurrent requests can try to create the same welcome event.
    if (
      error.code !== 11000 ||
      !(await Notification.exists({ recipient, eventKey }))
    )
      throw error;
  }
};
const admins = async (
  eventKey,
  title,
  message,
  kind = "account",
  excludeId,
) => {
  const users = await User.find({ role: "admin", isEmailVerified: true })
    .select("_id")
    .lean();
  await Promise.all(
    users
      .filter((user) => String(user._id) !== String(excludeId))
      .map((user) => create(user._id, eventKey, title, message, kind)),
  );
};
const safe = async (task) => {
  try {
    await task();
  } catch (error) {
    console.error("Notification write failed:", error.code || error.name);
  }
};
const welcome = (user) =>
  create(
    user.id,
    `welcome:${user.id}`,
    "Welcome to FleetFlow Plus!",
    "Your account has been successfully verified. Your journey starts here.",
    "welcome",
  );
const adminWelcome = (user) =>
  admins(
    `verified:${user.id}`,
    "Account verified",
    `${user.name} (${user.role}) verified their email.`,
  );
const registered = (user) =>
  safe(() =>
    admins(
      `registered:${user.id}`,
      "New account registered",
      `${user.name} registered as ${user.role}.`,
    ),
  );
const verified = (user) =>
  Promise.all([safe(() => welcome(user)), safe(() => adminWelcome(user))]);
const security = async (user, title, message) => {
  const eventKey = randomUUID();
  await Promise.all([
    safe(() => create(user.id, eventKey, title, message, "security")),
    safe(() =>
      admins(
        eventKey,
        title,
        `${user.name} (${user.role}): ${message}`,
        "security",
        user.id,
      ),
    ),
  ]);
};
const list = async (user) => {
  await Notification.init();
  // Only recover a missing welcome event. Do not write to MongoDB on every poll.
  if (
    user.role !== "admin" &&
    user.isEmailVerified &&
    !(await Notification.exists({
      recipient: user.id,
      eventKey: `welcome:${user.id}`,
    }))
  ) {
    await welcome(user);
    await safe(() => adminWelcome(user));
  }
  const filter = { recipient: user.id };
  const [items, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean(),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  return {
    items: items.map(({ _id, title, message, kind, createdAt, readAt }) => ({
      id: String(_id),
      title,
      message,
      kind,
      createdAt,
      readAt,
    })),
    unreadCount,
  };
};
const markAll = async (id) => {
  const result = await Notification.updateMany(
    { recipient: id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  if (result.modifiedCount) notify(id);
};
const markOne = async (id, notificationId) => {
  const result = await Notification.updateOne(
    { _id: notificationId, recipient: id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  if (result.modifiedCount) notify(id);
};
const orderEvent = async (customer, key, title, message, kind) =>
  Promise.all([
    create(customer, key, title, message, kind),
    admins(key, title, message, kind, customer),
  ]);
module.exports = {
  orderEvent,
  registered,
  verified,
  security,
  admins,
  safe,
  list,
  markAll,
  markOne,
};
