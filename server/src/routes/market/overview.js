// server/src/routes/market/overview.js
// server/src/routes/market/overview.js
const express = require('express');
const { getPrismaClient } = require('../../config/database');

const prisma = getPrismaClient();
const router = express.Router();

/**
 * GET /api/market/overview
 * Ritorna KPI base per la dashboard “Mercato”.
 */
router.get('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const [
      openNegotiations,
      totalTargets,
      offersDraft,
      offersSent,
      offersAccepted,
      lastBudget,
    ] = await Promise.all([
      prisma.market_negotiation.count({ where: { teamId, status: 'OPEN' } }),
      prisma.market_target.count({ where: { teamId } }),
      prisma.market_offer.count({ where: { teamId, status: 'DRAFT' } }),
      prisma.market_offer.count({ where: { teamId, status: 'SENT' } }),
      prisma.market_offer.count({ where: { teamId, status: 'ACCEPTED' } }),
      prisma.market_budget.findFirst({
        where: { teamId },
        orderBy: { season_label: 'desc' },
      }),
    ]);

    const budget = lastBudget
      ? {
          season: lastBudget.season_label,
          currency: lastBudget.currency,
          transferBudget: lastBudget.transfer_budget,
          wageBudget: lastBudget.wage_budget,
          committedFees: lastBudget.committed_fees,
          committedWages: lastBudget.committed_wages,
          transferBudgetLeft:
            Number(lastBudget.transfer_budget) - Number(lastBudget.committed_fees || 0),
          wageBudgetLeft:
            Number(lastBudget.wage_budget) - Number(lastBudget.committed_wages || 0),
        }
      : null;

    return res.json({
      success: true,
      kpi: {
        openNegotiations,
        totalTargets,
        offers: { draft: offersDraft, sent: offersSent, accepted: offersAccepted },
        budget,
      },
    });
  } catch (err) {
    console.error('[market/overview] error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;


