const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.set("port", process.env.PORT || 8080);

app.use(morgan("combined"));

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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const compression = require("compression");
app.use(compression());

const router = require("./routes");
app.use("/", router);

app.use(require("./error_handler"));

app.listen(app.get("port"), () =>
  console.log(app.get("port"), "번 포트에서 대기 중")
);
