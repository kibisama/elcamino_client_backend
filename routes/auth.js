const express = require("express");
const router = express.Router();

const { login, refreshToken } = require("../controllers/auth");

router.get("/", refreshToken);
router.post("/login", login);

module.exports = router;
