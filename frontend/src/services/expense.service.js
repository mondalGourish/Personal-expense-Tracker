import { api } from "./api";

/**
 * Fetch expenses with optional filtering, sorting and pagination.
 * @param {Object} params - Query parameters
 * @param {string} [params.category]
 * @param {number} [params.minAmount]
 * @param {number} [params.maxAmount]
 * @param {string} [params.startDate] - ISO date string
 * @param {string} [params.endDate] - ISO date string
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {string} [params.sortBy]
 * @param {string} [params.sortOrder]
 */
export async function getExpenses(params = {}) {
  // Build query string from non-empty params
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return api.get(`/expenses${queryString ? `?${queryString}` : ""}`);
}

/**
 * Create a new expense.
 * @param {{ amount: number, category: string, description?: string, date?: string }} data
 */
export async function createExpense(data) {
  return api.post("/expenses", data);
}

/**
 * Partially update an expense by ID.
 * @param {string} id - MongoDB ObjectId
 * @param {{ amount?: number, category?: string, description?: string, date?: string }} data
 */
export async function updateExpense(id, data) {
  return api.patch(`/expenses/${id}`, data);
}

/**
 * Delete an expense by ID.
 * @param {string} id - MongoDB ObjectId
 */
export async function deleteExpense(id) {
  return api.delete(`/expenses/${id}`);
}
