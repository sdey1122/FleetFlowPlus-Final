require("dotenv").config();
require("../src/config/env").validateEnv();
module.exports = require("../src/app");
