const { fail } = require('../utils/apiResponse');

/**
 * 404 Not Found Middleware for undefined endpoints
 */
const notFoundHandler = (req, res, next) => {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

/**
 * Central Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = field === 'caseNumber'
      ? 'Case number already exists'
      : `${field} already exists`;

    return fail(res, 'Validation failed', 422, {
      [field]: [message]
    });
  }

  // 2. Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return fail(res, 'Resource not found', 404);
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = {};
    for (const [key, val] of Object.entries(err.errors)) {
      formattedErrors[key] = [val.message];
    }
    return fail(res, 'Validation failed', 422, formattedErrors);
  }

  // 4. Bad JSON payload in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return fail(res, 'Malformed JSON payload', 400);
  }

  // 5. Default 500 Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Details]', err);
  }

  return fail(res, message, statusCode);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
