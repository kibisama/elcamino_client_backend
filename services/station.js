const Station = require("../schemas/station");
const { compareFields } = require("./utils");
const NodeCache = require("node-cache");
// [station.code]: station
const nodeCache_stations = new NodeCache();
(async function () {
  const stations = await Station.find();
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const { active, code } = station;
    active && nodeCache_stations.set(code, station);
  }
})();

/**
 * @param {Station.StationSchema} schema
 * @returns {Proimse<void>}
 */
exports.createStation = async (schema) => {
  const station = await Station.create(schema);
  nodeCache_stations.set(station.code, station);
};

/**
 * @param {[string]} stationCodes
 * @returns {Promise<string[]>}
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
  if (!stationCode) {
    throw { status: 422 };
  }
  const cache = nodeCache_stations.get(stationCode);
  if (cache) {
    return cache;
  }
  const station = await Station.findOne({ code: stationCode });
  if (station) {
    station.active && nodeCache_stations.set(stationCode, station);
    return station;
  } else {
    throw { status: 404 };
  }
};

/**
 * @param {import("../schemas/station").StationSchema[]} msg
 * @returns {Promise<void>}
 */
exports.syncStationMessage = async (msg) => {
  for (let i = 0; i < msg.length; i++) {
    const station = msg[i];
    try {
      const result = await exports.findStation(station.code);
      if (!compareFields(station, result)) {
        const updated = await Station.findOneAndUpdate(
          { _id: result._id, __v: result.__v },
          { $set: station, $inc: { __v: 1 } },
          { new: true }
        );
        if (!updated) {
          throw { status: 409 };
        }
        nodeCache_stations.set(updated.code, updated);
      }
    } catch (error) {
      if (error.status === 404) {
        await exports.createStation(station);
      } else {
        throw error;
      }
    }
  }
};
