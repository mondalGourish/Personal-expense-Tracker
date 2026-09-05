const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const emailService = require("../services/email.service");

/**
 * Cookie options helper.
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    partitioned: isProduction,
  };
};

/**
 * Issue JWT token cookie.
 */
const issueTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("token", token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

/**
 * Cryptographically secure 6-digit OTP generator.
 * Allows leading zeros (e.g. 012483).
 */
const generate6DigitOtp = () => {
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(6, "0");
};

/**
 * SHA-256 hash helper for OTPs and tokens.
 */
const hashValue = (val) => {
  return crypto.createHash("sha256").update(String(val)).digest("hex");
};

/**
 * Generate cryptographically random token string.
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * @desc    Register a new user account (unverified by default)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          error: "An account with this email address already exists. Please log in.",
        });
      }

      // If user exists but is unverified, refresh credentials and issue new OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generate6DigitOtp();
      const otpHash = hashValue(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otpHash = otpHash;
      existingUser.otpExpiresAt = otpExpiresAt;
      existingUser.otpPurpose = "EMAIL_VERIFICATION";
      existingUser.otpAttempts = 0;
      existingUser.otpLastSentAt = new Date();
      await existingUser.save();

      // Dispatch verification email safely
      try {
        await emailService.sendVerificationEmail(normalizedEmail, otp);
      } catch (emailErr) {
        console.error("⚠️ Failed to dispatch verification email:", emailErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Verification code sent. Please check your email to verify your account.",
        data: {
          email: existingUser.email,
          isEmailVerified: false,
        },
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP for email verification
    const otp = generate6DigitOtp();
    const otpHash = hashValue(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      otpHash,
      otpExpiresAt,
      otpPurpose: "EMAIL_VERIFICATION",
      otpAttempts: 0,
      otpLastSentAt: new Date(),
    });

    // Send verification email safely without blocking on failure
    try {
      await emailService.sendVerificationEmail(normalizedEmail, otp);
    } catch (emailErr) {
      console.error("⚠️ Failed to dispatch verification email on register:", emailErr.message);
    }

    // Note: Do NOT issue JWT auth cookie until email is verified
    res.status(201).json({
      success: true,
      message: "Account created. Please check your email for the 6-digit verification code.",
      data: {
        email: user.email,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify user email with 6-digit OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otpHash +otpExpiresAt +otpPurpose +otpAttempts"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account not found.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified. You can sign in.",
      });
    }

    if (user.otpPurpose !== "EMAIL_VERIFICATION" || !user.otpHash) {
      return res.status(400).json({
        success: false,
        error: "No active verification code found. Please request a new code.",
      });
    }

    // Attempt rate limiting (max 5 failed attempts)
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        error: "Too many failed attempts. Please request a new verification code.",
      });
    }

    // Expiry check
    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired. Please request a new OTP.",
      });
    }

    // Hash check
    const inputHash = hashValue(otp);
    if (inputHash !== user.otpHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        error: "Invalid verification code. Please check and try again.",
      });
    }

    // Mark as verified & invalidate OTP
    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
    user.otpLastSentAt = undefined;
    await user.save();

    // Automatically establish authenticated session cookie
    const token = issueTokenCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Redirecting to dashboard...",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification OTP with 60-second cooldown
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+otpLastSentAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account not found.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "This account is already verified. Please sign in.",
      });
    }

    // 60-second cooldown enforcement
    if (user.otpLastSentAt) {
      const elapsed = Date.now() - user.otpLastSentAt.getTime();
      const cooldownMs = 60 * 1000;
      if (elapsed < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} seconds before requesting a new code.`,
          retryAfter: remainingSec,
        });
      }
    }

    // Generate new OTP & invalidate previous
    const otp = generate6DigitOtp();
    user.otpHash = hashValue(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = "EMAIL_VERIFICATION";
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    // Send email
    try {
      await emailService.sendVerificationEmail(normalizedEmail, otp);
    } catch (emailErr) {
      console.error("⚠️ Failed to send verification email:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user — verified accounts receive JWT session
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly select password and isEmailVerified
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check email verification status
    // Existing users where isEmailVerified is undefined/null default gracefully, but explicit false is blocked
    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        error: "Please verify your email before logging in.",
      });
    }

    // Issue JWT cookie
    const token = issueTokenCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset OTP (anti-enumeration protected)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const genericMessage =
      "If an account exists for this email, a password reset code has been sent.";

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otpLastSentAt +otpPurpose"
    );

    if (!user) {
      // Return generic message without revealing that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // 60-second cooldown check to avoid flooding for repeated reset requests
    if (user.otpPurpose === "PASSWORD_RESET" && user.otpLastSentAt) {
      const elapsed = Date.now() - user.otpLastSentAt.getTime();
      if (elapsed < 60 * 1000) {
        // Return generic success to avoid leaking timing details
        return res.status(200).json({
          success: true,
          message: genericMessage,
        });
      }
    }

    // Generate 6-digit OTP for password reset
    const otp = generate6DigitOtp();
    user.otpHash = hashValue(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpPurpose = "PASSWORD_RESET";
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(normalizedEmail, otp);
    } catch (emailErr) {
      console.error("⚠️ Failed to send password reset email:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify password reset OTP and issue short-lived reset authorization token
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otpHash +otpExpiresAt +otpPurpose +otpAttempts"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset code.",
      });
    }

    if (user.otpPurpose !== "PASSWORD_RESET" || !user.otpHash) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset code.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        error: "Too many failed attempts. Please request a new reset code.",
      });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify hash
    const inputHash = hashValue(otp);
    if (inputHash !== user.otpHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        error: "Invalid verification code.",
      });
    }

    // Invalidate OTP and issue single-purpose resetToken (15 minutes)
    const resetToken = generateRandomToken();
    user.resetTokenHash = hashValue(resetToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully.",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using verified resetToken
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+resetTokenHash +resetTokenExpiresAt +password"
    );

    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset authorization. Please request a new code.",
      });
    }

    if (new Date() > user.resetTokenExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "Reset authorization has expired. Please request a new code.",
      });
    }

    const tokenHash = hashValue(resetToken);
    if (tokenHash !== user.resetTokenHash) {
      return res.status(400).json({
        success: false,
        error: "Invalid reset authorization.",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    // Invalidate reset token (single-use)
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    // Password reset via verified email also marks email as verified
    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout — clear auth cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = (req, res) => {
  res.cookie("token", "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
      },
    },
  });
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  logout,
  getMe,
  // Export helpers for testing
  generate6DigitOtp,
  hashValue,
};
