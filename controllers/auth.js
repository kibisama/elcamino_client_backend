const auth = require("../services/auth");
const { authLogger } = require("../logger");
const { decryptKey, decryptData } = require("../services/crypto");

exports.login = async (req, res, next) => {
  try {
    const { key, iv, data } = req.body;
    if (!(key && iv && data)) {
      return res.sendStatus(403);
    }
    const decryptedKey = decryptKey(key);
    const { username, password } = await decryptData(data, decryptedKey, iv);
    const result = await auth.login(username, password);
    authLogger("login", username, req);
    return res.send(result);
  } catch (e) {
    next(e);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const result = await auth.refreshToken(token);
      return res.send(result);
    } else {
      return res.sendStatus(401);
    }
  } catch (e) {
    next(e);
  }
};
