const Joi = require("joi");

/**
 * Strong Password Policy Validator
 * Enforces:
 * - 8 to 25 characters
 * - At least one uppercase letter [A-Z]
 * - At least one lowercase letter [a-z]
 * - At least one digit [0-9]
 * - At least one special character
 */

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,25}$/;

const passwordSchema = Joi.string()
  .min(8)
  .max(25)
  .required()
  .custom((value, helpers) => {
    if (value.length < 8) {
      return helpers.message("Password must be at least 8 characters");
    }
    if (value.length > 25) {
      return helpers.message("Password cannot exceed 25 characters");
    }
    if (!/[A-Z]/.test(value)) {
      return helpers.message("Password must contain at least one uppercase letter (A-Z)");
    }
    if (!/[a-z]/.test(value)) {
      return helpers.message("Password must contain at least one lowercase letter (a-z)");
    }
    if (!/\d/.test(value)) {
      return helpers.message("Password must contain at least one number (0-9)");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      return helpers.message("Password must contain at least one special character");
    }
    return value;
  })
  .messages({
    "string.base": "Password must be text",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 25 characters",
    "any.required": "Password is required",
  });

module.exports = {
  PASSWORD_REGEX,
  passwordSchema,
};
