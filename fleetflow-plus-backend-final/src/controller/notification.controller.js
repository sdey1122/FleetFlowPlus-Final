const notifications = require("../services/notification.service");
const { success } = require("../utils/apiResponse");
exports.list = async (req, res) =>
  success(
    res,
    200,
    "Notifications retrieved",
    await notifications.list(req.user),
  );
exports.markAll = async (req, res) => {
  await notifications.markAll(req.user.id);
  return success(res, 200, "Notifications marked read");
};
exports.markOne = async (req, res) => {
  await notifications.markOne(req.user.id, req.params.id);
  return success(res, 200, "Notification marked read");
};
