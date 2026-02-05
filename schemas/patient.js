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

patientSchema.pre("save", function () {
  this.patientFirstName = encryptDB(this.patientFirstName.trim());
  this.patientLastName = encryptDB(this.patientLastName.trim());
});
patientSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update.$set?.patientFirstName) {
    update.$set.patientFirstName = encryptDB(
      update.$set.patientFirstName.trim(),
    );
  } else if (update.patientFirstName) {
    update.patientFirstName = encryptDB(update.patientFirstName.trim());
  }
  if (update.$set?.patientLastName) {
    update.$set.patientLastName = encryptDB(update.$set.patientLastName.trim());
  } else if (update.patientLastName) {
    update.patientLastName = encryptDB(update.patientLastName.trim());
  }
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
 * @typedef {mongoose.HydratedDocument<PatientSchema>} Patient
 */

module.exports = model;
