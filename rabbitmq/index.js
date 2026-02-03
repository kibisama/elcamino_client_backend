const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const { syncStationMessage } = require("../services/station");
const {
  handleNewDeliveryMessage,
  handleCancelDeliveryMessage,
} = require("../services/delivery");

const handlers = {
  delivery_new: handleNewDeliveryMessage,
  delivery_cancel: handleCancelDeliveryMessage,
};

const retrySuffix = "_retry";

module.exports = async () => {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  // await ch.prefetch(1);

  let isSynced = false;
  /** @type {{queue: string, msg: amqplib.Message}[]} */
  let msgQueues = [];

  /**
   * @param {amqplib.Message} msg
   * @param {string} queue
   * @returns {Promise<void>}
   */
  const consume = async (msg, queue) => {
    try {
      if (msg.properties.headers["x-retry-count"] > 5) {
        // save msg to DB

        ch.nack(msg, false, false);
        return;
      }
      await handlers[queue](JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch (error) {
      // console.error(error);
      ch.nack(msg, false, false);
      if (error.status !== 422) {
        ch.publish("", queue + retrySuffix, msg.content, {
          persistent: true,
          headers: {
            "x-retry-count": (msg.properties.headers["x-retry-count"] || 0) + 1,
          },
        });
      }
    }
  };

  /**
   * @param {string} queue
   * @returns {Promise<void>}
   */
  const setHandler = async (queue) => {
    await ch.assertQueue(queue);
    await ch.assertQueue(queue + retrySuffix, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: queue,
      messageTtl: 5000,
    });
    ch.consume(queue, async (msg) => {
      if (isSynced) {
        await consume(msg, queue);
      } else {
        msgQueues.push({ msg, queue });
      }
    });
  };

  /**
   * Initialization
   */
  await ch.assertQueue("init_station_sync");
  ch.sendToQueue("req_init_station_sync", Buffer.from(""), {
    persistent: true,
  });
  ch.consume("init_station_sync", async (msg) => {
    if (msg) {
      await syncStationMessage(JSON.parse(msg.content.toString()));
      // sync deliveries
      isSynced = true;
      for (const msgQueue of msgQueues) {
        const { msg, queue } = msgQueue;
        await consume(msg, queue);
      }
      msgQueues = [];
      ch.ack(msg);
    }
  });
  for (const queue in handlers) {
    await setHandler(queue);
  }
};
