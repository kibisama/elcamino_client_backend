const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const rxSchema = new Schema({
  rxID: { type: String, required: true, unique: true },
  // rxNumber: { type: String, required: true },
  // rxDate: { type: String, required: true },
  // refills: { type: String, required: true },
  // rxQty: { type: String, required: true },
  patient: { type: ObjectId, required: true, ref: "Patient" }, // index
  // doctorName: { type: String, required: true },
  // drugName: { type: String, required: true },
  // patPay: { type: String, required: true, default: "0" },
  station: { type: ObjectId, ref: "Station", index: true },
  deliveryDate: { type: Date, index: true },
});

const model = mongoose.model("Rx", rxSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Rx
 */

module.exports = model;
