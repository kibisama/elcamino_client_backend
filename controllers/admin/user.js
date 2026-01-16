const user = require("../../services/user");

exports.createUser = async (req, res, next) => {
  try {
    const { username, password, name, stationCodes } = req.body;
    const result = await user.createUser(
      username,
      password,
      name,
      stationCodes
    );
    return res.send(result);
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    await user.resetPassword(username, password);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { username } = req.body;
    await user.deleteUser(username);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await user.getAllUsers();
    return res.send(result);
  } catch (error) {
    next(error);
  }
};
