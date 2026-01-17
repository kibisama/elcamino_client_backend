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
 * @param {Station.StationSchema} schema
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
 * @returns {Promise<[string]>}
 */
exports.getStationIds = async (stationCodes) => {
  const stationIds = [];
  for (let i = 0; i < stationCodes.length; i++) {
    try {
      const station = await exports.findStation(stationCodes[i]);
      stationIds[i] = station._id.toString();
    } catch (error) {
      throw { status: 500 };
    }
  }
  return stationIds;
};

/**
 * @param {string} stationCode
 * @returns {Promise<Station.Station>}
 */
exports.findStation = async (stationCode) => {
  const cache = nodeCache_stations.get(stationCode);
  if (cache) {
    return cache;
  }
  const station = await Station.findOne({ code: stationCode });
  if (station) {
    nodeCache_stations.set(stationCode, station);
    return station;
  } else {
    throw { status: 404 };
  }
};
