const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const dayjs = require("dayjs");
const { decodeQR } = require("../services/delivery");

/**
 * @typedef {object} Content1
 * @property {string} invoiceCode
 * @property {string} data
 * @property {string} delimiter
 */

/**
 * @param {amqplib.ConsumeMessage["content"]} content
 * @returns {*}
 */
const parseContent = (content) => JSON.parse(content.toString());

module.exports = async () => {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const queue1 = "client_delivery";
  const ch1 = await conn.createChannel();
  await ch1.assertQueue();
  ch1.consume(queue1, (msg) => {
    if (msg !== null) {
      if (
        dayjs(new Date(msg.properties.timestamp * 1000)).isSame(dayjs(), "d")
      ) {
        /** @type {Content1} */
        const content = parseContent(msg.content);
        const { invoiceCode, data, delimiter } = content;
        try {
          const { patientSchema, rxSchema } = decodeQR(data, delimiter);
        } catch (error) {
          //
        }
        //
        ch1.ack(msg);
      }
    }
  });
};
