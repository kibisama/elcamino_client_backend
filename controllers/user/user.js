const user = require("../../services/user");

exports.get = async (req, res, next) => {
  try {
    return res.send(await user.getUser(req.params._id));
  } catch (e) {
    next(e);
  }
};
