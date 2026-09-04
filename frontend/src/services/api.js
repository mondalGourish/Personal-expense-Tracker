/**
 * Base API configuration and request helper.
 * Uses native fetch — no extra libraries needed.
 * Configured via Vite environment variable with a development fallback.
 * All requests include credentials (cookies) automatically.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Core fetch wrapper.
 * Throws an error with the server's error message on non-2xx responses.
 * Attaches network error flags if the server is unreachable.
 */
async function request(method, path, body = undefined) {
  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    credentials: "include", // Send HTTP-only cookies with every request
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (networkErr) {
    const err = new Error("Unable to connect to the server. Please check your network connection.");
    err.isNetworkError = true;
    err.status = 0;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    data = { error: "Failed to parse server response" };
  }

  if (!response.ok) {
    const error = new Error(data.error || "An unexpected error occurred");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
