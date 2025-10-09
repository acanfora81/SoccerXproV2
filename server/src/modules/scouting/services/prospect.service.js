/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Prospect Service
 * ===============================================================
 */

const { ScoutingModels, ScoutingIncludes } = require('../modelRefs');
const eventLogService = require('./eventLog.service');

const create = async (data, ctx) => {
  try {
    const fullName = data.fullName || `${data.firstName} ${data.lastName}`;

    const prospect = await ScoutingModels.Prospect.create({
      data: {
        ...data,
        fullName,
        teamId: ctx.teamId,
        createdById: ctx.userId,
        scoutingStatus: data.scoutingStatus || 'DISCOVERY',
      },
      include: ScoutingIncludes.prospectDetail,
    });

    await eventLogService.log(prospect.id, 'CREATE', ctx, {
      description: eventLogService.formatDescription('CREATE'),
    });

    return prospect;
  } catch (error) {
    console.error('[ProspectService] Error creating:', error);
    throw new Error('Failed to create prospect');
  }
};

const update = async (id, data, ctx) => {
  try {
    const existing = await ScoutingModels.Prospect.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!existing) throw new Error('Prospect not found');

    if (ctx.role === 'SCOUT' && existing.createdById !== ctx.userId) {
      throw new Error('Not authorized');
    }

    const updateData = { ...data, updatedById: ctx.userId };

    if (data.firstName || data.lastName) {
      updateData.fullName = `${data.firstName || existing.firstName} ${data.lastName || existing.lastName}`;
    }

    const prospect = await ScoutingModels.Prospect.update({
      where: { id },
      data: updateData,
      include: ScoutingIncludes.prospectDetail,
    });

    await eventLogService.log(id, 'UPDATE', ctx, {
      description: eventLogService.formatDescription('UPDATE'),
    });

    if (data.scoutingStatus && data.scoutingStatus !== existing.scoutingStatus) {
      await eventLogService.log(id, 'STATUS_CHANGE', ctx, {
        description: eventLogService.formatDescription('STATUS_CHANGE', {
          from: existing.scoutingStatus,
          to: data.scoutingStatus,
        }),
        fromStatus: existing.scoutingStatus,
        toStatus: data.scoutingStatus,
      });
    }

    return prospect;
  } catch (error) {
    console.error('[ProspectService] Error updating:', error);
    throw error;
  }
};

const list = async (filters, ctx) => {
  try {
    const {
      q, status, position, nationality, agentId,
      minPotentialScore, maxPotentialScore,
      minMarketValue, maxMarketValue,
      fromDate, toDate,
      limit = 20, skip = 0,
      orderBy = 'updatedAt', orderDir = 'desc',
    } = filters;

    const where = { teamId: ctx.teamId };

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { currentClub: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status && status.length > 0) where.scoutingStatus = { in: status };
    if (position && position.length > 0) {
      where.OR = where.OR || [];
      where.OR.push({ position: { in: position } }, { secondaryPosition: { in: position } });
    }
    if (nationality && nationality.length > 0) where.nationality = { in: nationality };
    if (agentId) where.agentId = agentId;

    if (minPotentialScore !== undefined || maxPotentialScore !== undefined) {
      where.potentialScore = {};
      if (minPotentialScore !== undefined) where.potentialScore.gte = minPotentialScore;
      if (maxPotentialScore !== undefined) where.potentialScore.lte = maxPotentialScore;
    }

    if (minMarketValue !== undefined || maxMarketValue !== undefined) {
      where.marketValue = {};
      if (minMarketValue !== undefined) where.marketValue.gte = minMarketValue;
      if (maxMarketValue !== undefined) where.marketValue.lte = maxMarketValue;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [prospects, total] = await Promise.all([
      ScoutingModels.Prospect.findMany({
        where,
        include: ScoutingIncludes.prospectList,
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip,
      }),
      ScoutingModels.Prospect.count({ where }),
    ]);

    return { prospects, total, page: Math.floor(skip / limit) + 1, limit, hasMore: skip + limit < total };
  } catch (error) {
    console.error('[ProspectService] Error listing:', error);
    throw new Error('Failed to list prospects');
  }
};

const get = async (id, ctx) => {
  try {
    const prospect = await ScoutingModels.Prospect.findFirst({
      where: { id, teamId: ctx.teamId },
      include: ScoutingIncludes.prospectDetail,
    });

    if (!prospect) throw new Error('Prospect not found');
    return prospect;
  } catch (error) {
    console.error('[ProspectService] Error getting:', error);
    throw error;
  }
};

const remove = async (id, ctx) => {
  try {
    const prospect = await ScoutingModels.Prospect.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!prospect) throw new Error('Prospect not found');

    if (ctx.role === 'SCOUT' && prospect.createdById !== ctx.userId) {
      throw new Error('Not authorized');
    }

    if (prospect.scoutingStatus === 'TARGETED') {
      throw new Error('Cannot delete TARGETED prospect. Archive it instead.');
    }

    await ScoutingModels.Prospect.delete({ where: { id } });
    return { id, deleted: true };
  } catch (error) {
    console.error('[ProspectService] Error deleting:', error);
    throw error;
  }
};

module.exports = { create, update, list, get, remove };

