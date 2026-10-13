const casePolicy = require('../policies/casePolicy');
const { fail } = require('../utils/apiResponse');

/**
 * Authorization Middleware Factory
 * Checks user permissions using policy definitions (equivalent to Laravel Policy/Gate)
 *
 * @param {'viewAny' | 'view' | 'create' | 'update' | 'changeStatus' | 'delete'} action
 */
const authorize = (action) => {
  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return fail(res, 'Authentication required', 401);
    }

    const policyFn = casePolicy[action];
    if (typeof policyFn !== 'function') {
      return fail(res, `Undefined policy action: ${action}`, 500);
    }

    const targetDoc = req.caseDoc || null;
    const isAllowed = policyFn(user, targetDoc);

    if (!isAllowed) {
      return fail(
        res,
        'Access denied. You do not have permission to perform this action.',
        403
      );
    }

    // Special check for update action: if attempting to change status, verify changeStatus permission
    if (action === 'update' && req.body && req.body.status) {
      const canChangeStatus = casePolicy.changeStatus(user, targetDoc);
      if (!canChangeStatus) {
        return fail(
          res,
          'Access denied. You do not have permission to change case status.',
          403
        );
      }
    }

    next();
  };
};

module.exports = authorize;
