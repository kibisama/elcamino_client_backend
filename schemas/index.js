const mongoose = require("mongoose");

const connect = () => {
  if (process.env.NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }
  mongoose
    .connect(process.env.MONGODB_ADDRESS, {
      dbName: "elcamino_client",
    })
    .catch((error) => {
      console.error("MongoDB Connection Error", error);
    });
};

mongoose.connection.on("error", (error) => {
  console.error("MongoDB Connection Error", error);
});
mongoose.connection.on("disconnected", () => {
  console.error("Disconnected from MongoDB. Reconnecting...");
  connect();
});

module.exports = connect;
