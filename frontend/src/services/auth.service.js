import { api } from "./api";

/**
 * Register a new user account.
 * Note: Registration initiates email verification.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
export async function register(name, email, password) {
  return api.post("/auth/register", { name, email, password });
}

/**
 * Verify user email using 6-digit OTP code.
 * @param {string} email
 * @param {string} otp
 */
export async function verifyEmail(email, otp) {
  return api.post("/auth/verify-email", { email, otp });
}

/**
 * Resend verification OTP code (with 60s cooldown).
 * @param {string} email
 */
export async function resendVerification(email) {
  return api.post("/auth/resend-verification", { email });
}

/**
 * Log in with email and password.
 * On success, the server sets an HTTP-only cookie automatically.
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  return api.post("/auth/login", { email, password });
}

/**
 * Request password reset code for an email (anti-enumeration protected).
 * @param {string} email
 */
export async function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

/**
 * Verify 6-digit password reset OTP and obtain short-lived resetToken.
 * @param {string} email
 * @param {string} otp
 */
export async function verifyResetOtp(email, otp) {
  return api.post("/auth/verify-reset-otp", { email, otp });
}

/**
 * Reset user password with verified resetToken and new strong password.
 * @param {string} email
 * @param {string} resetToken
 * @param {string} newPassword
 */
export async function resetPassword(email, resetToken, newPassword) {
  return api.post("/auth/reset-password", { email, resetToken, newPassword });
}

/**
 * Log out the currently authenticated user.
 * The server clears the HTTP-only cookie.
 */
export async function logout() {
  return api.post("/auth/logout");
}

/**
 * Fetch the currently authenticated user's profile.
 * - Returns user object if authenticated (200 OK)
 * - Returns null if explicitly unauthenticated (401 Unauthorized)
 * - Throws error for network errors (status 0) or server errors (500+) so caller can preserve error/retry state
 */
export async function getMe() {
  try {
    const data = await api.get("/auth/me");
    return data?.data?.user || null;
  } catch (err) {
    if (err.status === 401) {
      return null;
    }
    throw err;
  }
}
