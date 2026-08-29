const Expense = require("../models/expense.model");

const createExpense = async (req, res) => {
  try {
    const { amount, category, description } = req.body;

    //check if all data is present or not
    if (!amount || !category) {
      return res.status(400).json({
        success: false,
        error: "Please provide all fields",
      });
    }
    //if present then move to storing the data
    const expense = await Expense.create({
      amount,
      category,
      description,
    });
    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getExpenses = async (req, res) => {
  try {
    // 1. Check if there is a category in the URL query string
    const { category,maxAmount  } = req.query;

    // 2. Create an empty filter object
    let filter = {};

    // 3. If a category exists, add it to the filter object
    if (category) {
      // Case-insensitive regex matching (e.g., 'food' matches 'Food')
      filter.category = { $regex: category, $options: "i" };
    }
    if (maxAmount) {
      // Convert the string parameter from the URL to a numeric integer
      filter.amount = { $lte: parseInt(maxAmount) };
    }

    // 4. Pass the filter object into .find()
    // If filter is empty {}, Mongoose automatically returns ALL expenses!
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: "Provide right id" });
  }
};
const updateExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after", //new: true, //returns modified document
      runValidators: true, //follows the schema rules
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
const deleteExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
};
