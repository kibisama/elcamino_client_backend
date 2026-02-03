const mongoose = require("mongoose");
const { Schema } = mongoose;
const { encryptDB, decryptDB } = require("../services/crypto");

const patientSchema = new Schema(
  {
    patientID: { type: String, required: true, trim: true, unique: true },
    patientFirstName: { type: String, required: true },
    patientLastName: { type: String, required: true },
  },
  { timestamps: true },
);

patientSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  update.patientFirstName = encryptDB(update.patientFirstName.trim());
  update.patientLastName = encryptDB(update.patientLastName.trim());
});
patientSchema.post("findOne", async function (doc) {
  if (doc) {
    doc.patientFirstName = await decryptDB(doc.patientFirstName);
    doc.patientLastName = await decryptDB(doc.patientLastName);
  }
});
patientSchema.post("find", async function (docs) {
  if (docs.length > 0) {
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      doc.patientFirstName = await decryptDB(doc.patientFirstName);
      doc.patientLastName = await decryptDB(doc.patientLastName);
    }
  }
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
