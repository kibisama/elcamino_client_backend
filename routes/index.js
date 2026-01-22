const express = require("express");
const router = express.Router();
const admin = require("./admin");
const auth = require("./auth");
const user = require("./user");
const { decryptKey, decryptData } = require("../services/crypto");

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
router.use("/admin", admin);
router.use("/auth", auth);
router.use("/user", user);

module.exports = router;
