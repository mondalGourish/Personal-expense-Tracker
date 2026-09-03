/**
 * Budget Health & Spending Limit Calculator
 * Single source of truth for budget status across Dashboard, BudgetProgress, AddExpense, and Reports.
 */

import { formatCurrency } from "../data/mockExpenses.js";

/**
 * Calculates unified budget health metrics using raw mathematical percentages for decisions.
 * 
 * @param {Object} params
 * @param {number|null|undefined} params.budgetLimit - Configured spending limit
 * @param {number} params.spent - Actual spending in period
 * @param {number} [params.alertThreshold=80] - Warning percentage threshold (e.g. 80)
 * @param {string} [params.currencySymbol="₹"] - Currency symbol for formatting
 * @returns {Object} Standardized budget health state
 */
export function calculateBudgetHealth({
  budgetLimit,
  spent = 0,
  alertThreshold = 80,
  currencySymbol = "₹",
}) {
  const numericSpent = isNaN(spent) || spent === null ? 0 : Number(spent);
  const threshold = isNaN(alertThreshold) || alertThreshold === null ? 80 : Number(alertThreshold);

  // 1. Not Configured State
  if (budgetLimit === null || budgetLimit === undefined || isNaN(budgetLimit)) {
    return {
      isConfigured: false,
      budgetLimit: null,
      spent: numericSpent,
      remaining: null,
      overAmount: 0,
      percentageUsed: 0,
      visualPercent: 0,
      status: "NOT_CONFIGURED",
      statusMessage: "No budget limit configured",
      alertLabel: "Not Set",
      isExceeded: false,
      isWarning: false,
      isSafe: false,
    };
  }

  const numericLimit = Number(budgetLimit);

  // 2. Zero Budget Limit (limit = 0)
  if (numericLimit === 0) {
    if (numericSpent > 0) {
      return {
        isConfigured: true,
        budgetLimit: 0,
        spent: numericSpent,
        remaining: -numericSpent,
        overAmount: numericSpent,
        percentageUsed: 100,
        visualPercent: 100,
        status: "EXCEEDED",
        statusMessage: `${formatCurrency(numericSpent, currencySymbol)} over budget`,
        alertLabel: "Budget limit exceeded",
        isExceeded: true,
        isWarning: false,
        isSafe: false,
      };
    }

    // Zero limit with zero spent
    return {
      isConfigured: true,
      budgetLimit: 0,
      spent: 0,
      remaining: 0,
      overAmount: 0,
      percentageUsed: 0,
      visualPercent: 0,
      status: "SAFE",
      statusMessage: `${formatCurrency(0, currencySymbol)} remaining`,
      alertLabel: "Zero limit (0 spent)",
      isExceeded: false,
      isWarning: false,
      isSafe: true,
    };
  }

  // 3. Standard Positive Budget Limit (limit > 0)
  const remaining = numericLimit - numericSpent;
  const rawPercentage = (numericSpent / numericLimit) * 100;
  const percentageUsed = Math.round(rawPercentage); // Used ONLY for display
  const visualPercent = Math.min(100, Math.max(0, rawPercentage));

  // EXCEEDED (>100%): numericSpent > numericLimit
  if (numericSpent > numericLimit) {
    const overAmount = numericSpent - numericLimit;
    return {
      isConfigured: true,
      budgetLimit: numericLimit,
      spent: numericSpent,
      remaining, // negative internally
      overAmount,
      percentageUsed, // e.g. 173%
      visualPercent: 100,
      status: "EXCEEDED",
      statusMessage: `${formatCurrency(overAmount, currencySymbol)} over budget`,
      alertLabel: "Budget limit exceeded",
      isExceeded: true,
      isWarning: false,
      isSafe: false,
    };
  }

  // EXACT LIMIT REACHED (exactly 100%): numericSpent === numericLimit
  if (numericSpent === numericLimit) {
    return {
      isConfigured: true,
      budgetLimit: numericLimit,
      spent: numericSpent,
      remaining: 0,
      overAmount: 0,
      percentageUsed: 100,
      visualPercent: 100,
      status: "EXCEEDED",
      statusMessage: "Budget limit reached",
      alertLabel: "Budget limit reached",
      isExceeded: true,
      isWarning: false,
      isSafe: false,
    };
  }

  // WARNING: rawPercentage >= threshold && rawPercentage < 100
  if (rawPercentage >= threshold) {
    return {
      isConfigured: true,
      budgetLimit: numericLimit,
      spent: numericSpent,
      remaining,
      overAmount: 0,
      percentageUsed,
      visualPercent,
      status: "WARNING",
      statusMessage: `${formatCurrency(remaining, currencySymbol)} remaining`,
      alertLabel: `Approaching limit (${percentageUsed}% used)`,
      isExceeded: false,
      isWarning: true,
      isSafe: false,
    };
  }

  // SAFE: rawPercentage < threshold
  return {
    isConfigured: true,
    budgetLimit: numericLimit,
    spent: numericSpent,
    remaining,
    overAmount: 0,
    percentageUsed,
    visualPercent,
    status: "SAFE",
    statusMessage: `${formatCurrency(remaining, currencySymbol)} remaining`,
    alertLabel: "On track",
    isExceeded: false,
    isWarning: false,
    isSafe: true,
  };
}
