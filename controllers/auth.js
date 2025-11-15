const auth = require("../services/auth");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await auth.login(email, password);
    if (typeof result === "number") {
      return res.sendStatus(result);
    } else {
      return res.send(result);
    }
  } catch (e) {
    next(e);
  }
};
