const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const budgetService = require("../services/budget.service");

/**
 * Safely attempt to calculate budget status after a mutation.
 * If budget calculation fails, the primary expense operation is unaffected.
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
 * @desc    Create a new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = async (req, res, next) => {
  try {
    const { amount, category, description, date } = req.body;

    const expense = await Expense.create({
      user: req.user._id, // Always from authenticated session — never from body
      amount,
      category,
      description: description || "",
      date: date || new Date(),
    });

    // Secondary: get updated budget status (failure does not affect this response)
    const budgetStatus = await tryGetBudgetStatus(req.user._id, expense.date);

    res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: {
        expense,
        budgetStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expenses for the authenticated user
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const {
      category,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Always scope to authenticated user
    const filter = { user: req.user._id };

    // Category filter — exact match (validated against ALLOWED_CATEGORIES)
    if (category) {
      filter.category = category;
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount !== undefined) filter.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined) filter.amount.$lte = Number(maxAmount);
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // sortBy is already validated by Joi to be one of: date, amount, category, createdAt
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sort).skip(skip).limit(limitNum),
      Expense.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single expense by ID (must belong to authenticated user)
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID format",
      });
    }

    // Ownership-aware query — returns 404 whether not found OR belongs to another user
    const expense = await Expense.findOne({ _id: id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Partially update an expense by ID (must belong to authenticated user)
 * @route   PATCH /api/expenses/:id
 * @access  Private
 */
const updateExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID format",
      });
    }

    // Allowlist: only these fields can be updated — user, _id, createdAt cannot be changed
    const { amount, category, description, date } = req.body;
    const updateFields = {};
    if (amount !== undefined) updateFields.amount = amount;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (date !== undefined) updateFields.date = date;

    // Ownership-aware update — only updates if the expense belongs to the authenticated user
    const expense = await Expense.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateFields,
      { returnDocument: "after", runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    // Secondary: budget status (non-critical)
    const budgetStatus = await tryGetBudgetStatus(req.user._id, expense.date);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: {
        expense,
        budgetStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an expense by ID (must belong to authenticated user)
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID format",
      });
    }

    // Ownership-aware delete
    const expense = await Expense.findOneAndDelete({ _id: id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    // Secondary: budget status (non-critical)
    const budgetStatus = await tryGetBudgetStatus(req.user._id, expense.date);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: {
        deletedId: id,
        budgetStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
};
