/**
 * Base API configuration and request helper.
 * Uses native fetch — no extra libraries needed.
 * All requests include credentials (cookies) automatically.
 */

const BASE_URL = "http://localhost:4000/api";

/**
 * Core fetch wrapper.
 * Throws an error with the server's error message on non-2xx responses.
 */
async function request(method, path, body = undefined) {
  const options = {
    method,
    credentials: "include", // Send HTTP-only cookies with every request
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

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
