const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");
const NodeCache = require("node-cache");
// [_id]: refresh_token
const nodeCache_users = new NodeCache();

/**
 * @typedef {object} Token
 * @property {string}
 * @property {string} access_token
 * @property {string} refresh_token
 */

/**
 * @param {string} _id
 * @param {[string]} stationCodes
 * @returns {Token}
 */
const create_tokens = (_id, stationCodes) => {
  const refresh_token = jwt.sign(
    { sub: _id, stationCodes },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
  nodeCache_users.set(_id, refresh_token);
  return {
    _id,
    access_token: jwt.sign(
      { sub: _id, stationCodes },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    ),
    refresh_token,
  };
};

/**
 * @param {string} username
 * @param {string} password
 * @returns {Proimse<Token>}
 */
exports.login = async (username, password) => {
  if (!(username && password)) {
    throw { status: 422 };
  }
  const user = await User.findOne({ username });
  if (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return create_tokens(user._id.toString(), user.stationCodes);
    } else {
      throw { status: 401 };
    }
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {string} _id
 * @returns {void}
 */
exports.logout = async (_id) => {
  nodeCache_users.del(_id);
};

/**
 * @param {string} refresh_token
 * @returns {Proimse<Token>}
 */
exports.refresh_token = async (refresh_token) => {
  const payload = jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_TOKEN_SECRET
  );
  const { sub, stationCodes } = payload;
  const cacheRefreshToken = nodeCache_users.get(sub);
  if (!cacheRefreshToken) {
    throw { status: 419 };
  } else if (cacheRefreshToken !== refresh_token) {
    nodeCache_users.del(sub);
    throw { status: 401 };
  } else {
    return create_tokens(sub, stationCodes);
  }
};
