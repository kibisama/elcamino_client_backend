const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");

/**
 * @param {string} username
 * @param {string} password
 * @returns {Proimse<>}
 */
exports.login = async (username, password) => {
  try {
    const user = await User.findOne({
      username,
    });
    if (user) {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        return jwt.sign(
          {
            sub: username,
          },
          process.env.JWT_SECRET
        );
      } else {
        return 401;
      }
    } else {
      return 404;
    }
  } catch (e) {
    throw e;
  }
};
