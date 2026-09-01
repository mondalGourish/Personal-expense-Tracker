const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
} = require("../controllers/expense.controller");

const validate = require("../middleware/validate.middleware");
const {
  createExpenseSchema,
  updateExpenseSchema,
  queryExpenseSchema,
} = require("../../validators/expense.validator");

// Expense endpoints with validation
router.post("/", validate(createExpenseSchema, "body"), createExpense);
router.get("/", validate(queryExpenseSchema, "query"), getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", validate(updateExpenseSchema, "body"), updateExpenseById);
router.delete("/:id", deleteExpenseById);

module.exports = router;
