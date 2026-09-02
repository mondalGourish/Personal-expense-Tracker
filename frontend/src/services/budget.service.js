import { api } from "./api";

/**
 * Fetch the authenticated user's budget configuration.
 * Returns null data if no budget has been set yet.
 */
export async function getBudget() {
  return api.get("/budgets");
}

/**
 * Create or update budget limits for the authenticated user.
 * @param {{ weeklyBudget: number, monthlyBudget: number, currency?: string, alertThreshold?: number, categoryBudgets?: Object }} data
 */
export async function setBudget(data) {
  return api.post("/budgets", data);
}

/**
 * Get real-time budget status (spent vs. limits) for the authenticated user.
 * @param {string} [date] - Optional ISO reference date
 */
export async function getBudgetStatus(date) {
  const query = date ? `?date=${date}` : "";
  return api.get(`/budgets/status${query}`);
}
