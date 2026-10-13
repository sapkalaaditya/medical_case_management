const { body, query } = require('express-validator');
const { Case, CASE_STATUSES, CASE_PRIORITIES } = require('../models/Case');

/**
 * Validation rules for creating a new Case
 */
const createCaseRules = [
  body('caseNumber')
    .trim()
    .notEmpty()
    .withMessage('Case number is required')
    .matches(/^CASE-\d{4,}$/)
    .withMessage('Case number must match format CASE-0001 (CASE- followed by at least 4 digits)')
    .custom(async (value) => {
      const existing = await Case.findOne({ caseNumber: value });
      if (existing) {
        throw new Error('Case number already exists');
      }
      return true;
    }),

  body('patientReference')
    .trim()
    .notEmpty()
    .withMessage('Patient reference is required')
    .isLength({ max: 50 })
    .withMessage('Patient reference cannot exceed 50 characters'),

  body('surgeonName')
    .trim()
    .notEmpty()
    .withMessage('Surgeon name is required')
    .isLength({ max: 100 })
    .withMessage('Surgeon name cannot exceed 100 characters'),

  body('implantType')
    .trim()
    .notEmpty()
    .withMessage('Implant type is required')
    .isLength({ max: 100 })
    .withMessage('Implant type cannot exceed 100 characters'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(CASE_STATUSES)
    .withMessage(`Status must be one of: ${CASE_STATUSES.join(', ')}`),

  body('priority')
    .trim()
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(CASE_PRIORITIES)
    .withMessage(`Priority must be one of: ${CASE_PRIORITIES.join(', ')}`),

  body('surgeryDate')
    .optional({ checkFalsy: true, nullable: true })
    .isISO8601()
    .withMessage('Surgery date must be a valid ISO8601 date string (e.g. YYYY-MM-DD)')
];

/**
 * Validation rules for updating an existing Case
 */
const updateCaseRules = [
  body('caseNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Case number cannot be empty')
    .matches(/^CASE-\d{4,}$/)
    .withMessage('Case number must match format CASE-0001 (CASE- followed by at least 4 digits)')
    .custom(async (value, { req }) => {
      // Ignore current case being edited
      const existing = await Case.findOne({
        caseNumber: value,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        throw new Error('Case number already exists');
      }
      return true;
    }),

  body('patientReference')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Patient reference cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Patient reference cannot exceed 50 characters'),

  body('surgeonName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Surgeon name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Surgeon name cannot exceed 100 characters'),

  body('implantType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Implant type cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Implant type cannot exceed 100 characters'),

  body('status')
    .optional()
    .trim()
    .isIn(CASE_STATUSES)
    .withMessage(`Status must be one of: ${CASE_STATUSES.join(', ')}`),

  body('priority')
    .optional()
    .trim()
    .isIn(CASE_PRIORITIES)
    .withMessage(`Priority must be one of: ${CASE_PRIORITIES.join(', ')}`),

  body('surgeryDate')
    .optional({ checkFalsy: true, nullable: true })
    .isISO8601()
    .withMessage('Surgery date must be a valid ISO8601 date string (e.g. YYYY-MM-DD)')
];

/**
 * Validation rules for querying cases list
 */
const queryCaseRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('status')
    .optional()
    .isIn(CASE_STATUSES)
    .withMessage(`Status must be one of: ${CASE_STATUSES.join(', ')}`),
  query('priority')
    .optional()
    .isIn(CASE_PRIORITIES)
    .withMessage(`Priority must be one of: ${CASE_PRIORITIES.join(', ')}`),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

module.exports = {
  createCaseRules,
  updateCaseRules,
  queryCaseRules
};
