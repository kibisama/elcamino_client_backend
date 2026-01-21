const express = require("express");
const router = express.Router();
const auth = require("./auth");
// const user = require("./user");
const { decryptKey, decryptData } = require("../services/crypto");

router.post("/", async (req, res, next) => {
  const { key, iv, data } = req.body;
  if (!(key && iv && data)) {
    return res.sendStatus(403);
  }
  try {
    const decryptedKey = decryptKey(key);
    req.data = await decryptData(data, decryptedKey, iv);
    next();
  } catch (error) {
    next(error);
  }
});
router.use("/auth", auth);

// router.use("/user", user);

module.exports = router;
