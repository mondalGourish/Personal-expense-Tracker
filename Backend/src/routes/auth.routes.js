const express = require("express");
const router = express.Router();

const {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { otpRequestLimiter, otpVerifyLimiter } = require("../middleware/rateLimiter.middleware");

const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} = require("../../validators/auth.validator");

// Public authentication routes
router.post("/register", validate(registerSchema, "body"), register);
router.post("/verify-email", otpVerifyLimiter, validate(verifyEmailSchema, "body"), verifyEmail);
router.post("/resend-verification", otpRequestLimiter, validate(resendVerificationSchema, "body"), resendVerification);
router.post("/login", validate(loginSchema, "body"), login);
router.post("/forgot-password", otpRequestLimiter, validate(forgotPasswordSchema, "body"), forgotPassword);
router.post("/verify-reset-otp", otpVerifyLimiter, validate(verifyResetOtpSchema, "body"), verifyResetOtp);
router.post("/reset-password", validate(resetPasswordSchema, "body"), resetPassword);
router.post("/logout", logout);

// Protected session route
router.get("/me", authenticate, getMe);

module.exports = router;
