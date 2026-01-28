const express = require("express");
const router = express.Router();
const { getDeliveries } = require("../controllers/delivery");

router.get("/:stationCode/:date", getDeliveries);

module.exports = router;
