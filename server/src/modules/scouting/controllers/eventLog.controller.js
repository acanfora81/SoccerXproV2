/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – EventLog Controller
 * ===============================================================
 */

const eventLogService = require('../services/eventLog.service');
const {
  prospectIdSchema,
  paginationSchema,
  successResponse,
  errorResponse,
} = require('../validators');

/**
 * GET /api/scouting/prospects/:id/events
 * Recupera eventi per un prospect
 */
const getEventsByProspect = async (req, res) => {
  try {
    const teamId = req.context?.teamId;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione params
    const paramsValidation = prospectIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid prospect ID'));
    }

    // Validazione query
    const queryValidation = paginationSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json(errorResponse(queryValidation.error.errors[0].message));
    }

    const { id: prospectId } = paramsValidation.data;
    const { limit, skip } = queryValidation.data;

    const result = await eventLogService.getByProspect(prospectId, teamId, {
      limit,
      skip,
    });

    return res.json(
      successResponse(result.events, {
        total: result.total,
        hasMore: result.hasMore,
        limit,
        skip,
      })
    );
  } catch (error) {
    console.error('[EventLogController] Error in getEventsByProspect:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

module.exports = {
  getEventsByProspect,
};

