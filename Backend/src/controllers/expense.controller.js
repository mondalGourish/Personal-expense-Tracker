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
    const expenses = await Expense.find();
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
module.exports = { createExpense, getExpenses,getExpenseById };
