const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const userSchema = new Schema(
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
    stations: [{ type: ObjectId, ref: "Station" }],
  },
  { timestamps: true }
);

userSchema.post("findOne", async function (doc) {
  if (doc) {
    await doc.populate("stations", "code");
    doc.stationCodes = doc.stations.map((station) => station.code);
  }
});

userSchema.post("find", async function (docs) {
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    await doc.populate("stations", "code");
    doc.stationCodes = doc.stations.map((station) => station.code);
  }
});

const model = mongoose.model("User", userSchema);

/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} User
 */

module.exports = model;
