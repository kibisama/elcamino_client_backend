const express = require("express");
const router = express.Router();

const { login, refreshToken, logout } = require("../controllers/auth");

router.post("/", refreshToken);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;
