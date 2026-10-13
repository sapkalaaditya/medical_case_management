const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiToken = require('../models/ApiToken');
const { fail } = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Validates JWT Bearer token and checks if jti is active in ApiToken collection
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return fail(res, 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return fail(res, 'Authentication token missing', 401);
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return fail(res, 'Token has expired. Please log in again.', 401);
      }
      return fail(res, 'Invalid authentication token', 401);
    }

    if (!decoded.jti || !decoded.userId) {
      return fail(res, 'Malformed token payload', 401);
    }

    // Verify token is still active (not revoked via logout)
    const activeToken = await ApiToken.findOne({ jti: decoded.jti });
    if (!activeToken) {
      return fail(res, 'Token has been revoked or expired. Please log in again.', 401);
    }

    // Fetch user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return fail(res, 'Associated user account no longer exists', 401);
    }

    // Attach user and jti to request object
    req.user = user;
    req.tokenJti = decoded.jti;
    next();
  } catch (error) {
    return fail(res, 'Authentication failed', 401);
  }
};

module.exports = authenticate;
