const mongoose = require("mongoose");
const { Schema } = mongoose;
const { encrypt, decrypt } = require("../services/crypto");

const patientSchema = new Schema({
  patientID: { type: String, required: true, unique: true },
  patientFirstName: { type: String, required: true },
  patientLastName: { type: String, required: true },
});

patientSchema.pre("save", function () {
  this.patientFirstName = encrypt(this.patientFirstName);
  this.patientLastName = encrypt(this.patientLastName);
});

patientSchema.post("findOne", function (doc) {
  if (doc) {
    doc.patientFirstName = decrypt(doc.patientFirstName);
    doc.patientLastName = decrypt(doc.patientLastName);
  }
});

const model = mongoose.model("Patient", patientSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Patient
 */

module.exports = model;
