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
}).min(1).messages({
  "object.min": "Please provide at least one budget field to update",
});

module.exports = {
  setBudgetSchema,
  updateBudgetSchema,
};
