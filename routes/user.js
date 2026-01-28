const express = require("express");
const router = express.Router();
const { getUserInfo } = require("../controllers/user");

router.get("/info", getUserInfo);

module.exports = router;
