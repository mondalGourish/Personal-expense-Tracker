const mongoose = require("mongoose");
const Budget = require("../models/budget.model");
const Expense = require("../models/expense.model");

/**
 * Calculates start and end Date objects for the current ISO calendar week (Monday 00:00 to Sunday 23:59:59.999)
 */
function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

/**
 * Calculates start and end Date objects for the current calendar month (1st 00:00 to last day 23:59:59.999)
 */
function getMonthRange(date = new Date()) {
  const current = new Date(date);
  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

  return { startOfMonth, endOfMonth };
}

/**
 * Get or create budget for a user (or default null user)
 */
async function getBudget(userId = null) {
  const query = userId ? { user: userId } : { user: null };
  return await Budget.findOne(query);
}

/**
 * Create or update budget settings
 */
async function setBudget(userId = null, budgetData) {
  const query = userId ? { user: userId } : { user: null };
  const update = {
    ...budgetData,
    user: userId || null,
  };

  const budget = await Budget.findOneAndUpdate(query, update, {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  return budget;
}

/**
 * Computes real-time budget status:
 * - Weekly spent, limit, remaining, percentage, status
 * - Monthly spent, limit, remaining, percentage, status
 * - Category spending breakdown
 */
async function calculateBudgetStatus(userId = null, referenceDate = new Date()) {
  const budget = await getBudget(userId);

  const { startOfWeek, endOfWeek } = getWeekRange(referenceDate);
  const { startOfMonth, endOfMonth } = getMonthRange(referenceDate);

  const userMatch = userId
    ? { user: new mongoose.Types.ObjectId(userId) }
    : { $or: [{ user: null }, { user: { $exists: false } }] };

  // Aggregate weekly spending
  const weeklyAggregation = await Expense.aggregate([
    {
      $match: {
        ...userMatch,
        date: { $gte: startOfWeek, $lte: endOfWeek },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amount" },
        expenseCount: { $sum: 1 },
      },
    },
  ]);

  // Aggregate monthly spending
  const monthlyAggregation = await Expense.aggregate([
    {
      $match: {
        ...userMatch,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amount" },
        expenseCount: { $sum: 1 },
      },
    },
  ]);

  // Aggregate monthly category breakdown
  const categoryAggregation = await Expense.aggregate([
    {
      $match: {
        ...userMatch,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: "$category",
        spent: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { spent: -1 },
    },
  ]);

  const weeklySpent = weeklyAggregation.length > 0 ? weeklyAggregation[0].totalSpent : 0;
  const weeklyExpenseCount = weeklyAggregation.length > 0 ? weeklyAggregation[0].expenseCount : 0;

  const monthlySpent = monthlyAggregation.length > 0 ? monthlyAggregation[0].totalSpent : 0;
  const monthlyExpenseCount = monthlyAggregation.length > 0 ? monthlyAggregation[0].expenseCount : 0;

  const weeklyBudget = budget ? budget.weeklyBudget : null;
  const monthlyBudget = budget ? budget.monthlyBudget : null;
  const currency = budget ? budget.currency : "INR";
  const alertThreshold = budget ? budget.alertThreshold : 80;

  // Build weekly analytics
  const weekly = {
    budgetLimit: weeklyBudget,
    spent: weeklySpent,
    remaining: weeklyBudget !== null ? weeklyBudget - weeklySpent : null,
    percentageUsed:
      weeklyBudget && weeklyBudget > 0
        ? Number(((weeklySpent / weeklyBudget) * 100).toFixed(2))
        : 0,
    isExceeded: weeklyBudget !== null ? weeklySpent > weeklyBudget : false,
    isNearLimit:
      weeklyBudget !== null
        ? weeklySpent <= weeklyBudget && (weeklySpent / weeklyBudget) * 100 >= alertThreshold
        : false,
    status:
      weeklyBudget === null
        ? "NOT_CONFIGURED"
        : weeklySpent > weeklyBudget
        ? "EXCEEDED"
        : (weeklySpent / weeklyBudget) * 100 >= alertThreshold
        ? "WARNING"
        : "HEALTHY",
    expenseCount: weeklyExpenseCount,
    period: {
      from: startOfWeek.toISOString(),
      to: endOfWeek.toISOString(),
    },
  };

  // Build monthly analytics
  const monthly = {
    budgetLimit: monthlyBudget,
    spent: monthlySpent,
    remaining: monthlyBudget !== null ? monthlyBudget - monthlySpent : null,
    percentageUsed:
      monthlyBudget && monthlyBudget > 0
        ? Number(((monthlySpent / monthlyBudget) * 100).toFixed(2))
        : 0,
    isExceeded: monthlyBudget !== null ? monthlySpent > monthlyBudget : false,
    isNearLimit:
      monthlyBudget !== null
        ? monthlySpent <= monthlyBudget && (monthlySpent / monthlyBudget) * 100 >= alertThreshold
        : false,
    status:
      monthlyBudget === null
        ? "NOT_CONFIGURED"
        : monthlySpent > monthlyBudget
        ? "EXCEEDED"
        : (monthlySpent / monthlyBudget) * 100 >= alertThreshold
        ? "WARNING"
        : "HEALTHY",
    expenseCount: monthlyExpenseCount,
    period: {
      from: startOfMonth.toISOString(),
      to: endOfMonth.toISOString(),
    },
  };

  // Format category breakdown
  const categoryBudgetsMap = budget && budget.categoryBudgets ? Object.fromEntries(budget.categoryBudgets) : {};
  const categoryBreakdown = categoryAggregation.map((cat) => {
    const limit = categoryBudgetsMap[cat._id] || null;
    return {
      category: cat._id,
      spent: cat.spent,
      count: cat.count,
      limit,
      remaining: limit !== null ? limit - cat.spent : null,
      percentageUsed: limit ? Number(((cat.spent / limit) * 100).toFixed(2)) : null,
    };
  });

  return {
    isBudgetSet: Boolean(budget),
    currency,
    alertThreshold,
    weekly,
    monthly,
    categoryBreakdown,
  };
}

module.exports = {
  getWeekRange,
  getMonthRange,
  getBudget,
  setBudget,
  calculateBudgetStatus,
};
