const express = require("express");
const router = express.Router();
const passport = require("passport");

const { get } = require("../controllers/user/user");

router.use("/:_id", (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (authError, user, info) => {
    if (authError) {
      return next(authError);
    }
    if (info) {
      if (info.message === "No auth token") {
        return next({ status: 401 });
      }
      return next(info);
    }
    if (!(user._id && user._id === req.params._id)) {
      return res.sendStatus(401);
    }
    next();
  })(req, res, next);
});
router.get("/:_id", get);

module.exports = router;
