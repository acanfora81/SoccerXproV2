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

    // 1) Crea senza include per evitare errori durante l'inserimento
    const created = await ScoutingModels.Prospect.create({
      data: {
        ...data,
        fullName,
        teamId: ctx.teamId,
        createdById: ctx.userId,
        status: data.status || 'DISCOVERY',
      },
    });

    // 2) Log dell'evento non-bloccante
    try {
      await eventLogService.log(created.id, 'CREATE', ctx, {
        description: eventLogService.formatDescription('CREATE'),
      });
    } catch (logErr) {
      console.warn('[ProspectService] Event log failed (non-blocking):', logErr?.message || logErr);
    }

    // 3) Ritorna il record completo con include
    const prospect = await ScoutingModels.Prospect.findUnique({
      where: { id: created.id },
      include: ScoutingIncludes.prospectDetail,
    });

    return prospect || created;
  } catch (error) {
    console.error('[ProspectService] Error creating:', error?.message || error);
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
      q, status, mainPosition, nationalityPrimary, agentId,
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

    if (status && status.length > 0) where.status = { in: status };
    if (mainPosition && mainPosition.length > 0) {
      console.log('[ProspectService] Filtering by mainPosition:', mainPosition);
      where.OR = where.OR || [];
      where.OR.push({ mainPosition: { in: mainPosition } }, { secondaryPositions: { array_contains: mainPosition } });
    }
    if (nationalityPrimary && nationalityPrimary.length > 0) where.nationalityPrimary = { in: nationalityPrimary };
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
    const msg = String(error?.message || '');
    // Fallback soft in dev: se il DB non è raggiungibile, evita 500 e ritorna lista vuota
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ProspectService] DB unreachable, returning empty list for safety');
      return { prospects: [], total: 0, page: 1, limit: filters?.limit || 20, hasMore: false };
    }
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

