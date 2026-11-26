require("dotenv").config();
const { validateEnv } = require("./src/config/env");
const startServer = async () => {
  const { port } = validateEnv();
  const app = require("./src/app");
  const connectDB = require("./src/config/dbcon");
  const redis = require("./src/config/redis");
  const User = require("./src/model/auth.model");
  await connectDB();
  await User.init();
  await redis.ping();
  const server = app.listen(port, "0.0.0.0", () =>
    console.log(`FleetFlow Plus Server running on http://localhost:${port}`),
  );
  const stop = () => {
    server.close(async () => {
      await require("mongoose").disconnect();
      process.exit(0);
    });
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
};
startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
