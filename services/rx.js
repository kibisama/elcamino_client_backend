// const Rx = require("../schemas/rx");
// const { upsertPatient } = require("./patient");
// const { handleMongoError } = require("./error");

// /**
//  * @param {Rx.RxSchema} schema
//  * @returns {Promise<Rx.Rx>}
//  */
// exports.upsertRx = async (schema) => {
//   const { rxID } = schema;
//   if (!p) {
//     throw { status: 422 };
//   }
//   const patient = await exports.findPatient(patientID);
//   try {
//     if (patient) {
//       if (
//         patientFirstName === patient.patientFirstName &&
//         patientLastName === patient.patientLastName
//       ) {
//         return patient;
//       }
//       const updatedPatient = await Patient.findByIdAndUpdate(
//         patient,
//         {
//           $set: { patientFirstName, patientLastName },
//         },
//         { new: true }
//       );
//       nodeCache_patients.set(patientID, updatedPatient);
//       return updatedPatient;
//     }
//     return await Patient.create(schema);
//   } catch (error) {
//     handleMongoError(error);
//   }
// };
