const User = require("../schemas/user");

/**
 * @param {string|import("mongoose").ObjectId} _id
 * @returns {Proimse<{id: string, name: string, stationCodes: [string]}>}
 */
exports.getUser = async (_id) => {
  if (!_id) {
    throw { status: 400 };
  }
  const user = await User.findById(_id);
  if (user) {
    return {
      id: user.username,
      name: user.name,
      stationCodes: user.stationCodes,
    };
  } else {
    throw { status: 404 };
  }
};
