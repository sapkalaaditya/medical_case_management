const express = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginRules } = require('../validators/authValidator');
const { fail } = require('../utils/apiResponse');

const router = express.Router();

// Rate limiter for login endpoint (10 attempts per 15 minutes, relaxed during tests)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 10,
  handler: (req, res) => {
    return fail(res, 'Too many login attempts. Please try again after 15 minutes.', 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test'
});

// Authentication endpoints
router.post('/login', loginLimiter, validate(loginRules), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
