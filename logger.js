const { createLogger, format, transports } = require("winston");

const _authLogger = createLogger({
  level: "info",
  format: format.printf(
    ({ timestamp, caller, ref, req }) =>
      `{
  timestamp: ${timestamp},
  caller: ${caller},
  reference: ${ref},
  ip: ${
    req.headers["x-forwarded-for"]
      ? JSON.stringify(req.headers["x-forwarded-for"])
      : req.ips.length > 0
      ? JSON.stringify(req.ips)
      : req.ip
  },
  ua: ${JSON.stringify(req.ua)},
}`
  ),
  transports: [
    new transports.File({ filename: "auth_audit.log", level: "info" }),
  ],
});
exports.authLogger = (caller, ref, req) => {
  _authLogger.log({
    level: "info",
    timestamp: new Date().toString(),
    caller,
    ref,
    req,
  });
};
