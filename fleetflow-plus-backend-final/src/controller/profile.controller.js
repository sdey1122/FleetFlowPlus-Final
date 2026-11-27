const { success } = require("../utils/apiResponse");
const { update } = require("../services/profile.service");
exports.update = async (req, res) =>
  success(res, 200, "Profile updated", await update(req.user, req.body));
