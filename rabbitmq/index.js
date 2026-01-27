const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const { handleDeliveryMessage } = require("../services/delivery");

/**
 * @param {amqplib.ChannelModel} conn
 * @param {string} queue
 * @param {(data: *)=>Promise<*>} handler
 * @param {number} [retryDelay]
 * @param {function} [errorHandler]
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
          // save msg in DB

          ch.nack(msg, false, false);
          return;
        }
        await handler(JSON.parse(msg.content.toString()));
        ch.ack(msg);
      } catch (error) {
        ch.nack(msg, false, false);
        ch.publish("", retryQueue, msg.content, {
          persistent: true,
          headers: {
            "x-retry-count": (msg.properties.headers["x-retry-count"] || 0) + 1,
          },
        });
      }
    }
  });
};

module.exports = async () => {
  const conn = await amqplib.connect(RABBITMQ_URL);
  await handle(conn, "delivery", handleDeliveryMessage);
};
