/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Shortlist Service
 * ===============================================================
 */

const { ScoutingModels, ScoutingIncludes } = require('../modelRefs');
const eventLogService = require('./eventLog.service');

const create = async (data, ctx) => {
  try {
    const shortlist = await ScoutingModels.Shortlist.create({
      data: {
        ...data,
        teamId: ctx.teamId,
        createdById: ctx.userId,
      },
    });

    return shortlist;
  } catch (error) {
    console.error('[ShortlistService] Error creating:', error);
    throw new Error('Failed to create shortlist');
  }
};

const update = async (id, data, ctx) => {
  try {
    const existing = await ScoutingModels.Shortlist.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!existing) throw new Error('Shortlist not found');

    const shortlist = await ScoutingModels.Shortlist.update({
      where: { id },
      data,
    });

    return shortlist;
  } catch (error) {
    console.error('[ShortlistService] Error updating:', error);
    throw error;
  }
};

const list = async (filters, ctx) => {
  try {
    const {
      q, category, isArchived,
      limit = 20, skip = 0,
      orderBy = 'updatedAt', orderDir = 'desc',
    } = filters;

    const where = { teamId: ctx.teamId };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (isArchived !== undefined) where.isArchived = isArchived;

    const [shortlists, total] = await Promise.all([
      ScoutingModels.Shortlist.findMany({
        where,
        include: ScoutingIncludes.shortlistWithItems,
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip,
      }),
      ScoutingModels.Shortlist.count({ where }),
    ]);

    return { shortlists, total, page: Math.floor(skip / limit) + 1, limit, hasMore: skip + limit < total };
  } catch (error) {
    console.error('[ShortlistService] Error listing:', error);
    throw new Error('Failed to list shortlists');
  }
};

const get = async (id, ctx) => {
  try {
    const shortlist = await ScoutingModels.Shortlist.findFirst({
      where: { id, teamId: ctx.teamId },
      include: ScoutingIncludes.shortlistWithItems,
    });

    if (!shortlist) throw new Error('Shortlist not found');
    return shortlist;
  } catch (error) {
    console.error('[ShortlistService] Error getting:', error);
    throw error;
  }
};

const remove = async (id, ctx) => {
  try {
    const shortlist = await ScoutingModels.Shortlist.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!shortlist) throw new Error('Shortlist not found');

    await ScoutingModels.Shortlist.delete({ where: { id } });
    return { id, deleted: true };
  } catch (error) {
    console.error('[ShortlistService] Error deleting:', error);
    throw error;
  }
};

const addItem = async (shortlistId, data, ctx) => {
  try {
    const shortlist = await ScoutingModels.Shortlist.findFirst({
      where: { id: shortlistId, teamId: ctx.teamId },
    });

    if (!shortlist) throw new Error('Shortlist not found');

    const prospect = await ScoutingModels.Prospect.findFirst({
      where: { id: data.prospectId, teamId: ctx.teamId },
    });

    if (!prospect) throw new Error('Prospect not found');

    if (prospect.scoutingStatus === 'ARCHIVED') {
      throw new Error('Cannot add archived prospect');
    }

    const existing = await ScoutingModels.ShortlistItem.findFirst({
      where: { shortlistId, prospectId: data.prospectId },
    });

    if (existing) throw new Error('Prospect already in shortlist');

    let priority = data.priority;
    if (priority === undefined) {
      const count = await ScoutingModels.ShortlistItem.count({ where: { shortlistId } });
      priority = count + 1;
    }

    const item = await ScoutingModels.ShortlistItem.create({
      data: {
        shortlistId,
        prospectId: data.prospectId,
        priority,
        notes: data.notes || null,
      },
    });

    await eventLogService.log(data.prospectId, 'ADDED_TO_SHORTLIST', ctx, {
      description: eventLogService.formatDescription('ADDED_TO_SHORTLIST', {
        shortlistName: shortlist.name,
      }),
    });

    return item;
  } catch (error) {
    console.error('[ShortlistService] Error adding item:', error);
    throw error;
  }
};

const removeItem = async (itemId, ctx) => {
  try {
    const item = await ScoutingModels.ShortlistItem.findUnique({
      where: { id: itemId },
      include: { shortlist: true },
    });

    if (!item || item.shortlist.teamId !== ctx.teamId) {
      throw new Error('Item not found');
    }

    await ScoutingModels.ShortlistItem.delete({ where: { id: itemId } });

    await eventLogService.log(item.prospectId, 'REMOVED_FROM_SHORTLIST', ctx, {
      description: eventLogService.formatDescription('REMOVED_FROM_SHORTLIST', {
        shortlistName: item.shortlist.name,
      }),
    });

    return { id: itemId, deleted: true };
  } catch (error) {
    console.error('[ShortlistService] Error removing item:', error);
    throw error;
  }
};

module.exports = { create, update, list, get, remove, addItem, removeItem };

