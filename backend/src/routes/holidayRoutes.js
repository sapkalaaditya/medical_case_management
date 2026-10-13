const express = require('express');
const holidayController = require('../controllers/holidayController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Holiday endpoint requires authentication as it is accessed from case form
router.get('/', authenticate, holidayController.checkHoliday);

module.exports = router;
