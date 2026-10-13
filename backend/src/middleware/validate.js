const { validationResult } = require('express-validator');
const { fail } = require('../utils/apiResponse');

/**
 * Middleware to check express-validator results and format 422 errors
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors as { fieldName: ['Error message 1', 'Error message 2'] }
    const formattedErrors = {};
    errors.array().forEach((err) => {
      const field = err.path || err.param || 'general';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(err.msg);
    });

    return fail(res, 'Validation failed', 422, formattedErrors);
  };
};

module.exports = validate;
