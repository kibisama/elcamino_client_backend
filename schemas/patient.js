const mongoose = require("mongoose");
const { Schema } = mongoose;
const { encryptDB } = require("../services/crypto");

const patientSchema = new Schema(
  {
    patientID: { type: String, required: true, unique: true },
    patientFirstName: { type: String, required: true },
    patientLastName: { type: String, required: true },
  },
  { timestamps: true }
);

patientSchema.pre("save", async function () {
  this.patientFirstName = encryptDB(this.patientFirstName.trim());
  this.patientLastName = encryptDB(this.patientLastName.trim());
});

const model = mongoose.model("Patient", patientSchema);
/**
 * @typedef {object} PatientSchema
 * @property {string} patientID
 * @property {string} patientFirstName
 * @property {string} patientLastName
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Patient
 */

module.exports = model;
