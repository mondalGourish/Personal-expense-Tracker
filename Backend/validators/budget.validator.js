const Joi = require("joi");
const { ALLOWED_CATEGORIES } = require("./expense.validator");

// Schema for setting or updating budget limits
const setBudgetSchema = Joi.object({
  weeklyBudget: Joi.number().min(0).required().messages({
    "number.base": "Weekly budget must be a number",
    "number.min": "Weekly budget cannot be negative",
    "any.required": "Weekly budget is a required field",
  }),

  monthlyBudget: Joi.number().min(0).required().messages({
    "number.base": "Monthly budget must be a number",
    "number.min": "Monthly budget cannot be negative",
    "any.required": "Monthly budget is a required field",
  }),

  currency: Joi.string()
    .trim()
    .uppercase()
    .length(3)
    .default("INR")
    .messages({
      "string.length": "Currency must be a 3-letter ISO code (e.g. INR, USD, EUR)",
    }),

  alertThreshold: Joi.number().min(1).max(100).default(80).messages({
    "number.base": "Alert threshold must be a percentage number",
    "number.min": "Alert threshold must be at least 1%",
    "number.max": "Alert threshold cannot exceed 100%",
  }),

  categoryBudgets: Joi.object()
    .pattern(
      Joi.string().valid(...ALLOWED_CATEGORIES),
      Joi.number().min(0)
    )
    .optional()
    .messages({
      "object.pattern.match": `Category budget keys must be valid categories: ${ALLOWED_CATEGORIES.join(", ")}`,
    }),
}).custom((value, helpers) => {
  if (
    typeof value.weeklyBudget === "number" &&
    typeof value.monthlyBudget === "number" &&
    value.weeklyBudget > value.monthlyBudget
  ) {
    return helpers.message("Weekly budget cannot be greater than monthly budget");
  }
  return value;
});

const updateBudgetSchema = Joi.object({
  weeklyBudget: Joi.number().min(0).optional().messages({
    "number.base": "Weekly budget must be a number",
    "number.min": "Weekly budget cannot be negative",
  }),

  monthlyBudget: Joi.number().min(0).optional().messages({
    "number.base": "Monthly budget must be a number",
    "number.min": "Monthly budget cannot be negative",
  }),

  currency: Joi.string().trim().uppercase().length(3).optional(),
  alertThreshold: Joi.number().min(1).max(100).optional(),
  categoryBudgets: Joi.object()
    .pattern(
      Joi.string().valid(...ALLOWED_CATEGORIES),
      Joi.number().min(0)
    )
    .optional(),
}).min(1).custom((value, helpers) => {
  if (
    typeof value.weeklyBudget === "number" &&
    typeof value.monthlyBudget === "number" &&
    value.weeklyBudget > value.monthlyBudget
  ) {
    return helpers.message("Weekly budget cannot be greater than monthly budget");
  }
  return value;
}).messages({
  "object.min": "Please provide at least one budget field to update",
});

// Schema for budget status query (validating optional date)
const queryBudgetStatusSchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    "date.base": "Date must be a valid date",
    "date.format": "Date must follow ISO format (YYYY-MM-DD)",
  }),
});

module.exports = {
  setBudgetSchema,
  updateBudgetSchema,
  queryBudgetStatusSchema,
};
