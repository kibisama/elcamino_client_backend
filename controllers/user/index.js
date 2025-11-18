const passport = require("passport");

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (authError, user, info) => {
    if (authError) {
      return next(authError);
    }
    if (info) {
      return next(info);
    }
    if (!user.stationCodes?.length === 0) {
      return res.sendStatus(401);
    }
    next();
  })(req, res, next);
};
