const express = require("express");
const router = express.Router();
const passport = require("passport");
const { getUserInfo } = require("../controllers/user/user");

router.use("/", (req, res, next) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (authError, { _id, stationCodes }, info) => {
      if (authError) {
        return next(authError);
      }
      if (info) {
        return next(info);
      }
      if (!_id) {
        return next({ status: 401 });
      }
      req.user = { _id, stationCodes };
      next();
    }
  )(req, res, next);
});
router.get("/info", getUserInfo);

module.exports = router;
