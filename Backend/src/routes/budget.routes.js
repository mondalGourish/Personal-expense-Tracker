const express = require("express");
const router = express.Router();

const {
  setBudget,
  getBudget,
  getBudgetStatus,
} = require("../controllers/budget.controller");

const validate = require("../middleware/validate.middleware");
const { setBudgetSchema } = require("../../validators/budget.validator");

// Budget endpoints
router.post("/", validate(setBudgetSchema), setBudget);
router.get("/", getBudget);
router.get("/status", getBudgetStatus);

module.exports = router;
