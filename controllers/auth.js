const auth = require("../services/auth");
const { authLogger } = require("../logger");
const { encryptData } = require("../services/crypto");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.data;
    const token = await auth.login(username, password);
    res.send(encryptData(token));
    authLogger("login", username, req);
    return;
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = (req, res, next) => {
  try {
    const { refresh_token } = req.data;
    const token = auth.refreshToken(refresh_token);
    return res.send(encryptData(token));
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.split(" ")[1];
      auth.logout(accessToken);
      return res.sendStatus(200);
    }
    return res.sendStatus(401);
  } catch (error) {
    next(error);
  }
};
