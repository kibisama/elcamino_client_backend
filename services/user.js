const User = require("../schemas/user");
const bcrypt = require("bcrypt");
const { getStationIds } = require("./station");
const { logout } = require("./auth");
const { handleMongoError } = require("./error");

/**
 * @typedef {object} UserInfo
 * @property {string} id
 * @property {string} name
 * @property {[string]} stationCodes
 */

/**
 * @param {User.User} user
 * @returns {UserInfo}
 */
const userInfo = ({ username, name, stationCodes }) => ({
  id: username,
  name,
  stationCodes,
});

/**
 * @param {string} username
 * @param {string} password
 * @param {string} name
 * @param {[string]} [stationCodes]
 * @returns {Proimse<UserInfo>}
 */
exports.createUser = async (username, password, name, stationCodes) => {
  if (!password) {
    throw { status: 422 };
  }
  const hash = await bcrypt.hash(password, 10);
  let stations;
  if (stationCodes) {
    stations = await getStationIds(stationCodes);
  }
  let user;
  try {
    user = await User.create({
      username,
      password: hash,
      name,
      stations,
    });
  } catch (error) {
    handleMongoError(error);
  }
  return { id: username, name, stationCodes };
};

/**
 * @param {import("mongoose").ObjectId|string} _id
 * @returns {Proimse<UserInfo>}
 */
exports.getUserInfo = async (_id) => {
  const user = await User.findById(_id);
  if (user) {
    return userInfo(user);
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<void>}
 */
exports.resetPassword = async (username, password) => {
  if (!(username && password)) {
    throw { status: 422 };
  }
  const user = await User.findOne({ username });
  if (user) {
    const hash = await bcrypt.hash(password, 10);
    await user.updateOne({ password: hash });
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {string} username
 * @returns {Promise<void>}
 */
exports.deleteUser = async (username) => {
  if (!username) {
    throw { status: 422 };
  }
  const user = await User.findOne({ username });
  if (user) {
    const _id = user._id.toString();
    logout(_id);
    await user.deleteOne();
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {string} username
 * @returns {Promise<[UserInfo]>}
 */
exports.getAllUsers = async () => {
  const users = await User.find();
  return users.map((user) => userInfo(user));
};
