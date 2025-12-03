const delivery = require("../../services/delivery");

exports.getDeliveries = async (req, res, next) => {
  try {
    const { invoiceCode, date } = req.params;
    return res.send(await delivery.getDeliveries(invoiceCode, date));
  } catch (e) {
    next(e);
  }
};

exports.refreshCache = async (req, res, next) => {
  try {
    const { invoiceCode } = req.params;
    await delivery.refreshCurrentDeliveries(invoiceCode);
    return res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};
