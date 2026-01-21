const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const {
  refreshCache: refreshDeliveryCache,
} = require("../controllers/user/delivery");

router.use("/", (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    return res.sendStatus(401);
  }
});
router.get("/refresh_cache/delivery/:invoiceCode", refreshDeliveryCache);

module.exports = router;
