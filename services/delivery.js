const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const DRx = require("../schemas/mirror/dRx");
const Patient = require("../schemas/mirror/patient");
const DeliveryStation = require("../schemas/mirror/deliveryStation");
const NodeCache = require("node-cache");
// invoiceCode: station._id
const nodeCache_stations = new NodeCache();
// invoiceCode + MMDDYYYY: [DeliveryRow]
const nodeCache_past_deliveries = new NodeCache({ stdTTL: 300 });
// invoiceCode: [DeliveryRow]
const nodeCache_current_deliveries = new NodeCache();
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
 * @property {string} rxID
 * @property {Date} time
 * @property {Date} rxDate
 * @property {string} rxNumber
 * @property {string} patient
 * @property {string} drugName
 * @property {string} doctorName
 * @property {string} rxQty
 * @property {string} patPay
 */

/**
 * @param {import("../schemas/mirror/patient").DRxPatient} patient
 * @returns {string}
 */
const getPtFullName = (patient) => {
  const { patientLastName, patientFirstName } = patient;
  const length_ln = patientLastName.length;
  const length_fn = patientFirstName.length;
  const ln =
    length_fn > 4
      ? patientLastName.substring(0, 3) + "*".repeat(length_ln - 3)
      : patientLastName.substring(0, 1) + "*".repeat(length_ln - 1);
  const fn =
    length_fn > 4
      ? patientFirstName.substring(0, 3) + "*".repeat(length_fn - 3)
      : patientFirstName.substring(0, 1) + "*".repeat(length_fn - 1);
  return ln + "," + fn;
};

/**
 * @param {[DRx.DigitalRx]} dRxes
 * @returns {Promise<[DeliveryRow]>}
 */
const mapDeliveryRow = async (dRxes) => {
  /** @type {[DeliveryRow]} **/
  const rows = [];
  for (let i = 0; i < dRxes.length; i++) {
    const dRx = dRxes[i];
    await dRx.populate({
      path: "patient",
      select: {
        patientLastName: 1,
        patientFirstName: 1,
      },
    });
    rows.push({
      rxID: dRx.rxID,
      time: dRx.deliveryDate,
      rxDate: dRx.rxDate,
      rxNumber: dRx.rxNumber,
      patient: getPtFullName(dRx.patient),
      drugName: dRx.drugName,
      doctorName: dRx.doctorName,
      rxQty: dRx.rxQty,
      patPay: dRx.patPay,
    });
  }
  return rows;
};

/**
 * @param {string} invoiceCode
 * @param {string} date MMDDYYYY
 * @returns {Proimse<[DeliveryRow]>}
 */
exports.getDeliveries = async (invoiceCode, date) => {
  if (!(invoiceCode && date)) {
    throw { status: 400 };
  }
  const deliveryStation = nodeCache_stations.get(invoiceCode);
  if (!deliveryStation) {
    throw { status: 500 };
  }
  const deliveryDate = dayjs(date, "MMDDYYYY");
  if (deliveryDate.isSame(dayjs(), "d")) {
    const cache = nodeCache_current_deliveries.get(invoiceCode);
    if (cache?.length > 0) {
      return cache;
    } else {
      throw { status: 404 };
    }
  } else if (deliveryDate.isBefore(dayjs(), "d")) {
    const key = invoiceCode + date;
    const cache = nodeCache_past_deliveries.get(key);
    if (cache) {
      if (cache.length > 0) {
        return cache;
      } else {
        throw { status: 404 };
      }
    } else {
      const dRxes = await DRx.find({
        $and: [
          { deliveryStation },
          {
            deliveryDate: {
              $gte: deliveryDate.startOf("d"),
              $lte: deliveryDate.endOf("d"),
            },
          },
        ],
      });
      if (dRxes.length > 0) {
        const rows = await mapDeliveryRow(dRxes);
        nodeCache_past_deliveries.set(key, rows);
        return rows;
      } else {
        nodeCache_past_deliveries.set(key, []);
        throw { status: 404 };
      }
    }
  }
  throw { status: 400 };
};

/**
 * @param {string} invoiceCode
 */
exports.refreshCurrentDeliveries = async (invoiceCode) => {
  if (!invoiceCode) {
    throw { status: 400 };
  }
  const deliveryStation = nodeCache_stations.get(invoiceCode);
  if (!deliveryStation) {
    throw { status: 500 };
  }
  const now = dayjs();
  const dRxes = await DRx.find({
    $and: [
      { deliveryStation },
      {
        deliveryDate: {
          $gte: now.startOf("d"),
          $lte: now.endOf("d"),
        },
      },
    ],
  });
  nodeCache_current_deliveries.set(invoiceCode, dRxes);
};
