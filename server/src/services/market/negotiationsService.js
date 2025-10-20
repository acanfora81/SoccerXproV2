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
    select: {
      id: true,
      stage: true,
      status: true,
      priority: true,
      counterpart: true,
      notes: true,
      player_first_name: true,
      player_last_name: true,
      player_snapshot: true,
      requested_fee: true,
      requested_salary_net: true,
      requested_salary_gross: true,
      requested_salary_company: true,
      requested_currency: true,
      requested_contract_years: true,
      tax_profile_id: true,
      agent_commission_fee: true,
      agent_commission_type: true,
      agent_commission_notes: true,
      bonus_signing_fee: true,
      bonus_performance: true,
      budget_effect_transfer: true,
      budget_effect_wage: true,
      budget_effect_commission: true,
      budget_included: true,
      outcome: true,
      next_action_date: true,
      closed_by: true,
      closed_date: true,
      created_by: true,
      conversion_prompt_at: true,
      conversion_confirmed_at: true,
      auto_create_player: true,
      createdAt: true,
      updatedAt: true,
      // Campi prima offerta
      first_offer_fee: true,
      first_offer_salary_net: true,
      first_offer_salary_gross: true,
      first_offer_salary_company: true,
      // Campi ultima controfferta
      last_counteroffer_fee: true,
      last_counteroffer_salary_net: true,
      last_counteroffer_salary_gross: true,
      last_counteroffer_salary_company: true,
      signed_player_id: true,
      target: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          position: true,
          current_club: true,
          nationality: true,
          date_of_birth: true,
          overall_rating: true,
          potential_rating: true,
          recommendation_level: true,
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

  // Priority mapping (frontend strings -> numeric scale)
  const priorityMap = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
  const resolvedPriority = typeof data.priority === 'string'
    ? (priorityMap[data.priority] ?? 3)
    : (data.priority != null ? Number(data.priority) : 3);

  // Normalize numeric-like fields possibly coming as strings
  const toNumberOrNull = (v) => {
    if (v == null || v === '') return null;
    const s = String(v).replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  // Se si invia per la prima volta (OFFER_SENT), cattura snapshot prima offerta
  const setFirstOffer = (payload) => ({
    first_offer_fee: toNumberOrNull(payload.requested_fee),
    first_offer_salary_net: toNumberOrNull(payload.requested_salary_net),
    first_offer_salary_gross: toNumberOrNull(payload.requested_salary_gross),
    first_offer_salary_company: toNumberOrNull(payload.requested_salary_company),
  });

  return prisma.market_negotiation.create({
    data: {
      // Collega sempre il team (il campo teamId verrà valorizzato automaticamente)
      team: { connect: { id: teamId } },
      created_by: userId,
      // Se presente, collega il target (il campo targetId verrà valorizzato automaticamente)
      ...(data.targetId ? { target: { connect: { id: Number(data.targetId) } } } : {}),
      // agentId: data.agentId ? Number(data.agentId) : null,
      stage: data.stage || 'SCOUTING',
      status: data.status || 'OPEN',
      priority: resolvedPriority,
      counterpart: data.counterpart || null,
      notes: data.notes || null,
      player_first_name: data.player_first_name,
      player_last_name: data.player_last_name,
      // Salva extra nel payload snapshot per compatibilità con lo schema
      player_snapshot: data.player_snapshot || {
        nationality: data.player_nationality ?? null,
        position: data.player_position ?? null,
        age: data.player_age != null ? Number(data.player_age) : null,
        date_of_birth: data.player_date_of_birth ?? null,
      },
      requested_fee: toNumberOrNull(data.requested_fee),
      requested_salary_net: toNumberOrNull(data.requested_salary_net),
      requested_salary_gross: toNumberOrNull(data.requested_salary_gross),
      requested_salary_company: toNumberOrNull(data.requested_salary_company),
      requested_currency: data.requested_currency || data.currency || 'EUR',
      agent_commission_fee: toNumberOrNull(data.agent_commission_fee),
      bonus_signing_fee: toNumberOrNull(data.bonus_signing_fee),
      bonus_performance: toNumberOrNull(data.bonus_performance),
      budget_effect_transfer: toNumberOrNull(data.budget_effect_transfer),
      budget_effect_wage: toNumberOrNull(data.budget_effect_wage),
      budget_effect_commission: toNumberOrNull(data.budget_effect_commission),
      budget_included: data.budget_included || false,
      ...(data.stage === 'OFFER_SENT' ? setFirstOffer(data) : {}),
    },
    include: {
      target: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      // agent relation currently disabled in schema for create include
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

  // Normalizzatore numerico usato in tutto l'update
  const toNumberOrNull = (v) => {
    if (v == null || v === '') return null;
    const s = String(v).replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  // Pipeline e stato
  if ('stage' in data) updateData.stage = data.stage;
  if ('status' in data) updateData.status = data.status;
  if ('priority' in data) updateData.priority = data.priority;
  if ('outcome' in data) updateData.outcome = data.outcome || null;
  if ('counterpart' in data) updateData.counterpart = data.counterpart || null;
  if ('notes' in data) updateData.notes = data.notes || null;

  // Relazioni
  if ('targetId' in data) {
    if (data.targetId) {
      updateData.target = { connect: { id: Number(data.targetId) } };
    } else {
      // Per Prisma v6 nelle relazioni required non è consentito disconnect:
      // settiamo a null il foreign key se opzionale, oppure omettiamo l'aggiornamento
      updateData.target = { disconnect: undefined };
    }
  }
  // if ('agentId' in data) updateData.agent = data.agentId ? { connect: { id: Number(data.agentId) } } : undefined;

  // Dati giocatore
  if ('player_first_name' in data) updateData.player_first_name = data.player_first_name;
  if ('player_last_name' in data) updateData.player_last_name = data.player_last_name;
  if ('player_snapshot' in data) updateData.player_snapshot = data.player_snapshot || null;
  
  // Aggiorna player_snapshot se vengono modificati i campi del giocatore
  if ('player_nationality' in data || 'player_position' in data || 'player_age' in data || 'player_date_of_birth' in data) {
    const currentSnapshot = existing.player_snapshot || {};
    updateData.player_snapshot = {
      ...currentSnapshot,
      ...(data.player_nationality !== undefined && { nationality: data.player_nationality }),
      ...(data.player_position !== undefined && { position: data.player_position }),
      ...(data.player_age !== undefined && { age: data.player_age != null ? Number(data.player_age) : null }),
      ...(data.player_date_of_birth !== undefined && { date_of_birth: data.player_date_of_birth }),
    };
  }

  // Valori economici (normalizzati)
  if ('requested_fee' in data) updateData.requested_fee = toNumberOrNull(data.requested_fee);
  if ('requested_salary_net' in data) updateData.requested_salary_net = toNumberOrNull(data.requested_salary_net);
  if ('requested_salary_gross' in data) updateData.requested_salary_gross = toNumberOrNull(data.requested_salary_gross);
  if ('requested_salary_company' in data) updateData.requested_salary_company = toNumberOrNull(data.requested_salary_company);
  
  // (definizione spostata in alto)

  // Se si passa a OFFER_SENT, aggiorna sempre la prima offerta (per gestire i "torni indietro")
  if (data.stage === 'OFFER_SENT') {
    updateData.first_offer_fee = toNumberOrNull(data.requested_fee);
    updateData.first_offer_salary_net = toNumberOrNull(data.requested_salary_net);
    updateData.first_offer_salary_gross = toNumberOrNull(data.requested_salary_gross);
    updateData.first_offer_salary_company = toNumberOrNull(data.requested_salary_company);
  }

  // Se si passa a COUNTEROFFER, aggiorna sempre l'ultima controfferta
  if (data.stage === 'COUNTEROFFER') {
    updateData.last_counteroffer_fee = toNumberOrNull(data.requested_fee);
    updateData.last_counteroffer_salary_net = toNumberOrNull(data.requested_salary_net);
    updateData.last_counteroffer_salary_gross = toNumberOrNull(data.requested_salary_gross);
    updateData.last_counteroffer_salary_company = toNumberOrNull(data.requested_salary_company);
  }
  if ('currency' in data) updateData.requested_currency = data.currency;
  if ('requested_currency' in data) updateData.requested_currency = data.requested_currency;
  if ('agent_commission_fee' in data) updateData.agent_commission_fee = toNumberOrNull(data.agent_commission_fee);
  if ('bonus_signing_fee' in data) updateData.bonus_signing_fee = toNumberOrNull(data.bonus_signing_fee);
  if ('bonus_performance' in data) updateData.bonus_performance = toNumberOrNull(data.bonus_performance);

  // Budget (normalizzati)
  if ('budget_effect_transfer' in data) updateData.budget_effect_transfer = toNumberOrNull(data.budget_effect_transfer);
  if ('budget_effect_wage' in data) updateData.budget_effect_wage = toNumberOrNull(data.budget_effect_wage);
  if ('budget_effect_commission' in data) updateData.budget_effect_commission = toNumberOrNull(data.budget_effect_commission);
  if ('budget_included' in data) updateData.budget_included = Boolean(data.budget_included);

  // Validazione soft per DECIMAL(12,2)
  const DECIMAL_MAX = 1e10; // 10^10 limite assoluto
  Object.keys(updateData).forEach((k) => {
    const v = updateData[k];
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) updateData[k] = null;
      else if (Math.abs(v) >= DECIMAL_MAX) {
        throw new Error(`Validation: il campo ${k} supera il massimo consentito (9.999.999.999,99)`);
      }
    }
  });

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
      outcome: 'SUCCESS',
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
    include: {
      target: true
    }
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  if (negotiation.signed_player_id) {
    throw new Error('Negotiation already converted to player');
  }

  if (negotiation.status !== 'CLOSED') {
    throw new Error('Negotiation must be closed before converting to player');
  }

  // Estrai i dati del giocatore dalla trattativa e dal target
  const playerData = {
    firstName: negotiation.player_first_name || negotiation.target?.first_name,
    lastName: negotiation.player_last_name || negotiation.target?.last_name,
    dateOfBirth: negotiation.target?.date_of_birth,
    nationality: negotiation.target?.nationality,
    position: negotiation.target?.position,
    height: negotiation.target?.height_cm ? negotiation.target.height_cm / 100 : null, // Converti cm in metri
    weight: negotiation.target?.weight_kg,
    preferredFoot: negotiation.target?.foot,
    teamId: teamId,
    createdById: userId
  };

  // Verifica che abbiamo i dati essenziali
  if (!playerData.firstName || !playerData.lastName || !playerData.dateOfBirth || !playerData.nationality || !playerData.position) {
    throw new Error('Missing essential player data for conversion');
  }

  // Trova l'ID numerico del UserProfile dall'UUID
  const userProfile = await prisma.userProfile.findFirst({
    where: { auth_user_id: userId }
  });
  
  if (!userProfile) {
    throw new Error('User profile not found');
  }

  // Crea il nuovo giocatore
  const newPlayer = await prisma.player.create({
    data: {
      ...playerData,
      createdById: userProfile.id
    }
  });

  // Aggiorna la trattativa per collegare il giocatore creato
  const updatedNegotiation = await prisma.market_negotiation.update({
    where: { id: Number(id) },
    data: {
      signed_player_id: newPlayer.id,
      outcome: 'SUCCESS'
    },
    include: {
      target: true
    }
  });

  return {
    negotiation: updatedNegotiation,
    player: newPlayer
  };
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

