// server/src/services/market/budgetsService.js
// Service per la gestione dei budget di mercato

const { getPrismaClient } = require('../../config/database');
const prisma = getPrismaClient();

/**
 * Ottieni tutti i budget del team con filtri
 */
const getAll = async (teamId, filters = {}) => {
  const { season_label, type } = filters;

  const where = {
    teamId,
    ...(season_label && { season_label }),
    ...(type && { type }),
  };

  return prisma.market_budget.findMany({
    where,
    orderBy: [
      { season_label: 'desc' },
      { type: 'asc' },
    ],
  });
};

/**
 * Ottieni un budget per ID
 */
const getById = async (id, teamId) => {
  const budget = await prisma.market_budget.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  return budget;
};

/**
 * Crea un nuovo budget
 */
const create = async (teamId, userId, data) => {
  // Verifica univocità: teamId + season_label + type
  const existing = await prisma.market_budget.findFirst({
    where: {
      teamId,
      season_label: data.season_label,
      type: data.type,
    },
  });

  if (existing) {
    throw new Error(`Budget già esistente per ${data.season_label} - ${data.type}`);
  }

  return prisma.market_budget.create({
    data: {
      teamId,
      season_label: data.season_label,
      type: data.type || 'PREVENTIVO',
      transfer_budget: data.transfer_budget || '0',
      wage_budget: data.wage_budget || '0',
      commission_budget: data.commission_budget || '0',
      committed_fees: data.committed_fees || '0',
      committed_wages: data.committed_wages || '0',
      committed_commissions: data.committed_commissions || '0',
      currency: data.currency || 'EUR',
    },
  });
};

/**
 * Aggiorna un budget esistente
 */
const update = async (id, teamId, data) => {
  // Verifica che il budget appartenga al team
  const existing = await prisma.market_budget.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Budget not found');
  }

  const updateData = {};

  // Identificativi
  if ('season_label' in data) updateData.season_label = data.season_label;
  if ('type' in data) updateData.type = data.type;

  // Budget allocati
  if ('transfer_budget' in data) updateData.transfer_budget = data.transfer_budget || '0';
  if ('wage_budget' in data) updateData.wage_budget = data.wage_budget || '0';
  if ('commission_budget' in data) updateData.commission_budget = data.commission_budget || '0';

  // Committed (impegnati)
  if ('committed_fees' in data) updateData.committed_fees = data.committed_fees || '0';
  if ('committed_wages' in data) updateData.committed_wages = data.committed_wages || '0';
  if ('committed_commissions' in data) updateData.committed_commissions = data.committed_commissions || '0';

  // Valuta
  if ('currency' in data) updateData.currency = data.currency;

  return prisma.market_budget.update({
    where: { id: Number(id) },
    data: updateData,
  });
};

/**
 * Elimina definitivamente un budget
 */
const remove = async (id, teamId) => {
  // Verifica che il budget appartenga al team
  const existing = await prisma.market_budget.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Budget not found');
  }

  return prisma.market_budget.delete({
    where: { id: Number(id) },
  });
};

/**
 * Calcola il totale impegnato per un budget
 */
const calculateSpent = async (id, teamId) => {
  const budget = await prisma.market_budget.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  const committedFees = Number(budget.committed_fees || 0);
  const committedWages = Number(budget.committed_wages || 0);
  const committedCommissions = Number(budget.committed_commissions || 0);

  return {
    transfer: committedFees,
    wage: committedWages,
    commission: committedCommissions,
    total: committedFees + committedWages + committedCommissions,
  };
};

/**
 * Calcola il budget rimanente
 */
const calculateRemaining = async (id, teamId) => {
  const budget = await prisma.market_budget.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  const transferRemaining = Number(budget.transfer_budget || 0) - Number(budget.committed_fees || 0);
  const wageRemaining = Number(budget.wage_budget || 0) - Number(budget.committed_wages || 0);
  const commissionRemaining = Number(budget.commission_budget || 0) - Number(budget.committed_commissions || 0);
  const totalBudget = Number(budget.transfer_budget || 0) + Number(budget.wage_budget || 0) + Number(budget.commission_budget || 0);
  const totalCommitted = Number(budget.committed_fees || 0) + Number(budget.committed_wages || 0) + Number(budget.committed_commissions || 0);

  return {
    transfer: transferRemaining,
    wage: wageRemaining,
    commission: commissionRemaining,
    total: totalBudget - totalCommitted,
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  calculateSpent,
  calculateRemaining,
};
