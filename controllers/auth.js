const auth = require("../services/auth");
const { auth_logger } = require("../logger");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await auth.login(username, password);
    auth_logger("login", username, req);
    return res.send(result);
  } catch (e) {
    next(e);
  }
};

exports.refresh_token = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await auth.refresh_token(refresh_token);
    return res.send(result);
  } catch (e) {
    next(e);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const result = await auth.getAllUsers();
    return res.send(result);
  } catch (e) {
    next(e);
  }
};
