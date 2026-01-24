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
