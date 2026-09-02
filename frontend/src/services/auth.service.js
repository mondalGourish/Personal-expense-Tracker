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
 * Returns null if not authenticated (instead of throwing).
 */
export async function getMe() {
  try {
    const data = await api.get("/auth/me");
    return data?.data?.user || null;
  } catch (err) {
    // 401 or any network/CORS error means no active session — return null gracefully
    return null;
  }
}
