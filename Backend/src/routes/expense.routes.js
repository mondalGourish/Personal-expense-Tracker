const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
} = require("../controllers/expense.controller");

const { authenticate } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createExpenseSchema,
  updateExpenseSchema,
  queryExpenseSchema,
} = require("../../validators/expense.validator");

// All expense endpoints require authentication
router.use(authenticate);

// Expense endpoints with validation
router.post("/", validate(createExpenseSchema, "body"), createExpense);
router.get("/", validate(queryExpenseSchema, "query"), getExpenses);
router.get("/:id", getExpenseById);
router.patch("/:id", validate(updateExpenseSchema, "body"), updateExpenseById); // Changed from PUT to PATCH
router.delete("/:id", deleteExpenseById);

module.exports = router;
