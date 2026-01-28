const delivery = require("../services/delivery");
const { encryptData } = require("../services/crypto");

exports.getDeliveries = async (req, res, next) => {
  try {
    const { stationCodes } = req.user;
    const { stationCode, date } = req.params;
    if (!stationCodes.include(stationCode)) {
      return res.sendStatus(403);
    }
    const deliveries = await delivery.getDeliveries(stationCode, date);
    return res.send(encryptData(deliveries));
  } catch (e) {
    next(e);
  }
};
