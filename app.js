const dotenv = require("dotenv");
dotenv.config();

require("./schemas")();

const express = require("express");
const app = express();
app.set("port", process.env.PORT || 8081);

if (process.env.NODE_ENV === "production") {
  const helmet = require("helmet");
  const hpp = require("hpp");

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(hpp());
}

const morgan = require("morgan");
app.use(morgan("combined"));

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  max: 20,
  windowMs: 1000,
  message: "Too many requests from this IP",
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const passport = require("passport");
require("./passport")();
app.use(passport.initialize());

const compression = require("compression");
app.use(compression());

const uap = require("ua-parser-js");
app.use((req, res, next) => {
  req.ua = uap(req.headers["user-agent"]);
  next();
});

const router = require("./routes");
app.use("/", router);
app.use(require("./errorHandler"));

app.listen(app.get("port"), () =>
  console.log(`Listening on port ${app.get("port")}`)
);

//
const amqplib = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const queue = "delivery";
(async () => {
  const conn = await amqplib.connect(RABBITMQ_URL);

  const ch1 = await conn.createChannel();
  await ch1.assertQueue(queue);

  // Listener
  ch1.consume(queue, (msg) => {
    if (msg !== null) {
      console.log(msg);
      console.log("Received:", msg.content.toString());
      ch1.ack(msg);
    } else {
      console.log("Consumer cancelled by server");
    }
  });

  // // Sender
  // const ch2 = await conn.createChannel();

  // setInterval(() => {
  //   ch2.sendToQueue(queue, Buffer.from("something to do"));
  // }, 1000);
})();
