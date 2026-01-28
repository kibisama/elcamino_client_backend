const Delivery = require("../schemas/delivery");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const mongoose = require("mongoose");
const { findRxByRxID, upsertRx } = require("./rx");
const { upsertPatient } = require("./patient");
const { findStation } = require("./station");

const NodeCache = require("node-cache");
/**
 * @param {string} stationCode
 * @param {dayjs.Dayjs} day
 */
const get_nodeCache_past_deliveries_key = (stationCode, day) =>
  `${stationCode + day.format("MMDDYYYY")}`;
// [`${station.code + dayjs(delivery.date).format("MMDDYYYY")}`]: [DeliveryRow]
const nodeCache_past_deliveries = new NodeCache({ stdTTL: 900, maxKeys: 50 });
let today = dayjs();
// [station.code]: [DeliveryRow]
const nodeCache_current_deliveries = new NodeCache();

/**
 * @typedef {object} DeliveryRow
 * @property {string} id
 * @property {Date} date
 * @property {string} rxID
 * @property {Date} rxDate
 * @property {string} rxNumber
 * @property {string} patientName
 * @property {string} drugName
 * @property {string} doctorName
 * @property {string} rxQty
 * @property {string} patPay
 * @property {Delivery.DeliveryStatus} status
 */

/**
 * @param {Delivery.Delivery[]} deliveries
 * @returns {DeliveryRow[]}
 */
const deliveryRows = async (deliveries) =>
  deliveries.map(({ date, status, rx }, i) => ({
    id: i,
    date,
    rxID: rx.rxID,
    rxDate: rx.rxDate,
    rxNumber: rx.rxNumber,
    // patientName: delivery.rx.patientName,
    drugName: rx.drugName,
    doctorName: rx.doctorName,
    rxQty: rx.rxQty,
    patPay: rx.patPay,
    status: status,
  }));

/**
 * @param {string} qr
 * @param {string} delimiter
 * @returns {{patientSchema: import("../schemas/patient").PatientSchema, rxSchema: import("../schemas/rx").RxSchema}}
 */
const decodeQR = async (qr, delimiter) => {
  const [
    rxID,
    rxNumber,
    rxDate,
    patientID,
    patientLastName,
    pateintFirstName,
    drugName,
    doctorName,
    rxQty,
    refills,
    ,
    patPay,
  ] = qr.split(delimiter);
  if (
    !(
      rxID &&
      rxNumber &&
      rxDate &&
      patientID &&
      patientLastName &&
      pateintFirstName &&
      drugName &&
      doctorName &&
      rxQty &&
      refills
    )
  ) {
    throw { status: 422 };
  }
  return {
    patientSchema: { patientID, patientLastName, pateintFirstName },
    rxSchema: {
      rxID,
      rxNumber,
      rxDate,
      drugName,
      doctorName,
      rxQty,
      refills,
      patPay,
    },
  };
};

/**
 * @param {import("../schemas/patient").PatientSchema} patientSchema
 * @param {import("../schemas/rx").RxSchema} rxSchema
 * @param {string} stationCode
 * @param {dayjs.Dayjs} day
 * @returns {Promise<void>}
 */
exports.upsertDelivery = async (patientSchema, rxSchema, stationCode, day) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const patient = await upsertPatient(patientSchema);
    const rx = await upsertRx({ ...rxSchema, patient });
    const station = await findStation(stationCode);
    const delivery = await Delivery.findOne({
      rx,
      date: {
        $gte: day.startOf("d"),
        $lte: day.endOf("d"),
      },
    });
    if (!delivery) {
      await Delivery.create({ rx, date: day, station });
    } else {
      const { status } = delivery;
      if (status === "PROCESSED" || status === "CANCELED") {
        // updateOne processed &  station
      } else {
        throw { status: 422 };
      }
    }
    // refresh cache
    if (day.isSame(dayjs(), "d")) {
      await refresh_nodeCache_current_deliveries(stationCode);
    } else {
      const key = get_nodeCache_past_deliveries_key(stationCode, day);
      nodeCache_past_deliveries.get(key) &&
        (await refresh_nodeCache_past_deliveries(stationCode, day));
    }
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * @param {string} stationCode
 * @returns {Proimse<DeliveryRow[]>}
 */
