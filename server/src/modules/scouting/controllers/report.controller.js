/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Report Controller
 * ===============================================================
 */

const reportService = require('../services/report.service');
const {
  createReportSchema,
  updateReportSchema,
  listReportsSchema,
  reportIdSchema,
  successResponse,
  errorResponse,
} = require('../validators');

/**
 * GET /api/scouting/reports
 */
const getAllReports = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    const validation = listReportsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json(errorResponse(validation.error.errors[0].message));
    }

    const filters = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await reportService.list(filters, ctx);

    return res.json(
      successResponse(result.reports, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      })
    );
  } catch (error) {
    console.error('[ReportController] Error in getAllReports:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * GET /api/scouting/reports/:id
 */
const getReportById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    const validation = reportIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid report ID'));
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const report = await reportService.get(id, ctx);

    return res.json(successResponse(report));
  } catch (error) {
    console.error('[ReportController] Error in getReportById:', error);

    if (error.message === 'Report not found') {
      return res.status(404).json(errorResponse('Report not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * POST /api/scouting/reports
 */
const createReport = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.profile?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    console.log('[ReportController] Request body:', req.body);
    const validation = createReportSchema.safeParse(req.body);
    if (!validation.success) {
      console.log('[ReportController] Validation error:', validation.error);
      const errorMessage = validation.error?.errors?.[0]?.message || validation.error?.issues?.[0]?.message || 'Validation error';
      return res.status(400).json(errorResponse(errorMessage));
    }

    const data = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const report = await reportService.create(data, ctx);

    return res.status(201).json(successResponse(report, { action: 'CREATED' }));
  } catch (error) {
    console.error('[ReportController] Error in createReport:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * PUT /api/scouting/reports/:id
 */
const updateReport = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    const paramsValidation = reportIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid report ID'));
    }

    const bodyValidation = updateReportSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(errorResponse(bodyValidation.error.errors[0].message));
    }

    const { id } = paramsValidation.data;
    const data = bodyValidation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const report = await reportService.update(id, data, ctx);

    return res.json(successResponse(report, { action: 'UPDATED' }));
  } catch (error) {
    console.error('[ReportController] Error in updateReport:', error);

    if (error.message === 'Report not found') {
      return res.status(404).json(errorResponse('Report not found'));
    }

    if (error.message === 'Not authorized') {
      return res.status(403).json(errorResponse('Not authorized'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * DELETE /api/scouting/reports/:id
 */
const deleteReport = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    const validation = reportIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid report ID'));
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await reportService.remove(id, ctx);

    return res.json(successResponse(result, { action: 'DELETED' }));
  } catch (error) {
    console.error('[ReportController] Error in deleteReport:', error);

    if (error.message === 'Report not found') {
      return res.status(404).json(errorResponse('Report not found'));
    }

    if (error.message === 'Not authorized') {
      return res.status(403).json(errorResponse('Not authorized'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

module.exports = {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
};

