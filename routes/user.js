const express = require("express");
const router = express.Router();
const passport = require("passport");

const { getUser } = require("../controllers/user/user");
const { getDeliveries } = require("../controllers/user/delivery");

router.use("/", (req, res, next) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (authError, { _id, stationCodes }, info) => {
      if (authError) {
        return next(authError);
      }
      if (info) {
        if (info.message === "No auth token") {
          return next({ status: 401 });
        }
        return next(info);
      }
      req.user = { _id, stationCodes };
      next();
    }
  )(req, res, next);
});
router.get("/info", getUser);
router.get("/deliveries/:invoiceCode/:date", getDeliveries);

module.exports = router;
