const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const deliverySchema = new Schema(
  {
    rx: { type: ObjectId, ref: "Rx", required: true },
    date: { type: Date, required: true, index: true },
    station: { type: ObjectId, ref: "Station", required: true, index: true },
    status: {
      type: String,
      enum: ["PROCESSED", "CANCELED", "SHIPPED", "DELAYED", "RETURNED"],
      required: true,
      default: "PROCESSED",
      index: true,
    },
  },
  { timestamps: true },
);
deliverySchema.index({ rx: 1, date: 1 }, { unique: true });

deliverySchema.post("findOne", async function (doc) {
  if (doc) {
    await doc.populate({ path: "rx", populate: { path: "patient" } });
  }
});
deliverySchema.post("find", async function (docs) {
  if (docs.length > 0) {
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      await doc.populate({ path: "rx", populate: { path: "patient" } });
    }
  }
});

const model = mongoose.model("Delivery", deliverySchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Delivery
 * @typedef {"PROCESSED"|"CANCELED"|"DELAYED"|"SHIPPED"|"RETURNED"} DeliveryStatus
 */

module.exports = model;
