const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const rxSchema = new Schema(
  {
    rxID: { type: String, required: true, trim: true, unique: true },
    rxNumber: { type: String, required: true, trim: true },
    rxDate: { type: Date, required: true },
    refills: { type: String, required: true, trim: true },
    rxQty: { type: String, required: true, trim: true },
    patient: { type: ObjectId, required: true, ref: "Patient", index: true },
    doctorName: { type: String, required: true, trim: true },
    drugName: { type: String, required: true, trim: true },
    patPay: { type: String, required: true, trim: true, default: "0" },
  },
  { timestamps: true },
);

const model = mongoose.model("Rx", rxSchema);
/**
 * @typedef {object} RxSchema
 * @property {string} rxID
 * @property {string} rxNumber
 * @property {Date} rxDate
 * @property {string} refills
 * @property {string} rxQty
 * @property {string|import("mongoose").ObjectId} patient
 * @property {string} doctorName
 * @property {string} drugName
 * @property {string} patPay
 * @typedef {mongoose.HydratedDocument<RxSchema>} Rx
 */

module.exports = model;
