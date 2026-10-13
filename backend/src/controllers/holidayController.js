const axios = require('axios');
const env = require('../config/env');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/holidays
 * Query params: date (YYYY-MM-DD), country (default: IN)
 * Queries Nager.Date API with a timeout and graceful fallback
 */
const checkHoliday = async (req, res) => {
  const { date, country = 'IN' } = req.query;

  if (!date) {
    return success(
      res,
      { isHoliday: false, holidayName: null, date: null, countryCode: country },
      'No date provided for holiday lookup'
    );
  }

  // Extract year from YYYY-MM-DD
  const year = date.split('-')[0];
  const countryCode = (country || 'IN').toUpperCase();

  try {
    const response = await axios.get(
      `${env.NAGER_API_URL}/PublicHolidays/${year}/${countryCode}`,
      {
        timeout: 3000 // 3-second timeout to avoid blocking
      }
    );

    const holidays = Array.isArray(response.data) ? response.data : [];
    const matched = holidays.find((h) => h.date === date);

    if (matched) {
      return success(
        res,
        {
          isHoliday: true,
          holidayName: matched.name || matched.localName,
          date,
          countryCode
        },
        'Date is a recognized public holiday'
      );
    }

    return success(
      res,
      {
        isHoliday: false,
        holidayName: null,
        date,
        countryCode
      },
      'Date is not a public holiday'
    );
  } catch (error) {
    // Fail gracefully: never crash or return 500 when external service fails
    return success(
      res,
      {
        isHoliday: false,
        holidayName: null,
        date,
        countryCode,
        lookupFailed: true
      },
      'Public holiday service temporarily unavailable'
    );
  }
};

module.exports = {
  checkHoliday
};
