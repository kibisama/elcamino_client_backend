const mongoose = require("mongoose");
const { Schema } = mongoose;
const { encryptDB } = require("../services/crypto");

const patientSchema = new Schema({
  patientID: { type: String, required: true, unique: true },
  patientFirstName: { type: String, required: true },
  patientLastName: { type: String, required: true },
});

patientSchema.pre("save", async function () {
  this.patientFirstName = encryptDB(this.patientFirstName);
  this.patientLastName = encryptDB(this.patientLastName);
});

const model = mongoose.model("Patient", patientSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Patient
 */

module.exports = model;
