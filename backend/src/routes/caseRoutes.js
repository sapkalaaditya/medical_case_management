const express = require('express');
const caseController = require('../controllers/caseController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createCaseRules,
  updateCaseRules,
  queryCaseRules
} = require('../validators/caseValidator');

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

// List cases (Admin, Viewer, Engineer)
router.get('/', authorize('viewAny'), validate(queryCaseRules), caseController.getCases);

// Create case (Admin, Engineer)
router.post('/', authorize('create'), validate(createCaseRules), caseController.createCase);

// Get single case by ID (Admin, Viewer, Engineer)
router.get('/:id', authorize('view'), caseController.getCaseById);

// Update case (Admin, Engineer)
router.put('/:id', authorize('update'), validate(updateCaseRules), caseController.updateCase);

// Delete case (Admin only)
router.delete('/:id', authorize('delete'), caseController.deleteCase);

module.exports = router;
