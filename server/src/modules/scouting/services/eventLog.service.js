/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – EventLog Service
 * ===============================================================
 */

const { ScoutingModels, ScoutingEnums } = require('../modelRefs');

/**
 * Scrive un evento nel log
 */
const log = async (prospectId, action, ctx, options = {}) => {
  try {
    const eventLog = await ScoutingModels.EventLog.create({
      data: {
        prospectId,
        teamId: ctx.teamId,
        userId: ctx.userId,
        action,
        description: options.description || null,
        fromStatus: options.fromStatus || null,
        toStatus: options.toStatus || null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return eventLog;
  } catch (error) {
    console.error('[EventLog] Error creating log:', error);
    throw new Error('Failed to create event log');
  }
};

/**
 * Recupera eventi per un prospect
 */
const getByProspect = async (prospectId, teamId, options = {}) => {
  const limit = options.limit || 50;
  const skip = options.skip || 0;

  try {
    const [events, total] = await Promise.all([
      ScoutingModels.EventLog.findMany({
        where: { prospectId, teamId },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      ScoutingModels.EventLog.count({ where: { prospectId, teamId } }),
    ]);

    return { events, total, hasMore: skip + limit < total };
  } catch (error) {
    console.error('[EventLog] Error fetching by prospect:', error);
    throw new Error('Failed to fetch event logs');
  }
};

/**
 * Helper per formattare description
 */
const formatDescription = (action, details = {}) => {
  switch (action) {
    case ScoutingEnums.Actions.CREATE:
      return `Prospect creato${details.by ? ` da ${details.by}` : ''}`;
    case ScoutingEnums.Actions.UPDATE:
      const fields = details.fields ? ` (${details.fields.join(', ')})` : '';
      return `Prospect aggiornato${fields}`;
    case ScoutingEnums.Actions.STATUS_CHANGE:
      return `Status cambiato: ${details.from} → ${details.to}`;
    case ScoutingEnums.Actions.PROMOTE_TO_TARGET:
      return `Promosso a Target di mercato${details.targetId ? ` (${details.targetId})` : ''}`;
    case ScoutingEnums.Actions.REPORT_ADDED:
      return `Report aggiunto${details.matchDate ? ` (${details.matchDate})` : ''}`;
    case ScoutingEnums.Actions.ADDED_TO_SHORTLIST:
      return `Aggiunto a shortlist "${details.shortlistName || 'sconosciuta'}"`;
    case ScoutingEnums.Actions.REMOVED_FROM_SHORTLIST:
      return `Rimosso da shortlist "${details.shortlistName || 'sconosciuta'}"`;
    default:
      return details.description || action;
  }
};

module.exports = {
  log,
  getByProspect,
  formatDescription,
};

