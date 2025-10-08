// server/src/services/market/negotiationsService.js
// Service per la gestione delle trattative di mercato

const { getPrismaClient } = require('../../config/database');
const prisma = getPrismaClient();

/**
 * Ottieni tutte le trattative del team con filtri
 */
const getAll = async (teamId, filters = {}) => {
  const { search, status, stage, targetId, agentId } = filters;

  const where = {
    teamId,
    ...(status && { status }),
    ...(stage && { stage }),
    ...(targetId && { targetId: Number(targetId) }),
    // ...(agentId && { agentId: Number(agentId) }),
    ...(search && {
      OR: [
        { player_first_name: { contains: search, mode: 'insensitive' } },
        { player_last_name: { contains: search, mode: 'insensitive' } },
        { counterpart: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  return prisma.market_negotiation.findMany({
    where,
    include: {
      target: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          position: true,
          current_club: true,
        },
      },
      // agent: {
      //   select: {
      //     id: true,
      //     first_name: true,
      //     last_name: true,
      //     agency: true,
      //   },
      // },
      _count: {
        select: {
          market_offer: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Ottieni una trattativa per ID con tutte le relazioni
 */
const getById = async (id, teamId) => {
  const negotiation = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
    include: {
      target: true,
      agent: true,
      market_offer: {
        orderBy: { createdAt: 'desc' },
      },
      signed_player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  return negotiation;
};

/**
 * Crea una nuova trattativa
 */
const create = async (teamId, userId, data) => {
  // Verifica che il target appartenga al team
  if (data.targetId) {
    const target = await prisma.market_target.findFirst({
      where: { id: Number(data.targetId), teamId },
    });
    if (!target) {
      throw new Error('Target not found for this team');
    }
  }

  // Verifica che l'agente appartenga al team (se specificato)
  // if (data.agentId) {
  //   const agent = await prisma.market_agent.findFirst({
  //     where: { id: Number(data.agentId), teamId },
  //   });
  //   if (!agent) {
  //     throw new Error('Agent not found for this team');
  //   }
  // }

  return prisma.market_negotiation.create({
    data: {
      teamId,
      created_by: userId,
      targetId: data.targetId ? Number(data.targetId) : null,
      // agentId: data.agentId ? Number(data.agentId) : null,
      stage: data.stage || 'SCOUTING',
      status: data.status || 'OPEN',
      priority: data.priority || 'MEDIUM',
      counterpart: data.counterpart || null,
      notes: data.notes || null,
      player_first_name: data.player_first_name,
      player_last_name: data.player_last_name,
      player_nationality: data.player_nationality || null,
      player_position: data.player_position || null,
      player_age: data.player_age ? Number(data.player_age) : null,
      player_snapshot: data.player_snapshot || null,
      requested_fee: data.requested_fee || null,
      requested_salary_net: data.requested_salary_net || null,
      requested_salary_gross: data.requested_salary_gross || null,
      requested_salary_company: data.requested_salary_company || null,
      requested_currency: data.requested_currency || data.currency || 'EUR',
      agent_commission_fee: data.agent_commission_fee || null,
      bonus_signing_fee: data.bonus_signing_fee || null,
      bonus_performance: data.bonus_performance || null,
      budget_effect_transfer: data.budget_effect_transfer || null,
      budget_effect_wage: data.budget_effect_wage || null,
      budget_effect_commission: data.budget_effect_commission || null,
      budget_included: data.budget_included || false,
    },
    include: {
      target: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      agent: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });
};

/**
 * Aggiorna una trattativa esistente
 */
const update = async (id, teamId, data) => {
  // Verifica che la trattativa appartenga al team
  const existing = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Negotiation not found');
  }

  const updateData = {};

  // Pipeline e stato
  if ('stage' in data) updateData.stage = data.stage;
  if ('status' in data) updateData.status = data.status;
  if ('priority' in data) updateData.priority = data.priority;
  if ('outcome' in data) updateData.outcome = data.outcome || null;
  if ('counterpart' in data) updateData.counterpart = data.counterpart || null;
  if ('notes' in data) updateData.notes = data.notes || null;

  // Relazioni
  if ('targetId' in data) updateData.targetId = data.targetId ? Number(data.targetId) : null;
  // if ('agentId' in data) updateData.agentId = data.agentId ? Number(data.agentId) : null;

  // Dati giocatore
  if ('player_first_name' in data) updateData.player_first_name = data.player_first_name;
  if ('player_last_name' in data) updateData.player_last_name = data.player_last_name;
  if ('player_nationality' in data) updateData.player_nationality = data.player_nationality || null;
  if ('player_position' in data) updateData.player_position = data.player_position || null;
  if ('player_age' in data) updateData.player_age = data.player_age ? Number(data.player_age) : null;
  if ('player_snapshot' in data) updateData.player_snapshot = data.player_snapshot || null;

  // Valori economici
  if ('requested_fee' in data) updateData.requested_fee = data.requested_fee || null;
  if ('requested_salary_net' in data) updateData.requested_salary_net = data.requested_salary_net || null;
  if ('requested_salary_gross' in data) updateData.requested_salary_gross = data.requested_salary_gross || null;
  if ('requested_salary_company' in data) updateData.requested_salary_company = data.requested_salary_company || null;
  if ('currency' in data) updateData.requested_currency = data.currency;
  if ('requested_currency' in data) updateData.requested_currency = data.requested_currency;
  if ('agent_commission_fee' in data) updateData.agent_commission_fee = data.agent_commission_fee || null;
  if ('bonus_signing_fee' in data) updateData.bonus_signing_fee = data.bonus_signing_fee || null;
  if ('bonus_performance' in data) updateData.bonus_performance = data.bonus_performance || null;

  // Budget
  if ('budget_effect_transfer' in data) updateData.budget_effect_transfer = data.budget_effect_transfer || null;
  if ('budget_effect_wage' in data) updateData.budget_effect_wage = data.budget_effect_wage || null;
  if ('budget_effect_commission' in data) updateData.budget_effect_commission = data.budget_effect_commission || null;
  if ('budget_included' in data) updateData.budget_included = Boolean(data.budget_included);

  return prisma.market_negotiation.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      target: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      agent: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });
};

/**
 * Chiudi una trattativa
 */
const close = async (id, teamId, userId) => {
  const existing = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Negotiation not found');
  }

  return prisma.market_negotiation.update({
    where: { id: Number(id) },
    data: {
      status: 'CLOSED',
      closed_by: userId,
      closed_date: new Date(),
    },
  });
};

/**
 * Elimina (soft delete) una trattativa
 */
const remove = async (id, teamId) => {
  const existing = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Negotiation not found');
  }

  // Soft delete: imposta status a CLOSED e outcome a CANCELLED
  return prisma.market_negotiation.update({
    where: { id: Number(id) },
    data: {
      status: 'CLOSED',
      outcome: 'CANCELLED',
      closed_date: new Date(),
    },
  });
};

/**
 * Converti trattativa in Player
 */
const convertToPlayer = async (id, teamId, userId) => {
  const negotiation = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  if (negotiation.signed_player_id) {
    throw new Error('Negotiation already converted to player');
  }

  // TODO: Implementare la logica di conversione in Player
  // Per ora lanciamo un errore che indica che va implementata
  throw new Error('Player conversion not yet implemented');
};

/**
 * Aggiorna lo stage della trattativa
 */
const updateStage = async (id, teamId, nextStage) => {
  const existing = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Negotiation not found');
  }

  return prisma.market_negotiation.update({
    where: { id: Number(id) },
    data: { stage: nextStage },
  });
};

/**
 * Calcola l'impatto sul budget di una trattativa
 */
const calculateBudgetImpact = async (id, teamId) => {
  const negotiation = await prisma.market_negotiation.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  // Calcolo semplificato
  const transferEffect = negotiation.requested_fee || 0;
  const wageEffect = negotiation.requested_salary_company || negotiation.requested_salary_gross || 0;
  const commissionEffect = negotiation.agent_commission_fee || 0;

  return {
    transfer: transferEffect,
    wage: wageEffect,
    commission: commissionEffect,
    total: Number(transferEffect) + Number(wageEffect) + Number(commissionEffect),
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  close,
  remove,
  convertToPlayer,
  updateStage,
  calculateBudgetImpact,
};

