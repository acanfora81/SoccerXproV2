/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Report Service
 * ===============================================================
 */

const { ScoutingModels, ScoutingIncludes } = require('../modelRefs');
const eventLogService = require('./eventLog.service');
const { calculateTotalScore } = require('../validators/report.schema');

const create = async (data, ctx) => {
  try {
    const totalScore = data.totalScore || calculateTotalScore(
      data.techniqueScore,
      data.tacticsScore,
      data.physicalScore,
      data.mentalityScore
    );

    const report = await ScoutingModels.Report.create({
      data: {
        ...data,
        totalScore,
        teamId: ctx.teamId,
        createdById: ctx.userId,
      },
      include: ScoutingIncludes.reportWithProspect,
    });

    await eventLogService.log(report.prospectId, 'REPORT_ADDED', ctx, {
      description: eventLogService.formatDescription('REPORT_ADDED', {
        matchDate: data.matchDate,
      }),
    });

    return report;
  } catch (error) {
    const msg = String(error?.message || '');
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ReportService] DB unreachable, returning error for safety');
      throw new Error('Database unavailable');
    }
    console.error('[ReportService] Error creating:', error);
    throw new Error('Failed to create report');
  }
};

const update = async (id, data, ctx) => {
  try {
    const existing = await ScoutingModels.Report.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!existing) throw new Error('Report not found');

    if (ctx.role === 'SCOUT' && existing.createdById !== ctx.userId) {
      throw new Error('Not authorized');
    }

    const updateData = { ...data };

    if (data.techniqueScore !== undefined || data.tacticsScore !== undefined ||
        data.physicalScore !== undefined || data.mentalityScore !== undefined) {
      updateData.totalScore = calculateTotalScore(
        data.techniqueScore !== undefined ? data.techniqueScore : existing.techniqueScore,
        data.tacticsScore !== undefined ? data.tacticsScore : existing.tacticsScore,
        data.physicalScore !== undefined ? data.physicalScore : existing.physicalScore,
        data.mentalityScore !== undefined ? data.mentalityScore : existing.mentalityScore
      );
    }

    const report = await ScoutingModels.Report.update({
      where: { id },
      data: updateData,
      include: ScoutingIncludes.reportWithProspect,
    });

    return report;
  } catch (error) {
    const msg = String(error?.message || '');
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ReportService] DB unreachable, returning error for safety');
      throw new Error('Database unavailable');
    }
    console.error('[ReportService] Error updating:', error);
    throw error;
  }
};

const list = async (filters, ctx) => {
  try {
    const {
      q, prospectId, competition, matchDateFrom, matchDateTo,
      minTotalScore, maxTotalScore,
      limit = 20, skip = 0,
      orderBy = 'matchDate', orderDir = 'desc',
    } = filters;

    const where = { teamId: ctx.teamId };

    if (q) {
      where.OR = [
        { opponent: { contains: q, mode: 'insensitive' } },
        { competition: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (prospectId) where.prospectId = prospectId;
    if (competition) where.competition = { contains: competition, mode: 'insensitive' };

    if (matchDateFrom || matchDateTo) {
      where.matchDate = {};
      if (matchDateFrom) where.matchDate.gte = new Date(matchDateFrom);
      if (matchDateTo) where.matchDate.lte = new Date(matchDateTo);
    }

    if (minTotalScore !== undefined || maxTotalScore !== undefined) {
      where.totalScore = {};
      if (minTotalScore !== undefined) where.totalScore.gte = minTotalScore;
      if (maxTotalScore !== undefined) where.totalScore.lte = maxTotalScore;
    }

    const [reports, total] = await Promise.all([
      ScoutingModels.Report.findMany({
        where,
        include: {
          prospect: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              mainPosition: true
            }
          },
          session: {
            select: {
              id: true,
              observationType: true,
              dateObserved: true
            }
          }
        },
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip,
      }),
      ScoutingModels.Report.count({ where }),
    ]);

    return { reports, total, page: Math.floor(skip / limit) + 1, limit, hasMore: skip + limit < total };
  } catch (error) {
    const msg = String(error?.message || '');
    // Fallback soft in dev: se il DB non è raggiungibile, evita 500 e ritorna lista vuota
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ReportService] DB unreachable, returning empty list for safety');
      return { reports: [], total: 0, page: 1, limit: filters?.limit || 20, hasMore: false };
    }
    console.error('[ReportService] Error listing:', error);
    throw new Error('Failed to list reports');
  }
};

const get = async (id, ctx) => {
  try {
    const report = await ScoutingModels.Report.findFirst({
      where: { id, teamId: ctx.teamId },
      include: ScoutingIncludes.reportWithProspect,
    });

    if (!report) throw new Error('Report not found');
    return report;
  } catch (error) {
    const msg = String(error?.message || '');
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ReportService] DB unreachable, returning null for safety');
      return null;
    }
    console.error('[ReportService] Error getting:', error);
    throw error;
  }
};

const remove = async (id, ctx) => {
  try {
    const report = await ScoutingModels.Report.findFirst({
      where: { id, teamId: ctx.teamId },
    });

    if (!report) throw new Error('Report not found');

    if (ctx.role === 'SCOUT' && report.createdById !== ctx.userId) {
      throw new Error('Not authorized');
    }

    await ScoutingModels.Report.delete({ where: { id } });
    return { id, deleted: true };
  } catch (error) {
    const msg = String(error?.message || '');
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[ReportService] DB unreachable, returning error for safety');
      throw new Error('Database unavailable');
    }
    console.error('[ReportService] Error deleting:', error);
    throw error;
  }
};

module.exports = { create, update, list, get, remove };