const getCurrentDeliveries = async (stationCode) => {
  const cache = nodeCache_current_deliveries.get(stationCode);
  if (cache) {
    return cache;
  }
  await refresh_nodeCache_current_deliveries(stationCode);
  return nodeCache_current_deliveries.get(stationCode);
};

/**
 * @param {string} stationCode
 * @param {dayjs.Dayjs} day
 * @returns {Proimse<DeliveryRow[]>}
 */
const getPastDeliveries = async (stationCode, day) => {
  const key = get_nodeCache_past_deliveries_key(stationCode, day);
  const cache = nodeCache_past_deliveries.get(key);
  if (cache) {
    return cache;
  }
  await refresh_nodeCache_past_deliveries(stationCode, day);
  return nodeCache_current_deliveries.get(key);
};

/**
 * @param {string} stationCode
 * @param {string} date MMDDYYYY
 * @returns {Proimse<DeliveryRow[]>}
 */
exports.getDeliveries = async (stationCode, date) => {
  if (!(stationCode && date)) {
    throw { status: 422 };
  }
  const day = dayjs(date, "MMDDYYYY");
  const now = dayjs();
  if (day.isSame(now, "d")) {
    if (!now.isSame(today, "d")) {
      await refresh_nodeCache_current_deliveries(stationCode);
    }
    return await getCurrentDeliveries(stationCode);
  } else if (day.isBefore(now, "d")) {
    return await getPastDeliveries(stationCode, day);
  }
  throw { status: 404 };
};

/**
 * @param {string} stationCode
 * @returns {Promise<void>}
 */
const refresh_nodeCache_current_deliveries = async (stationCode) => {
  const now = dayjs();
  if (!now.isSame(today, "d")) {
    nodeCache_current_deliveries.flushAll();
    today = now;
  }
  const station = await findStation(stationCode);
  const deliveries = await Delivery.find({
    station,
    date: {
      $gte: now.startOf("d"),
      $lte: now.endOf("d"),
    },
    status: { $ne: "CANCELED" },
  });
  nodeCache_current_deliveries.set(stationCode, deliveryRows(deliveries));
};

/**
 * @param {string} stationCode
 * @param {dayjs.Dayjs} day
 * @returns {Promise<void>}
 */
const refresh_nodeCache_past_deliveries = async (stationCode, day) => {
  const station = await findStation(stationCode);
  const deliveries = await Delivery.find({
    station,
    date: {
      $gte: now.startOf("d"),
      $lte: now.endOf("d"),
    },
    status: { $ne: "CANCELED" },
  });
  nodeCache_past_deliveries.set(
    get_nodeCache_past_deliveries_key(stationCode, day),
    deliveryRows(deliveries)
  );
};

/**
 * MQ HANDLERS
 */

/**
 * @typedef {object} NewDeliveryMessage
 * @property {string} stationCode
 * @property {string} date
 * @property {string} data
 * @property {string} delimiter
 */

/**
 * @param {NewDeliveryMessage} msg
 * @returns {Promise<void>}
 */
exports.handleNewDeliveryMessage = async (msg) => {
  const { stationCode, date, data, delimiter } = msg;
  const { patientSchema, rxSchema } = decodeQR(data, delimiter);
  await exports.upsertDelivery(
    patientSchema,
    rxSchema,
    stationCode,
    dayjs(date)
  );
};

/**
 * @typedef {object} CancelDeliveryMessage
 * @property {string} rxID
 * @property {string} date
 */

/**
 * @param {CancelDeliveryMessage} msg
 * @returns {Promise<void>}
 */
exports.handleCancelDeliveryMessage = async (msg) => {
  const { rxID, date } = msg;
  const rx = await findRxByRxID(rxID);
  if (!rx) {
    throw { status: 404 };
  }
  const delivery = await Delivery.findOne({ rx, date: new Date(date) });
  if (!delivery) {
    throw { status: 404 };
  }
  const { status } = delivery;
};

// /**
//  * @typedef {object} ShipDeliveryMessage
//  * @property {string} stationCode
//  * @property {string}
//  */

// /**
//  * @param {ShipDeliveryMessage} msg
//  * @returns {Promise<void>}
//  */
// exports.handleShipDeliveryMessage = async (msg) => {
//   const { stationCode} = msg;
// };
