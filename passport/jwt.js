const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

module.exports = () => {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
      },
      ({ sub: _id, stationCodes }, done) =>
        done(null, {
          _id,
          stationCodes,
        })
    )
  );
};
