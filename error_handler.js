const { auth_logger } = require("./logger");

module.exports = (e, req, res, next) => {
  console.error(e);
  const { name, code } = e;
  let status = e.status;
  if (!status) {
    switch (name) {
      case "MongoServerError":
        switch (code) {
          case 11000:
            status = 409;
            break;
          default:
        }
        break;
      case "JsonWebTokenError":
        status = 401;
        auth_logger("JsonWebTokenError", req.body, req);
        break;
      case "ValidationError":
        // mongo validation error
        status = 400;
      default:
    }
  }
  return res.sendStatus(status || 500);
};
