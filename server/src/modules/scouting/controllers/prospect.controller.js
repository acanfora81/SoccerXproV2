/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Prospect Controller
 * ===============================================================
 */

const prospectService = require('../services/prospect.service');
const {
  createProspectSchema,
  updateProspectSchema,
  listProspectsSchema,
  prospectIdSchema,
  promoteToTargetSchema,
  validateProspectBusinessRules,
  successResponse,
  errorResponse,
} = require('../validators');

/**
 * GET /api/scouting/prospects
 * Lista prospect con filtri
 */
const getAllProspects = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione query params
    const validation = listProspectsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json(
        errorResponse(validation.error.errors[0].message)
      );
    }

    const filters = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await prospectService.list(filters, ctx);

    return res.json(
      successResponse(result.prospects, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      })
    );
  } catch (error) {
    console.error('[ProspectController] Error in getAllProspects:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * GET /api/scouting/prospects/:id
 * Dettaglio prospect
 */
const getProspectById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione params
    const validation = prospectIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(
        errorResponse('Invalid prospect ID')
      );
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const prospect = await prospectService.get(id, ctx);

    return res.json(successResponse(prospect));
  } catch (error) {
    console.error('[ProspectController] Error in getProspectById:', error);

    if (error.message === 'Prospect not found') {
      return res.status(404).json(errorResponse('Prospect not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * POST /api/scouting/prospects
 * Crea nuovo prospect
 */
const createProspect = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione body
    const validation = createProspectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        errorResponse(validation.error.errors[0].message)
      );
    }

    const data = validation.data;

    // Business rules validation
    const businessValidation = validateProspectBusinessRules(data);
    if (!businessValidation.valid) {
      return res.status(400).json(
        errorResponse(businessValidation.errors.join(', '))
      );
    }

    const ctx = { teamId, userId, role: req.user?.role };

    const prospect = await prospectService.create(data, ctx);

    return res.status(201).json(
      successResponse(prospect, { action: 'CREATED' })
    );
  } catch (error) {
    console.error('[ProspectController] Error in createProspect:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * PUT /api/scouting/prospects/:id
 * Aggiorna prospect
 */
const updateProspect = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione params
    const paramsValidation = prospectIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid prospect ID'));
    }

    // Validazione body
    const bodyValidation = updateProspectSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(
        errorResponse(bodyValidation.error.errors[0].message)
      );
    }

    const { id } = paramsValidation.data;
    const data = bodyValidation.data;

    // Business rules validation
    const businessValidation = validateProspectBusinessRules(data);
    if (!businessValidation.valid) {
      return res.status(400).json(
        errorResponse(businessValidation.errors.join(', '))
      );
    }

    const ctx = { teamId, userId, role: req.user?.role };

    const prospect = await prospectService.update(id, data, ctx);

    return res.json(successResponse(prospect, { action: 'UPDATED' }));
  } catch (error) {
    console.error('[ProspectController] Error in updateProspect:', error);

    if (error.message === 'Prospect not found') {
      return res.status(404).json(errorResponse('Prospect not found'));
    }

    if (error.message === 'Not authorized') {
      return res.status(403).json(errorResponse('Not authorized'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * DELETE /api/scouting/prospects/:id
 * Elimina prospect
 */
const deleteProspect = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Validazione params
    const validation = prospectIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid prospect ID'));
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await prospectService.remove(id, ctx);

    return res.json(successResponse(result, { action: 'DELETED' }));
  } catch (error) {
    console.error('[ProspectController] Error in deleteProspect:', error);

    if (error.message === 'Prospect not found') {
      return res.status(404).json(errorResponse('Prospect not found'));
    }

    if (error.message === 'Not authorized') {
      return res.status(403).json(errorResponse('Not authorized'));
    }

    if (error.message.includes('Cannot delete')) {
      return res.status(409).json(errorResponse(error.message));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

/**
 * POST /api/scouting/prospects/:id/promote
 * Promuove prospect a market target
 */
const promoteProspect = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json(errorResponse('No team in session'));
    }

    // Verifica ruolo (solo DIRECTOR_SPORT o ADMIN)
    const allowedRoles = ['DIRECTOR_SPORT', 'ADMIN'];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json(
        errorResponse('Only DIRECTOR_SPORT or ADMIN can promote prospects')
      );
    }

    // Validazione params
    const paramsValidation = prospectIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid prospect ID'));
    }

    // Validazione body
    const bodyValidation = promoteToTargetSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(
        errorResponse(bodyValidation.error.errors[0].message)
      );
    }

    const { id } = paramsValidation.data;
    const options = bodyValidation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    // Import promote service
    const promoteService = require('../services/promote.service');
    const result = await promoteService.promoteToTarget(id, ctx, options);

    return res.json(successResponse(result, { action: 'PROMOTED' }));
  } catch (error) {
    console.error('[ProspectController] Error in promoteProspect:', error);

    if (error.message === 'Prospect not found') {
      return res.status(404).json(errorResponse('Prospect not found'));
    }

    if (error.message.includes('must have status TARGETED')) {
      return res.status(400).json(errorResponse(error.message));
    }

    if (error.message.includes('Only DIRECTOR_SPORT')) {
      return res.status(403).json(errorResponse(error.message));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

module.exports = {
  getAllProspects,
  getProspectById,
  createProspect,
  updateProspect,
  deleteProspect,
  promoteProspect,
};

