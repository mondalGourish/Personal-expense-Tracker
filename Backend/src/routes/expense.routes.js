const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
} = require("../controllers/expense.controller");

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id",updateExpenseById)
router.delete("/:id",deleteExpenseById)


module.exports = router;
