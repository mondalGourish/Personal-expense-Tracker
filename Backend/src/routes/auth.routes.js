const express = require("express");
const router = express.Router();

const { register, login, logout, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../../validators/auth.validator");

// Public routes
router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);
router.post("/logout", logout);

// Protected route — requires valid session
router.get("/me", authenticate, getMe);

module.exports = router;
