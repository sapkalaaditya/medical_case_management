const { Case } = require('../models/Case');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/dashboard/stats
 * Returns case counts across key lifecycle statuses: Total, Planning, In Review, Approved, Completed
 */
const getStats = async (req, res, next) => {
  try {
    const [total, planning, inReview, approved, completed, draft, cancelled] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'Planning' }),
      Case.countDocuments({ status: 'In Review' }),
      Case.countDocuments({ status: 'Approved' }),
      Case.countDocuments({ status: 'Completed' }),
      Case.countDocuments({ status: 'Draft' }),
      Case.countDocuments({ status: 'Cancelled' })
    ]);

    return success(
      res,
      {
        total,
        planning,
        inReview,
        approved,
        completed,
        draft,
        cancelled
      },
      'Dashboard statistics retrieved'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats
};
