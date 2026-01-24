const Delivery = require("../schemas/delivery");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const mongoose = require("mongoose");
const { upsertRx } = require("./rx");
const { upsertPatient } = require("./patient");
const { findStation } = require("./station");

const NodeCache = require("node-cache");
const nodeCache_stations = new NodeCache();
// [station.code]: { [dayjs(delivery.createdAt).format("MMDDYYYY")]: [DeliveryRow] }
const nodeCache_past_deliveries = new NodeCache({ stdTTL: 900, maxKeys: 25 });
let current_date = dayjs().format("MMDDYYYY");
// [station.code]: [DeliveryRow]
const nodeCache_current_deliveries = new NodeCache();

/**
 * @typedef {object} DeliveryRow
 * @property {string} id
 * @property {Date} time
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
 * @param {[Delivery.Delivery]} deliveries
 * @returns {[DeliveryRow]}
 */
const deliveryRows = async (deliveries) =>
  deliveries.map(({ createdAt, status, rx }, i) => ({
    id: i,
    time: createdAt,
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
 * @param {string} rxID
 * @param {Date} [date]
 * @returns {Promise<[Delivery.Delivery]>}
 */
exports.findDeliveriesByRxID = async (rxID, date) => {
  find;
};

/**
 * @param {import("../schemas/patient").PatientSchema} patientSchema
 * @param {import("../schemas/rx").RxSchema} rxSchema
 * @param {string} stationCode
 * @returns {Promise<Delivery.Delivery>}
 */
exports.createDelivery = async (patientSchema, rxSchema, stationCode) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const patient = await upsertPatient(patientSchema);
    const rx = await upsertRx({ ...rxSchema, patient });
    const station = await findStation(stationCode);
    const delivery = await Delivery.create({ rx, station });
    //
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * @param {string} qr
 * @param {string} delimiter
 * @returns {{patientSchema: import("../schemas/patient").PatientSchema, rxSchema: import("../schemas/rx").RxSchema}}
 */
exports.decodeQR = async (qr, delimiter) => {
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

// /**
//  * @param {string} invoiceCode
//  * @param {string} date MMDDYYYY
//  * @returns {Proimse<[DeliveryRow]>}
//  */
// exports.getDeliveries = async (invoiceCode, date) => {
//   if (!(invoiceCode && date)) {
//     throw { status: 400 };
//   }
//   const deliveryStation = nodeCache_stations.get(invoiceCode);
//   if (!deliveryStation) {
//     throw { status: 500 };
//   }
//   const deliveryDate = dayjs(date, "MMDDYYYY");
//   if (deliveryDate.isSame(dayjs(), "d")) {
//     const cache = nodeCache_current_deliveries.get(invoiceCode);
//     if (cache?.length > 0) {
//       return cache;
//     } else {
//       throw { status: 404 };
//     }
//   } else if (deliveryDate.isBefore(dayjs(), "d")) {
//     const key = invoiceCode + date;
//     const cache = nodeCache_past_deliveries.get(key);
//     if (cache) {
//       if (cache.length > 0) {
//         return cache;
//       } else {
//         throw { status: 404 };
//       }
//     } else {
//       const dRxes = await DRx.find({
//         $and: [
//           { deliveryStation },
//           {
//             deliveryDate: {
//               $gte: deliveryDate.startOf("d"),
//               $lte: deliveryDate.endOf("d"),
//             },
//           },
//         ],
//       });
//       if (dRxes.length > 0) {
//         const rows = await mapDeliveryRow(dRxes);
//         nodeCache_past_deliveries.set(key, rows);
//         return rows;
//       } else {
//         nodeCache_past_deliveries.set(key, []);
//         throw { status: 404 };
//       }
//     }
//   }
//   throw { status: 400 };
// };

/**
 * @param {string} stationCode
 * @returns {Promise<void>}
 */
exports.refresh_nodeCache_current_deliveries = async (stationCode) => {
  const station = await findStation(stationCode);
  const now = dayjs();
  const deliveries = await Delivery.find({
    $and: [
      { station },
      {
        createdAt: {
          $gte: now.startOf("d"),
          $lte: now.endOf("d"),
        },
      },
    ],
  });
  nodeCache_current_deliveries.set(stationCode, deliveryRows(deliveries));
};
