const budgetService = require("../services/budget.service");

/**
 * Safely attempt to calculate budget status after budget mutation.
 * If status calculation fails, the primary budget operation is unaffected.
 */
async function tryGetBudgetStatus(userId, referenceDate) {
  try {
    return await budgetService.calculateBudgetStatus(userId, referenceDate);
  } catch (err) {
    console.error("⚠️  Budget status calculation failed (non-critical):", err.message);
    return null;
  }
}

/**
 * @desc    Set or update weekly and monthly budget limits
 * @route   POST /api/budgets
 * @access  Private
 */
const setBudget = async (req, res, next) => {
  try {
    const { weeklyBudget, monthlyBudget, currency, alertThreshold, categoryBudgets } = req.body;

    const budget = await budgetService.setBudget(req.user._id, {
      weeklyBudget,
      monthlyBudget,
      currency: currency || "INR",
      alertThreshold: alertThreshold !== undefined ? alertThreshold : 80,
      categoryBudgets: categoryBudgets || {},
    });

    // Secondary: calculate real-time status (failure does not break the mutation response)
    const currentStatus = await tryGetBudgetStatus(req.user._id);

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
 * @desc    Get currently configured budget limits for the authenticated user
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.getBudget(req.user._id);

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
 * @desc    Get real-time budget status for the authenticated user
 * @route   GET /api/budgets/status
 * @access  Private
 */
const getBudgetStatus = async (req, res, next) => {
  try {
    const referenceDate = req.query.date ? new Date(req.query.date) : new Date();
    const status = await budgetService.calculateBudgetStatus(req.user._id, referenceDate);

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
