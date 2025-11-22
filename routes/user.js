const express = require("express");
const router = express.Router();
const passport = require("passport");

const { get } = require("../controllers/user/user");

router.use("/", (req, res, next) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (authError, { _id, stationCode }, info) => {
      if (authError) {
        return next(authError);
      }
      if (info) {
        if (info.message === "No auth token") {
          return next({ status: 401 });
        }
        return next(info);
      }
      req.user = { _id, stationCode };
      next();
    }
  )(req, res, next);
});
router.get("/info", get);

module.exports = router;
