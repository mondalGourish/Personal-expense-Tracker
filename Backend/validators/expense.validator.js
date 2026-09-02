const Joi = require("joi");

const ALLOWED_CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Education",
  "Other",
];

// Schema for creating an expense
const createExpenseSchema = Joi.object({
  amount: Joi.number().min(1).max(100000000).required().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than or equal to 1",
    "number.max": "Amount exceeds the maximum allowable limit",
    "any.required": "Amount is a required field",
  }),

  category: Joi.string()
    .trim()
    .required()
    .valid(...ALLOWED_CATEGORIES)
    .messages({
      "any.required": "Category is a required field",
      "any.only": `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
    }),

  description: Joi.string()
    .trim()
    .allow("")
    .optional()
    .max(500)
    .messages({
      "string.base": "Description must be text",
      "string.max": "Description cannot exceed 500 characters",
    }),

  date: Joi.date()
    .iso()
    .max("now")
    .optional()
    .messages({
      "date.base": "Date must be a valid date",
      "date.format": "Date must follow ISO format (YYYY-MM-DD)",
      "date.max": "Expense date cannot be in the future",
    }),
});

// Schema for updating an expense (all fields optional, but at least one must be provided)
const updateExpenseSchema = Joi.object({
  amount: Joi.number().min(1).max(100000000).optional().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than or equal to 1",
    "number.max": "Amount exceeds the maximum allowable limit",
  }),

  category: Joi.string()
    .trim()
    .optional()
    .valid(...ALLOWED_CATEGORIES)
    .messages({
      "any.only": `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
    }),

  description: Joi.string()
    .trim()
    .allow("")
    .optional()
    .max(500)
    .messages({
      "string.base": "Description must be text",
      "string.max": "Description cannot exceed 500 characters",
    }),

  date: Joi.date()
    .iso()
    .max("now")
    .optional()
    .messages({
      "date.base": "Date must be a valid date",
      "date.format": "Date must follow ISO format (YYYY-MM-DD)",
      "date.max": "Expense date cannot be in the future",
    }),
}).min(1).messages({
  "object.min": "Please provide at least one field to update",
});

// Schema for query filtering with cross-field validation
const queryExpenseSchema = Joi.object({
  category: Joi.string()
    .trim()
    .valid(...ALLOWED_CATEGORIES)
    .optional()
    .messages({
      "any.only": `Category filter must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
    }),
  minAmount: Joi.number().min(0).optional().messages({
    "number.min": "minAmount cannot be negative",
  }),
  maxAmount: Joi.number().min(0).optional().messages({
    "number.min": "maxAmount cannot be negative",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.format": "startDate must follow ISO format (YYYY-MM-DD)",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.format": "endDate must follow ISO format (YYYY-MM-DD)",
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid("date", "amount", "category", "createdAt").default("date"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .custom((value, helpers) => {
    // Cross-field: minAmount <= maxAmount
    if (
      value.minAmount !== undefined &&
      value.maxAmount !== undefined &&
      value.minAmount > value.maxAmount
    ) {
      return helpers.message("minAmount cannot be greater than maxAmount");
    }

    // Cross-field: startDate <= endDate
    if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
      return helpers.message("startDate cannot be after endDate");
    }

    return value;
  });

module.exports = {
  ALLOWED_CATEGORIES,
  createExpenseSchema,
  updateExpenseSchema,
  queryExpenseSchema,
};
