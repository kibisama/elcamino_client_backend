const express = require("express");
const router = express.Router();
const auth = require("./auth");
const user = require("./user");
const api = require("./api");

router.use("/auth", auth);
router.use("/user", user);
router.use("/api", api);

module.exports = router;
