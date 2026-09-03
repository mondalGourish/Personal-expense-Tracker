/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error Handler caught:", err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }

  // Mongoose Duplicate Key Error → 409 Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    if (field === "user") {
      return res.status(409).json({
        success: false,
        error: "A budget configuration already exists for this user",
      });
    }
    return res.status(409).json({
      success: false,
      error: `An account with this ${field} already exists`,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(", "),
    });
  }

  // JWT — invalid signature or malformed token
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication token. Please log in again.",
    });
  }

  // JWT — token has expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Your session has expired. Please log in again.",
    });
  }

  // Fallback 500 Internal Server Error
  // Never expose stack traces to clients
  res.status(err.statusCode || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
