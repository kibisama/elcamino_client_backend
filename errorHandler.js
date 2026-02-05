module.exports = (error, req, res, next) => {
  console.error(error);
  const { name, code } = error;
  let status = error.status;
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
        break;
      case "ValidationError":
        // mongo validation error
        status = 400;
      default:
    }
  }
  return res.sendStatus(status || 500);
};
