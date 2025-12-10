const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");
const NodeCache = require("node-cache");
const nodeCache_users = new NodeCache();

(async function () {
  try {
    if (!(await User.findOne())) {
      await User.create({
        name: "Cri Help Inc.",
        username: process.env.INIT_USER_NAME,
        password: await bcrypt.hash(process.env.INIT_USER_PASSWORD, 10),
        stationCodes: ["CLD", "CLR", "CPD", "CPR", "CSD", "CSR"],
      });
    }
  } catch (e) {
    console.error(e);
  }
})();

/**
 * @typedef {object} Token
 * @property {string}
 * @property {string} access_token
 * @property {string} refresh_token
 */

/**
 * @param {*} _id
 * @param {[string]} stationCodes
 * @returns {Token}
 */
const create_tokens = (_id, stationCodes) => {
  const refresh_token = jwt.sign(
    { sub: _id, stationCodes },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  // set local cache
  nodeCache_users.set(_id, refresh_token);
  return {
    _id,
    access_token: jwt.sign(
      { sub: _id, stationCodes },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" }
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
    throw { status: 400 };
  }
  const user = await User.findOne({ username });
  if (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      const _id = user._id.toString();
      return create_tokens(_id, user.stationCodes);
    } else {
      throw { status: 401 };
    }
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {string} refresh_token
 * @returns {Proimse<Token>}
 */
exports.refresh_token = async (refresh_token) => {
  if (!refresh_token) {
    throw { status: 400 };
  }
  const payload = jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_TOKEN_SECRET
  );
  const { sub, stationCodes } = payload;
  // get local cache
  const cache_refresh_token = nodeCache_users.get(sub);
  if (!cache_refresh_token) {
    throw { status: 419 };
  }
  // else if (cache_refresh_token === refresh_token) {
  //   return create_tokens(sub, stationCodes);
  // } else {
  //   throw new jwt.JsonWebTokenError();
  // }
  return create_tokens(sub, stationCodes);
};
