const express = require("express");
const passport = require("passport");
const router = express.Router();
const admin = require("./admin");
const auth = require("./auth");
const user = require("./user");
const delivery = require("./delivery");
const { decryptKey, decryptData } = require("../services/crypto");

router.use("/admin", admin);

router.use("/", async (req, res, next) => {
  if (req.method === "POST") {
    const { key, iv, data } = req.body;
    if (!(key && iv && data)) {
      return res.sendStatus(403);
    }
    try {
      const decryptedKey = decryptKey(key);
      req.data = await decryptData(data, decryptedKey, iv);
    } catch (error) {
      next(error);
    }
  }
  next();
});
router.use("/auth", auth);

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
router.use("/user", user);
router.use("/delivery", delivery);

module.exports = router;
