// const mongoose = require("mongoose");
// const { Schema } = mongoose;
// const {
//   Types: { ObjectId },
// } = Schema;
// const { decryptDB } = require("../services/crypto");

// const rxSchema = new Schema({
//   rxID: { type: String, required: true, unique: true },
//   rxNumber: { type: String, required: true },
//   rxDate: { type: String, required: true },
//   refills: { type: String, required: true },
//   rxQty: { type: String, required: true },
//   patient: { type: ObjectId, required: true, ref: "Patient", index: true },
//   doctorName: { type: String, required: true },
//   drugName: { type: String, required: true },
//   patPay: { type: String, required: true, default: "0" },
//   station: { type: ObjectId, ref: "Station", index: true },
//   deliveryDate: { type: Date, index: true },
// });

// rxSchema.post("find", async function (docs) {
//   if (docs.length > 0) {
//     for (let i = 0; i < docs.length; i++) {
//       const doc = docs[i];
//       const { patient } = await doc.populate("patient");
//       patient.patientFirstName = await decryptDB(patient.patientFirstName);
//       patient.patientLastName = await decryptDB(patient.patientLastName);
//     }
//   }
// });

// const model = mongoose.model("Rx", rxSchema);
// /**
//  * @typedef {Awaited<ReturnType<model["create"]>>[0]} Rx
//  */

// module.exports = model;
