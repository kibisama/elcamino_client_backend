const express = require("express");
const router = express.Router();

const { login, refresh_token } = require("../controllers/auth");

router.get("/", refresh_token);
router.post("/login", login);

module.exports = router;
