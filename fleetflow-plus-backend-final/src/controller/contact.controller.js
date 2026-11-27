const { submit } = require("../services/contact.service");
const { success } = require("../utils/apiResponse");
exports.submit = async (req, res) => {
  await submit(req.body);
  return success(res, 201, "Your message has been received.");
};
