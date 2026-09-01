const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const budgetService = require("../services/budget.service");

/**
 * @desc    Create a new expense and return updated budget limits/remaining balance
 * @route   POST /api/expenses
 */
const createExpense = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const { amount, category, description, date } = req.body;

    const expense = await Expense.create({
      user: userId,
      amount,
      category,
      description: description || "",
      date: date || new Date(),
    });

    // Calculate real-time budget status after this expense
    const budgetStatus = await budgetService.calculateBudgetStatus(userId, expense.date);

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
 * @desc    Get all expenses with filtering, sorting, and pagination
 * @route   GET /api/expenses
 */
const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
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

    const filter = {};

    // User scope
    if (userId) {
      filter.user = userId;
    }

    // Category filter
    if (category) {
      filter.category = { $regex: category, $options: "i" };
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
 * @desc    Get a single expense by ID
 * @route   GET /api/expenses/:id
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

    const expense = await Expense.findById(id);

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
 * @desc    Update an expense by ID and return updated budget status
 * @route   PUT /api/expenses/:id
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

    const expense = await Expense.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const userId = req.user ? req.user._id : null;
    const budgetStatus = await budgetService.calculateBudgetStatus(userId, expense.date);

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
 * @desc    Delete an expense by ID and return updated budget status
 * @route   DELETE /api/expenses/:id
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

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const userId = req.user ? req.user._id : null;
    const budgetStatus = await budgetService.calculateBudgetStatus(userId, expense.date);

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
