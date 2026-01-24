const { auth_logger } = require("./logger");

module.exports = (e, req, res, next) => {
  console.error(e);
  const { name, code } = e;
  let status = e.status;
  if (!status) {
    switch (name) {
      case "MongoServerError":
        switch (code) {
          // duplicate key error
          case 11000:
            status = 409;
            break;
          default:
        }
        break;
      case "TokenExpiredError":
        status = 419;
        break;
      case "JsonWebTokenError":
        status = 401;
        auth_logger("JsonWebTokenError", req.body.username, req);
        break;
      case "ValidationError":
        // mongo validation error
        status = 400;
      default:
    }
  }
  return res.sendStatus(status || 500);
};

/**
 * user 422 = already exists
 */

// exports.handleMongoError = (error) => {
//   const { name, code } = error;
//   switch (code) {
//     // duplicate key error
//     case 11000:
//       throw { status: 409 };
//     default:
//   }

//   switch (name) {
//     // validation error
//     case "ValidationError":
//       throw { status: 400 };
//     default:
//   }

//   throw error;
// };
