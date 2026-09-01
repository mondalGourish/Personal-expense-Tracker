/**
 * Validation Middleware using Joi
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errorDetails,
      });
    }

    // Replace request property with sanitized/typecast value
    req[source] = value;
    next();
  };
};

module.exports = validate;
