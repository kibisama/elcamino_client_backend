const Patient = require("../schemas/patient");
const { handleMongoError } = require("./error");
const NodeCache = require("node-cache");

// [patient.patientID]: patient
const nodeCache_patients = new NodeCache({ stdTTL: 28800, maxKeys: 100 });

/**
 * @param {string} patientID
 * @returns {Promise<Patient.Patient|null>}
 */
exports.findPatient = async (patientID) => {
  const cache = nodeCache_patients.get(patientID);
  if (cache) {
    return cache;
  }
  const patient = await Patient.findOne({ patientID });
  patient && nodeCache_patients.set(patientID, patient);
  return patient;
};

/**
 * Returns a cached document.
 * @param {Patient.PatientSchema} schema
 * @returns {Promise<Patient.Patient>}
 */
exports.upsertPatient = async (schema) => {
  const { patientID, patientFirstName, patientLastName } = schema;
  if (!patientID) {
    throw { status: 422 };
  }
  const patient = await exports.findPatient(patientID);
  try {
    if (patient) {
      if (
        patientFirstName === patient.patientFirstName &&
        patientLastName === patient.patientLastName
      ) {
        return patient;
      }
      const updatedPatient = await Patient.findByIdAndUpdate(
        patient,
        {
          $set: { patientFirstName, patientLastName },
        },
        { new: true }
      );
      nodeCache_patients.set(patientID, updatedPatient);
      return updatedPatient;
    }
    const _patient = await Patient.create(schema);
    nodeCache_patients.set(patientID, _patient);
    return _patient;
  } catch (error) {
    handleMongoError(error);
  }
};
