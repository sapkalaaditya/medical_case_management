/**
 * Case Policy Module
 * Equivalent to Laravel Policy/Gate
 * Enforces role-based permissions on medical cases
 *
 * Matrix:
 * Admin:    viewAny (Yes), view (Yes), create (Yes), update (Yes), changeStatus (Yes), delete (Yes)
 * Viewer:   viewAny (Yes), view (Yes), create (No),  update (No),  changeStatus (No),  delete (No)
 * Engineer: viewAny (Yes), view (Yes), create (Yes), update (Yes), changeStatus (Yes), delete (No)
 */

const casePolicy = {
  /**
   * Determine whether the user can view list of cases
   * @param {object} user
   * @returns {boolean}
   */
  viewAny(user) {
    if (!user) return false;
    return ['admin', 'viewer', 'engineer'].includes(user.role);
  },

  /**
   * Determine whether the user can view a specific case
   * @param {object} user
   * @param {object} [caseDoc]
   * @returns {boolean}
   */
  view(user, caseDoc) {
    if (!user) return false;
    return ['admin', 'viewer', 'engineer'].includes(user.role);
  },

  /**
   * Determine whether the user can create cases
   * @param {object} user
   * @returns {boolean}
   */
  create(user) {
    if (!user) return false;
    return ['admin', 'engineer'].includes(user.role);
  },

  /**
   * Determine whether the user can update a case
   * @param {object} user
   * @param {object} [caseDoc]
   * @returns {boolean}
   */
  update(user, caseDoc) {
    if (!user) return false;
    return ['admin', 'engineer'].includes(user.role);
  },

  /**
   * Determine whether the user can change status of a case
   * @param {object} user
   * @param {object} [caseDoc]
   * @returns {boolean}
   */
  changeStatus(user, caseDoc) {
    if (!user) return false;
    return ['admin', 'engineer'].includes(user.role);
  },

  /**
   * Determine whether the user can delete a case
   * Only Admin can delete cases
   * @param {object} user
   * @param {object} [caseDoc]
   * @returns {boolean}
   */
  delete(user, caseDoc) {
    if (!user) return false;
    return user.role === 'admin';
  }
};

module.exports = casePolicy;
