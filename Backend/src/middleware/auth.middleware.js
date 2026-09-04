const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Authentication Middleware
 * Reads JWT from HTTP-only cookie, verifies it, attaches user to req.user.
 * Returns 401 if token is missing, invalid, expired, or user not found.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Check HTTP-only cookie
    let token = req.cookies?.token;
    console.log(token)
    // 2. Fallback to Authorization: Bearer <token> header for cross-domain clients
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please log in.",
      });
    }

    // Verify the token — throws JsonWebTokenError or TokenExpiredError on failure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user (password excluded by default via select: false on schema)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "The account associated with this session no longer exists.",
      });
    }

    // Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // Let the centralized error handler deal with JWT-specific errors
    next(error);
  }
};

module.exports = { authenticate };
