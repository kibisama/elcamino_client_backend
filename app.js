const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

require("./schemas")();

const app = express();
app.set("port", process.env.PORT || 8080);

app.use(cors({ origin: "*" }));
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

const passport = require("passport");
require("./passport")();
app.use(passport.initialize());

const compression = require("compression");
app.use(compression());

const router = require("./routes");
const uap = require("ua-parser-js");
app.use((req, res, next) => {
  req.ua = uap(req.headers["user-agent"]);
  next();
});
app.use("/", router);

app.use(require("./error_handler"));

app.listen(app.get("port"), () =>
  console.log(app.get("port"), "번 포트에서 대기 중")
);
