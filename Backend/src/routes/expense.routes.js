const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getExpenseById,
} = require("../controllers/expense.controller");

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);

module.exports = router;
