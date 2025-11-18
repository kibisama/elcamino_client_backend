const { createLogger, format, transports } = require("winston");

const _auth_logger = createLogger({
  level: "info",
  format: format.printf(
    ({ timestamp, caller, ref, req }) =>
      `{
  timestamp: ${timestamp},
  caller: ${caller},
  reference: ${ref},
  ip: ${req.ips.length > 0 ? JSON.stringify(req.ips) : req.ip},
  ua: ${JSON.stringify(req.ua)},
}`
  ),
  transports: [
    new transports.File({ filename: "auth_admin_audit.log", level: "info" }),
  ],
});
exports.auth_logger = (caller, ref, req) => {
  _auth_logger.log({
    level: "info",
    timestamp: new Date().toString(),
    caller,
    ref,
    req,
  });
};
