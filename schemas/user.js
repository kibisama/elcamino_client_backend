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
 * @typedef {ReturnType<model["hydrate"]>} User
 */

module.exports = model;
