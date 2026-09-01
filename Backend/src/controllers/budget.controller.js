const budgetService = require("../services/budget.service");

/**
 * @desc    Set or update weekly and monthly budget limits
 * @route   POST /api/budgets
 */
const setBudget = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const { weeklyBudget, monthlyBudget, currency, alertThreshold, categoryBudgets } = req.body;

    const budget = await budgetService.setBudget(userId, {
      weeklyBudget,
      monthlyBudget,
      currency: currency || "INR",
      alertThreshold: alertThreshold !== undefined ? alertThreshold : 80,
      categoryBudgets: categoryBudgets || {},
    });

    const currentStatus = await budgetService.calculateBudgetStatus(userId);

    res.status(200).json({
      success: true,
      message: "Budget limits updated successfully",
      data: {
        budget,
        status: currentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently configured budget limits
 * @route   GET /api/budgets
 */
const getBudget = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const budget = await budgetService.getBudget(userId);

    if (!budget) {
      return res.status(200).json({
        success: true,
        message: "No budget limits set yet. Use POST /api/budgets to set your limits.",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time budget status (spent vs remaining limits for week & month)
 * @route   GET /api/budgets/status
 */
const getBudgetStatus = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const referenceDate = req.query.date ? new Date(req.query.date) : new Date();

    const status = await budgetService.calculateBudgetStatus(userId, referenceDate);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setBudget,
  getBudget,
  getBudgetStatus,
};
