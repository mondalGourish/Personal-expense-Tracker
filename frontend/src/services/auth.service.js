import { api } from "./api";

/**
 * Register a new user account.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
export async function register(name, email, password) {
  return api.post("/auth/register", { name, email, password });
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
    // 401 means no active session cookie exists — return null cleanly
    if (err.status === 401) {
      return null;
    }
    // Network / 500 / CORS error: rethrow so session check distinguishes connection failure from logout
    throw err;
  }
}
