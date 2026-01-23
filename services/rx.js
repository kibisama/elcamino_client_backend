const Rx = require("../schemas/rx");
const { handleMongoError } = require("./error");

/**
 * @param {Rx.RxSchema} schema
 * @returns {Promise<Rx.Rx>}
 */
exports.upsertRx = async (schema) => {
  const { rxID } = schema;
  if (!rxID) {
    throw { status: 422 };
  }
  try {
    return await Rx.findOneAndUpdate(
      { rxID },
      { $set: schema },
      {
        new: true,
        upsert: true,
      },
    );
  } catch (error) {
    handleMongoError(error);
  }
};
