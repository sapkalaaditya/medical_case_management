const { Case } = require('../models/Case');
const { success, fail } = require('../utils/apiResponse');

// Allowed fields for mass-assignment prevention (pick helper)
const ALLOWED_FIELDS = [
  'caseNumber',
  'patientReference',
  'surgeonName',
  'implantType',
  'status',
  'priority',
  'surgeryDate'
];

// Whitelist of sortable fields
const ALLOWED_SORT_FIELDS = [
  'caseNumber',
  'patientReference',
  'surgeonName',
  'implantType',
  'status',
  'priority',
  'surgeryDate',
  'createdAt'
];

/**
 * Escapes special regex characters in a user search string
 * Prevents regex injection and ReDoS vulnerabilities
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Whitelist extraction helper to prevent mass-assignment
 */
const pick = (object, keys) => {
  return keys.reduce((acc, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
      acc[key] = object[key];
    }
    return acc;
  }, {});
};

/**
 * GET /api/cases
 * Paginated list of cases with debounced search, filtering, and sorting
 */
const getCases = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const queryFilter = {};

    // Search by caseNumber OR surgeonName (case-insensitive, escaped regex)
    if (req.query.search && req.query.search.trim()) {
      const escaped = escapeRegex(req.query.search.trim());
      queryFilter.$or = [
        { caseNumber: { $regex: escaped, $options: 'i' } },
        { surgeonName: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Status filter
    if (req.query.status && req.query.status.trim()) {
      queryFilter.status = req.query.status.trim();
    }

    // Priority filter (bonus)
    if (req.query.priority && req.query.priority.trim()) {
      queryFilter.priority = req.query.priority.trim();
    }

    // Sorting (bonus): validate field against whitelist
    const sortBy = req.query.sortBy && ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Case.find(queryFilter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name'),
      Case.countDocuments(queryFilter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      'Cases retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cases/:id
 * Retrieve a single case by ID with populated creator details
 */
const getCaseById = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id).populate('createdBy', 'name email');
    if (!caseDoc) {
      return fail(res, 'Case not found', 404);
    }
    return success(res, caseDoc, 'Case details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cases
 * Create a new case. Mass assignment protected, createdBy assigned from req.user._id
 */
const createCase = async (req, res, next) => {
  try {
    const safeData = pick(req.body, ALLOWED_FIELDS);
    // createdBy is set strictly from authenticated user
    safeData.createdBy = req.user._id;

    if (safeData.surgeryDate === '' || safeData.surgeryDate === null) {
      safeData.surgeryDate = null;
    }

    const created = await Case.create(safeData);
    const populated = await Case.findById(created._id).populate('createdBy', 'name email');

    return success(res, populated, 'Case created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cases/:id
 * Update an existing case. Only whitelisted fields can be updated.
 */
const updateCase = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return fail(res, 'Case not found', 404);
    }

    const safeUpdates = pick(req.body, ALLOWED_FIELDS);

    if (safeUpdates.surgeryDate === '' || safeUpdates.surgeryDate === null) {
      safeUpdates.surgeryDate = null;
    }

    Object.assign(caseDoc, safeUpdates);
    await caseDoc.save();

    const updated = await Case.findById(caseDoc._id).populate('createdBy', 'name email');
    return success(res, updated, 'Case updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cases/:id
 * Delete a case. Admin only.
 */
const deleteCase = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return fail(res, 'Case not found', 404);
    }

    await Case.deleteOne({ _id: req.params.id });
    return success(res, null, 'Case deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase
};
