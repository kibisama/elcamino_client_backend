const mongoose = require("mongoose");
const { Schema } = mongoose;

const stationSchema = new Schema({
  code: { type: String, uppercase: true, required: true, unique: true },
  active: { type: Boolean, required: true, default: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  phone: { type: String, required: true },
});

const model = mongoose.model("Station", stationSchema);

/**
 * @typedef {object} StationSchema
 * @property {string} code
 * @property {boolean} [active]
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} phone
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Station
 */

module.exports = model;
