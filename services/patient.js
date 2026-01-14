// const Patient = require("../schemas/patient");

// (async function () {
//   try {
//     if (!(await Patient.findOne())) {
//       await Patient.create({
//         patientLastName: "test",
//         patientID: "1",
//         patientFirstName: "test",
//       });
//     }
//   } catch (e) {
//     console.error(e);
//   }
// })();

// /**
//  * @param {DRxPtSchema} ptSchema
//  * @returns {Promise<DRxPt|undefined>}
//  */
// exports.upsertPatient = async (ptSchema) => {
//   try {
//     const { patientID } = ptSchema;
//     if (!patientID) {
//       return;
//     }
//     return await Pt.findOneAndUpdate(
//       { patientID },
//       { $set: ptSchema },
//       { new: true, upsert: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {string} query LastInit,FirstInit
//  * @returns {Promise<[{_id: ObjectId, label: string, dob: string}]|undefined>}
//  */
// exports.findPatient = async (query) => {
//   try {
//     const [last, first] = query.split(",").map((v) => v.trim());
//     const $and = [];
//     last &&
//       $and.push({ patientLastName: { $regex: `^${last}`, $options: "i" } });
//     first &&
//       $and.push({ patientFirstName: { $regex: `^${first}`, $options: "i" } });
//     return (await Pt.find({ $and })).map((v) => ({
//       _id: v._id,
//       label: v.patientLastName + "," + v.patientFirstName,
//       dob: v.patientDOB || "",
//     }));
//   } catch (e) {
//     console.error(e);
//   }
// };
