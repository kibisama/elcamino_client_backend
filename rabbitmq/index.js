const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const {
  handleNewDeliveryMessage,
  handleCancelDeliveryMessage,
} = require("../services/delivery");

/**
 * @param {amqplib.ChannelModel} conn
 * @param {string} queue
 * @param {(data: *)=>Promise<*>} handler
 * @param {number} [retryDelay]
 * @returns {Promise<void>}
 */
const handle = async (conn, queue, handler, retryDelay = 30000) => {
  const ch = await conn.createChannel();
  await ch.prefetch(1);
  await ch.assertQueue(queue, { durable: true });
  const retryQueue = queue + "_retry";
  await ch.assertQueue(retryQueue, {
    durable: true,
    deadLetterExchange: "",
    deadLetterRoutingKey: queue,
    messageTtl: retryDelay,
  });
  ch.consume(queue, async (msg) => {
    if (msg) {
      try {
        if (msg.properties.headers["x-retry-count"] > 5) {
          // save dead msg in DB

          ch.nack(msg, false, false);
          return;
        }
        await handler(JSON.parse(msg.content.toString()));
        ch.ack(msg);
      } catch ({ status }) {
        ch.nack(msg, false, false);
        if (status !== 422) {
          ch.publish("", retryQueue, msg.content, {
            persistent: true,
            headers: {
              "x-retry-count":
                (msg.properties.headers["x-retry-count"] || 0) + 1,
            },
          });
        }
      }
    }
  });
};

module.exports = async () => {
  const conn = await amqplib.connect(RABBITMQ_URL);
  await handle(conn, "new_delivery", handleNewDeliveryMessage);
  await handle(conn, "cancel_delivery", handleCancelDeliveryMessage);
};
