/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Shortlist Controller
 * ===============================================================
 */

const shortlistService = require('../services/shortlist.service');
const {
  createShortlistSchema,
  updateShortlistSchema,
  listShortlistsSchema,
  shortlistIdSchema,
  addItemSchema,
  updateItemSchema,
  itemIdSchema,
  bulkAddItemsSchema,
  successResponse,
  errorResponse,
} = require('../validators');

// ============ SHORTLISTS ============

const getAllShortlists = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const validation = listShortlistsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json(errorResponse(validation.error.errors[0].message));
    }

    const filters = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await shortlistService.list(filters, ctx);

    return res.json(successResponse(result.shortlists, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    }));
  } catch (error) {
    console.error('[ShortlistController] Error in getAllShortlists:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

const getShortlistById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const validation = shortlistIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid shortlist ID'));
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const shortlist = await shortlistService.get(id, ctx);

    return res.json(successResponse(shortlist));
  } catch (error) {
    console.error('[ShortlistController] Error in getShortlistById:', error);

    if (error.message === 'Shortlist not found') {
      return res.status(404).json(errorResponse('Shortlist not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

const createShortlist = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const validation = createShortlistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(errorResponse(validation.error.errors[0].message));
    }

    const data = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const shortlist = await shortlistService.create(data, ctx);

    return res.status(201).json(successResponse(shortlist, { action: 'CREATED' }));
  } catch (error) {
    console.error('[ShortlistController] Error in createShortlist:', error);
    return res.status(500).json(errorResponse('Internal error'));
  }
};

const updateShortlist = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const paramsValidation = shortlistIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid shortlist ID'));
    }

    const bodyValidation = updateShortlistSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(errorResponse(bodyValidation.error.errors[0].message));
    }

    const { id } = paramsValidation.data;
    const data = bodyValidation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const shortlist = await shortlistService.update(id, data, ctx);

    return res.json(successResponse(shortlist, { action: 'UPDATED' }));
  } catch (error) {
    console.error('[ShortlistController] Error in updateShortlist:', error);

    if (error.message === 'Shortlist not found') {
      return res.status(404).json(errorResponse('Shortlist not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

const deleteShortlist = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const validation = shortlistIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid shortlist ID'));
    }

    const { id } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await shortlistService.remove(id, ctx);

    return res.json(successResponse(result, { action: 'DELETED' }));
  } catch (error) {
    console.error('[ShortlistController] Error in deleteShortlist:', error);

    if (error.message === 'Shortlist not found') {
      return res.status(404).json(errorResponse('Shortlist not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

// ============ SHORTLIST ITEMS ============

const addItemToShortlist = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const paramsValidation = shortlistIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json(errorResponse('Invalid shortlist ID'));
    }

    const bodyValidation = addItemSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(errorResponse(bodyValidation.error.errors[0].message));
    }

    const { id: shortlistId } = paramsValidation.data;
    const data = bodyValidation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const item = await shortlistService.addItem(shortlistId, data, ctx);

    return res.status(201).json(successResponse(item, { action: 'ITEM_ADDED' }));
  } catch (error) {
    console.error('[ShortlistController] Error in addItemToShortlist:', error);

    if (error.message === 'Shortlist not found' || error.message === 'Prospect not found') {
      return res.status(404).json(errorResponse(error.message));
    }

    if (error.message === 'Cannot add archived prospect') {
      return res.status(400).json(errorResponse(error.message));
    }

    if (error.message === 'Prospect already in shortlist') {
      return res.status(409).json(errorResponse(error.message));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

const removeItemFromShortlist = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) return res.status(401).json(errorResponse('No team in session'));

    const validation = itemIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json(errorResponse('Invalid item ID'));
    }

    const { itemId } = validation.data;
    const ctx = { teamId, userId, role: req.user?.role };

    const result = await shortlistService.removeItem(itemId, ctx);

    return res.json(successResponse(result, { action: 'ITEM_REMOVED' }));
  } catch (error) {
    console.error('[ShortlistController] Error in removeItemFromShortlist:', error);

    if (error.message === 'Item not found') {
      return res.status(404).json(errorResponse('Item not found'));
    }

    return res.status(500).json(errorResponse('Internal error'));
  }
};

module.exports = {
  getAllShortlists,
  getShortlistById,
  createShortlist,
  updateShortlist,
  deleteShortlist,
  addItemToShortlist,
  removeItemFromShortlist,
};

