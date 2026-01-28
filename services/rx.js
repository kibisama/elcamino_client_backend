const Rx = require("../schemas/rx");

/**
 * @param {Rx.RxSchema} schema
 * @returns {Promise<Rx.Rx>}
 */
exports.upsertRx = async (schema) => {
  const { rxID, ...rest } = schema;
  if (!rxID) {
    throw { status: 422 };
  }
  return await Rx.findOneAndUpdate(
    { rxID },
    { $set: rest },
    {
      new: true,
      upsert: true,
    }
  );
};

/**
 * @param {string} rxID
 * @returns {Promise<Rx.Rx|null>}
 */
exports.findRxByRxID = async (rxID) => {
  if (!rxID) {
    throw { status: 422 };
  }
  return await Rx.findOne({ rxID });
};
