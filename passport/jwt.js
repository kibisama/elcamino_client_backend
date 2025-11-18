const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

module.exports = () => {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
      },
      (jwt_payload, done) =>
        done(null, {
          id: jwt_payload.sub,
          stationCode: jwt_payload.stationCode,
        })
    )
  );
};
