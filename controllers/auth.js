const auth = require("../services/auth");
const { authLogger } = require("../logger");
const { encryptData } = require("../services/crypto");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.data;
    const token = await auth.login(username, password);
    const encryptedToken = encryptData(token);
    authLogger("login", username, req);
    return res.send(encryptedToken);
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = (req, res, next) => {
  try {
    const { refresh_token } = req.data;
    const token = auth.refreshToken(refresh_token);
    const encryptedToken = encryptData(token);
    return res.send(encryptedToken);
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
    } else {
      return res.sendStatus(401);
    }
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
