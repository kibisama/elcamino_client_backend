const dayjs = require("dayjs");
const DRx = require("../schemas/mirror/dRx");
const DeliveryStation = require("../schemas/mirror/deliveryStation");
const NodeCache = require("node-cache");
const nodeCache_stations = new NodeCache();

(async function () {
  try {
    const stations = await DeliveryStation.find();
    for (let i = 0; i < stations.length; i++) {
      const { invoiceCode, _id } = stations[i];
      nodeCache_stations.set(invoiceCode, _id.toString());
    }
  } catch (e) {
    console.error(e);
  }
})();

/**
 * @typedef {object} DeliveryRow
 * @property {number} id
 * @property {}
 */

/**
 * @param {[DRx]} dRxes
 * @returns {[DeliveryRow]}
 */
const mapMuiDataGrid = (dRxes) => {
  return dRxes.map((v, i) => ({
    id: i,
  }));
};

/**
 * @param {string} invoiceCode cache key
 * @param {string} date MMDDYYYY
 * @returns {Proimse<>}
 */
exports.getUser = async (invoiceCode, date) => {
  if (!(invoiceCode && date)) {
    throw { status: 400 };
  }
  const deliveryDate = dayjs(date, "MMDDYYYY");
  const deliveryStation = nodeCache_stations.get(invoiceCode);
  if (!deliveryStation) {
    throw { status: 500 };
  }
  const dRxes = await DRx.find({ deliveryStation, deliveryDate });
  if (dRxes.length > 0) {
    return {
      id: user.username,
      name: user.name,
      stationCodes: user.stationCodes,
    };
  } else {
    throw { status: 404 };
  }
};
