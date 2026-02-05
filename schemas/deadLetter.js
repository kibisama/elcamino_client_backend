const mongoose = require("mongoose");

const DeadLetterSchema = new mongoose.Schema(
  {
    payload: { type: mongoose.Schema.Types.Mixed, required: true },

    deathHistory: [
      {
        reason: String,
        queue: String,
        exchange: String,
        routingKeys: [String],
        time: Date,
        count: Number,
      },
    ],

    messageId: { type: String, required: true },
    errorMessage: String,
    status: {
      type: String,
      enum: ["PENDING", "REPROCESSED", "IGNORED"],
      required: true,
      default: "PENDING",
    },
  },
  { timestamps: true },
);
DeadLetterSchema.index({ "deathHistory.queue": 1, status: 1 });

module.exports = mongoose.model("DeadLetter", DeadLetterSchema);
