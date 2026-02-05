const Delivery = require("../schemas/delivery");
const Patient = require("../schemas/patient");
const Rx = require("../schemas/rx");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const mongoose = require("mongoose");
const { findPatient, set_nodeCache_patients } = require("./patient");
const { findStation } = require("./station");
const { compareFields } = require("./utils");

/**
 * NodeCache
 */
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
      $gte: day.startOf("d"),
      $lte: day.endOf("d"),
    },
    status: { $ne: "CANCELED" },
  });
  nodeCache_past_deliveries.set(
    get_nodeCache_past_deliveries_key(stationCode, day),
    deliveryRows(deliveries),
  );
};

/**
 * @param {string} stationCode
 * @param {dayjs.Dayjs} day
 * @returns {Promise<void>}
 */
const refresh_nodeCache_deliveries = async (stationCode, day) => {
  if (!(stationCode && day)) {
    throw { status: 400 };
  }
  if (day.isSame(dayjs(), "d")) {
    await refresh_nodeCache_current_deliveries(stationCode);
  } else {
    await refresh_nodeCache_past_deliveries(stationCode, day);
  }
};

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
const deliveryRows = (deliveries) =>
  deliveries.map(({ date, status, rx }, i) => ({
    id: i,
    date,
    rxID: rx.rxID,
    rxDate: rx.rxDate,
    rxNumber: rx.rxNumber,
    patientName: rx.patient.patientLastName + "," + rx.patient.patientFirstName,
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
const decodeQR = (qr, delimiter) => {
  const [
    rxID,
    rxNumber,
    rxDate,
    patientID,
    patientLastName,
    patientFirstName,
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
      patientFirstName &&
      drugName &&
      doctorName &&
      rxQty &&
      refills
    )
  ) {
    throw { status: 400 };
  }
  return {
    patientSchema: { patientID, patientLastName, patientFirstName },
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
  const { patientID } = patientSchema;
  let patient = await findPatient(patientID);
  try {
    if (!patient) {
      // WARNING: to pass a `session` to `Model.create()` in Mongoose, you **must** pass an array as the first argument.
      patient = (await Patient.create([patientSchema], { session }))[0];
    } else if (!compareFields(patientSchema, patient)) {
      patient = await Patient.findOneAndUpdate(
        { _id: patient, __v: patient.__v },
        { $set: patientSchema, $inc: { __v: 1 } },
        { runValidators: true, new: true, session },
      );
      if (!patient) {
        throw { status: 409 };
      }
    }
    let rx = await Rx.findOne({ rxID: rxSchema.rxID });
    if (!rx) {
      rx = (await Rx.create([{ ...rxSchema, patient }], { session }))[0];
    } else if (!compareFields(rxSchema, rx)) {
      rx = await Rx.findOneAndUpdate(
        { _id: rx, __v: rx.__v },
        { $set: { ...rxSchema, patient }, $inc: { __v: 1 } },
        { runValidators: true, new: true, session },
      );
      if (!rx) {
        throw { status: 409 };
      }
    }
    const { _id: station } = await findStation(stationCode);
    const delivery = await Delivery.findOne({
      rx,
      date: {
        $gte: day.startOf("d"),
        $lte: day.endOf("d"),
      },
    }).session(session);

    let isStationChanged;
    let exStationCode;
    if (!delivery) {
      await Delivery.create([{ rx, date: day, station }], { session });
    } else {
      const {
        _id,
        __v,
        station: { code },
        status,
      } = delivery;
      isStationChanged = code !== stationCode;
      exStationCode = code;
      switch (status) {
        case "PROCESSED":
          if (isStationChanged) {
            const result = await Delivery.findOneAndUpdate(
              { _id, __v },
              { $set: { station }, $inc: { __v: 1 } },
              { runValidators: true, session },
            );
            if (!result) {
              throw { status: 409 };
            }
          }
          break;
        case "CANCELED":
          const result = await Delivery.findOneAndUpdate(
            { _id, __v },
            { $set: { station, status: "PROCESSED" }, $inc: { __v: 1 } },
            { runValidators: true, session },
          );
          if (!result) {
            throw { status: 409 };
          }
          break;
        case "RETURNED":
          await Delivery.create([{ rx, date: day, station }], { session });
          break;
        default:
          throw { status: 422 };
      }
    }
    await session.commitTransaction();
    set_nodeCache_patients(patientID, patient);
    isStationChanged &&
      (await refresh_nodeCache_deliveries(exStationCode, day));
    await refresh_nodeCache_deliveries(stationCode, day);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * @param {string} rxID
 * @param {dayjs.Dayjs} day
 * @returns {Promise<void>}
 */
exports.cancelDelivery = async (rxID, day) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const rx = await Rx.findOne({ rxID }).session(session);
    if (!rx) {
      throw { status: 404 };
    }
    const delivery = await Delivery.findOne({
      rx,
      date: {
        $gte: day.startOf("d"),
        $lte: day.endOf("d"),
      },
    }).session(session);
    if (!delivery) {
      throw { status: 404 };
    }
    const {
      _id,
      __v,
      status,
      station: { code },
    } = delivery;
    const update = { $set: {} };
    switch (status) {
      case "PROCESSED":
        update.$set.status = "CANCELED";
        break;
      case "SHIPPED":
        update.$set.status = "RETURNED";
        break;
      case "DELAYED":
        update.$set.status = "CANCELED";
        break;
      default:
        throw { status: 422 };
    }
    const updated = await Delivery.findOneAndUpdate({ _id, __v }, update, {
      runValidators: true,
      session,
    });
    if (!updated) {
      throw { status: 409 };
    }
    await session.commitTransaction();
    await refresh_nodeCache_deliveries(code, day);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
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
  return nodeCache_past_deliveries.get(key);
};

/**
 * @param {string} stationCode
 * @param {string} date MMDDYYYY
 * @returns {Proimse<DeliveryRow[]>}
 */
exports.getDeliveries = async (stationCode, date) => {
  if (!(stationCode && date)) {
    throw { status: 400 };
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
    dayjs(date),
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
  await exports.cancelDelivery(rxID, dayjs(date));
};

/**
 * @typedef {object} ShipDeliveryMessage
 * @property {string} stationCode
 * @property {string[]} rxIDs
 * @property {string} date
 */

// /**
//  * @param {ShipDeliveryMessage} msg
//  * @returns {Promise<void>}
//  */
// exports.handleShipDeliveryMessage = async (msg) => {
//   const { stationCode} = msg;
// };
