const mongoose = require("mongoose");
const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    username: { type: String, lowercase: true, required: true, unique: true },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    stationCodes: [String],
  },
  { timestamps: true }
);
const model = mongoose.model("User", UserSchema);

/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} User
 */

module.exports = model;
