const Patient = require("../schemas/patient");
const NodeCache = require("node-cache");

// [patient.patientID]: patient
const nodeCache_patients = new NodeCache({ stdTTL: 28800, maxKeys: 100 });

/**
 * @param {string} patientID
 * @returns {Promise<Patient.Patient|null>}
 */
exports.findPatient = async (patientID) => {
  if (!patientID) {
    throw { status: 422 };
  }
  const cache = nodeCache_patients.get(patientID);
  if (cache) {
    return cache;
  }
  const patient = await Patient.findOne({ patientID });
  patient && exports.refresh_nodeCache_patients(patientID, patient);
  return patient;
};

/**
 * @param {*} patientID
 * @param {*} patient
 * @returns {boolean}
 */
exports.refresh_nodeCache_patients = (patientID, patient) =>
  nodeCache_patients.set(patientID, patient);
