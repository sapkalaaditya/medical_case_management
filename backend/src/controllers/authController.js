const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiToken = require('../models/ApiToken');
const { success, fail } = require('../utils/apiResponse');

/**
 * Helper to calculate expiration date from expiresIn string (e.g., '24h', '1d', '3600s')
 */
const getExpiresAtDate = (expiresIn) => {
  const now = Date.now();
  if (typeof expiresIn === 'string') {
    if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1), 10) || 24;
      return new Date(now + hours * 60 * 60 * 1000);
    }
    if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1), 10) || 1;
      return new Date(now + days * 24 * 60 * 60 * 1000);
    }
    if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn.slice(0, -1), 10) || 60;
      return new Date(now + minutes * 60 * 1000);
    }
  }
  // Default to 24 hours
  return new Date(now + 24 * 60 * 60 * 1000);
};

/**
 * POST /api/login
 * Authenticates user credentials and creates a revocable session token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Look up user by email, explicitly including password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return fail(res, 'Invalid email or password', 401);
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return fail(res, 'Invalid email or password', 401);
    }

    // Generate unique JWT ID (jti)
    const jti = crypto.randomUUID();
    const expiresAt = getExpiresAtDate(env.JWT_EXPIRES_IN);

    // Save token record in database for revocability
    await ApiToken.create({
      jti,
      userId: user._id,
      expiresAt
    });

    // Generate signed JWT
    const token = jwt.sign(
      {
        userId: user._id,
        jti
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );

    return success(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/logout
 * Revokes current session token by deleting its record from ApiToken collection
 */
const logout = async (req, res, next) => {
  try {
    if (req.tokenJti) {
      await ApiToken.deleteOne({ jti: req.tokenJti });
    }
    return success(res, null, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/me
 * Returns current authenticated user and role
 */
const getCurrentUser = async (req, res) => {
  return success(
    res,
    {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    },
    'Current user details retrieved'
  );
};

module.exports = {
  login,
  logout,
  getCurrentUser
};
