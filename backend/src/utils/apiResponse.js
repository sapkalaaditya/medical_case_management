/**
 * Consistent API Response Helper
 * Follows SPEC section 6 JSON format exactly:
 * Success: { "success": true, "data": { ... }, "message": "..." }
 * Error:   { "success": false, "data": null, "message": "...", "errors": { ... } }
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} [message]
 * @param {number} [status=200]
 */
const success = (res, data = {}, message = 'Operation successful', status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    message
  });
};

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [status=400]
 * @param {Record<string, string[]> | null} [errors=null] Field-level errors object
 */
const fail = (res, message = 'An error occurred', status = 400, errors = null) => {
  const payload = {
    success: false,
    data: null,
    message
  };

  if (errors && Object.keys(errors).length > 0) {
    payload.errors = errors;
  }

  return res.status(status).json(payload);
};

module.exports = {
  success,
  fail
};
