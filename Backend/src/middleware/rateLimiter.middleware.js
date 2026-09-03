/**
 * Lightweight in-memory rate limiter middleware for abuse-sensitive OTP routes.
 * Suitable for single-instance deployments without requiring Redis.
 */

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests. Please try again later." }) {
  const requests = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now - record.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref(); // .unref() ensures it won't keep the process alive in tests

  return (req, res, next) => {
    // In test environment, allow bypassing unless testing rate limiter specifically
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || "unknown_ip";
    const email = req.body?.email ? req.body.email.toLowerCase() : "";
    const key = `${ip}:${email}:${req.originalUrl || req.path}`;
    const now = Date.now();

    const record = requests.get(key);

    if (!record) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    if (now - record.startTime > windowMs) {
      // Window expired, reset
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
}

// Pre-configured rate limiters
const otpRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many OTP requests. Please wait 15 minutes before trying again.",
});

const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many verification attempts. Please wait before trying again.",
});

module.exports = {
  createRateLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
};
