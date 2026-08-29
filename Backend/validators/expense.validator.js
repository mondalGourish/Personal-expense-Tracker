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
//defining validation
const expenseSchema = Joi.object({
  amount: Joi.number.min(1).max(100000000).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than 0",
    "any.required": "Amount is a required field",
  }),

  category: Joi.string()
    .trim()
    .required()
    .valid(...ALLOWED_CATEGORIES)

    .messages({
      "any.only": `Category must be one of the following: ${ALLOWED_CATEGORIES.join(", ")}`,
    }),
  description: Joi.string()
    .trim()             // Automatically removes leading/trailing white spaces
                        // Prevents excessively large payloads
    .optional()
    .max(500)           // The field doesn't have to be sent by the client
    .messages({
      "string.base": "Description must be text",
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 500 characters",
    }),

  date: Joi.date()
    .iso()
    .max("now") // Prevents entering future expenses
    .optional(),
});

module.exports = expenseSchema;
