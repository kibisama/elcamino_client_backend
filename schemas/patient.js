const mongoose = require("mongoose");
const { Schema } = mongoose;
const { encryptDB, decryptDB } = require("../services/crypto");

const patientSchema = new Schema(
  {
    patientID: { type: String, required: true, trim: true, unique: true },
    patientFirstName: { type: String, required: true },
    patientLastName: { type: String, required: true },
  },
  { timestamps: true }
);

patientSchema.pre("save", function () {
  this.patientFirstName = encryptDB(this.patientFirstName.trim());
  this.patientLastName = encryptDB(this.patientLastName.trim());
});
patientSchema.post("findOne", async function () {
  this.patientFirstName = await decryptDB(this.patientFirstName);
  this.patientLastName = await decryptDB(this.patientLastName);
  this.patientName = this.patientLastName + "," + this.patientFirstName;
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
