const NodeCache = require("node-cache");
const Patient = require("../schemas/patient");

// [patientID]: maskedFullName
const nodeCache_patients = new NodeCache({stdTTL: });

/**
 * @param {DRxPtSchema} ptSchema
 * @returns {Promise<>}
 */
exports.upsertPatient = async (ptSchema) => {

    return await Pt.findOneAndUpdate(
      { patientID },
      { $set: ptSchema },
      { new: true, upsert: true }
    );
};

// /**
//  * @param {import("../schemas/mirror/patient").DRxPatient} patient
//  * @returns {string}
//  */
// const getPtFullName = (patient) => {
//   const { patientLastName, patientFirstName } = patient;
//   const length_ln = patientLastName.length;
//   const length_fn = patientFirstName.length;
//   const ln =
//     length_ln > 5
//       ? patientLastName.substring(0, 3) + "*".repeat(length_ln - 3)
//       : patientLastName.substring(0, 1) + "*".repeat(length_ln - 1);
//   const fn =
//     patientFirstName.substring(0, 3) +
//     "*".repeat(length_fn - 3 < 0 ? 0 : length_fn - 3);
//   return ln + "," + fn;
// };