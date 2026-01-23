const Delivery = require("../schemas/delivery");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
// const customParseFormat = require("dayjs/plugin/customParseFormat");
// dayjs.extend(customParseFormat);
const { upsertRx } = require("./rx");
const { upsertPatient } = require("./patient");
const { getStationCodes, findStation } = require("./station");
const { handleMongoError } = require("./error");

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
 */

/**
 * @param {[Delivery.Delivery]} deliveries
 * @returns {[DeliveryRow]}
 */
const deliveryRows = async (deliveries) =>
  deliveries.map(({ createdAt, rx }, i) => ({
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
  }));

/**
 * @param {string} msg
 * @returns {Promise<Delivery.Delivery>}
 */
exports.createDelivery = async (msg) => {
  //
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const patient = await upsertPatient(patientSchema);
    const rx = await upsertRx({ ...rxSchema, patient });
    const station = await findStation(stationCode);
    const delivery = await Delivery.create({ rx });
  } catch (error) {
    session.abortTransaction();
    handleMongoError(error);
  } finally {
    session.endSession();
  }
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

// /**
//  * @param {string} invoiceCode
//  */
// exports.refreshCurrentDeliveries = async (invoiceCode) => {
//   if (!invoiceCode) {
//     throw { status: 400 };
//   }
//   const deliveryStation = nodeCache_stations.get(invoiceCode);
//   if (!deliveryStation) {
//     throw { status: 500 };
//   }
//   const now = dayjs();
//   const dRxes = await DRx.find({
//     $and: [
//       { deliveryStation },
//       {
//         deliveryDate: {
//           $gte: now.startOf("d"),
//           $lte: now.endOf("d"),
//         },
//       },
//     ],
//   });
//   const rows = await mapDeliveryRow(dRxes);
//   nodeCache_current_deliveries.set(invoiceCode, rows);
// };
