// const mongoose = require("mongoose");
// let pending;
// const connectDB = async () => {
//   if (pending) {
//     await pending;
//     return mongoose.connection;
//   }
//   if (mongoose.connection.readyState === 1) {
//     await require("../model/auth.model").init();
//     return mongoose.connection;
//   }
//   if (!pending)
//     pending = mongoose
//       .connect(process.env.MONGODB_URI, {
//         serverSelectionTimeoutMS: 10000,
//         maxPoolSize: 10,
//       })
//       .then(async () => {
//         await require("../model/auth.model").init();
//       })
//       .finally(() => {
//         pending = undefined;
//       });
//   await pending;
//   return mongoose.connection;
// };
// module.exports = connectDB;

const mongoose = require("mongoose");

let pending;

const connectDB = async () => {
  if (pending) {
    await pending;
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 1) {
    await require("../model/auth.model").init();
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  pending = mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    })
    .then(async () => {
      console.log("MongoDB connected successfully");
      console.log("MongoDB Host:", mongoose.connection.host);
      console.log("MongoDB Database:", mongoose.connection.name);

      await require("../model/auth.model").init();
    })
    .finally(() => {
      pending = undefined;
    });

  await pending;

  return mongoose.connection;
};

module.exports = connectDB;
