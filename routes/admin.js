const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  createUser,
  resetPassword,
  deleteUser,
  getAllUsers,
} = require("../controllers/admin/user");

router.use("/", (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_ADMIN_TOKEN_SECRET);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    return res.sendStatus(401);
  }
});

router.post("/user", createUser);
router.put("/user", resetPassword);
router.delete("/user", deleteUser);
router.get("/users", getAllUsers);

module.exports = router;
