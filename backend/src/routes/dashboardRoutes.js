const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard lifecycle status counts
router.get('/stats', dashboardController.getStats);

module.exports = router;
