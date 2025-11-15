const passport = require("passport");

exports.auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (authError, auth, info) => {
    if (authError) {
      //
      return next(authError);
    }
    if (!auth) {
      //
    }
    next();
  })(req, res, next);
};
