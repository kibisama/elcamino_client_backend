const Station = require("../schemas/station");
const NodeCache = require("node-cache");
// [station.code]: station
const nodeCache_stations = new NodeCache();

(async function () {
  const stations = await Station.find();
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    station.active && nodeCache_stations.set(station.code, station);
    // await exports.refreshCurrentDeliveries(invoiceCode);
  }
})();

const { handleMongoError } = require("./error");

/**
 * @param {Parameters<Station["create"]>[0]} schema
 * @returns {Proimse<void>}
 */
exports.createStation = async (schema) => {
  let station;
  try {
    station = await Station.create(schema);
  } catch (error) {
    handleMongoError(error);
  }
  nodeCache_stations.set(station.code, station);
};

/**
 * @param {[string]} stationCodes
 * @returns {[string]}
 */
exports.getStationIds = (stationCodes) => {
  const stationIds = [];
  for (let i = 0; i < stationCodes.length; i++) {
    const station = nodeCache_stations.get(stationCodes[i]);
    if (station) {
      stationIds[i] = station._id.toString();
    } else {
      throw { status: 500 };
    }
  }
  return stationIds;
};
