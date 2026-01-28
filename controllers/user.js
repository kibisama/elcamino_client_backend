const user = require("../services/user");
const { encryptData } = require("../services/crypto");

exports.getUserInfo = async (req, res, next) => {
  try {
    const userInfo = await user.getUserInfo(req.user._id);
    return res.send(encryptData(userInfo));
  } catch (error) {
    next(error);
  }
};
