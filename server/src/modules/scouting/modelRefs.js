/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Model References (Prisma)
 * ===============================================================
 * 
 * Questo file contiene i riferimenti ai modelli Prisma reali
 * utilizzati nel modulo Scouting Enterprise.
 * 
 * ⚠️ IMPORTANTE:
 * - NON inventare nomi di modelli
 * - Usa SOLO i modelli definiti in schema.prisma
 * - Verifica sempre i nomi esatti prima di usarli
 */

// Usa il Prisma Client condiviso configurato con l'URL corretto (pooler/ssl)
const { getPrismaClient } = require('../../config/database');
const prisma = getPrismaClient();

/**
 * Riferimenti ai modelli Prisma per il modulo Scouting
 * 
 * MAPPING TABELLE → MODELLI (NUOVO SCHEMA scout_*):
 * - scout_prospects              → ScoutProspect
 * - scout_reports                → ScoutReport
 * - scout_sessions               → ScoutSession
 * - scout_evaluations            → ScoutEvaluation
 * - scout_followups              → ScoutFollowUp
 * - scout_event_logs             → ScoutEventLog
 * - scout_watchlists             → ScoutWatchlist
 * - scout_agents                 → ScoutAgent
 */
const ScoutingModels = {
  // ============ MODELLI PRINCIPALI SCOUTING (NUOVO SCHEMA) ============
  
  /** Prospect: Giocatore in osservazione (Tabella: scout_prospects) */
  Prospect: prisma.scoutProspect,

  /** Report: Report di osservazione (Tabella: scout_reports) */
  Report: prisma.scoutReport,

  /** Session: Sessione di osservazione (Tabella: scout_sessions) */
  Session: prisma.scoutSession,

  /** Formation: Formazione tattica (Tabella: scout_formations) */
  Formation: prisma.scoutFormation,

  /** Evaluation: Valutazione DS (Tabella: scout_evaluations) */
  Evaluation: prisma.scoutEvaluation,

  /** FollowUp: Task di follow-up (Tabella: scout_followups) */
  FollowUp: prisma.scoutFollowUp,

  /** EventLog: Cronologia eventi (Tabella: scout_event_logs) */
  EventLog: prisma.scoutEventLog,

  /** Watchlist: Lista personale scout (Tabella: scout_watchlists) */
  Watchlist: prisma.scoutWatchlist,

  /** Agent: Agente/Procuratore (Tabella: scout_agents) */
  Agent: prisma.scoutAgent,

  // ============ MODELLI MARKET (per integrazione) ============
  
  /** Target: Obiettivo di mercato (Tabella: market_targets) */
  Target: prisma.market_target,

  /** Negotiation: Trattativa di mercato (Tabella: market_negotiations) */
  Negotiation: prisma.market_negotiation,

  /** Offer: Offerta di mercato (Tabella: market_offers) */
  Offer: prisma.market_offer,

  /** Team: Squadra (multi-tenancy) */
  Team: prisma.team,

  /** UserProfile: Profilo utente */
  UserProfile: prisma.userProfile,
};

/**
 * Enumerazioni per Scouting
 */
const ScoutingEnums = {
  /** Stati del prospect nel funnel di scouting */
  Status: {
    DISCOVERY: 'DISCOVERY',
    MONITORING: 'MONITORING',
    ANALYZED: 'ANALYZED',
    EVALUATED: 'EVALUATED',
    TARGETED: 'TARGETED',
    SIGNED: 'SIGNED',
    REJECTED: 'REJECTED',
    ARCHIVED: 'ARCHIVED',
  },

  /** Azioni per EventLog */
  Actions: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    STATUS_CHANGE: 'STATUS_CHANGE',
    PROMOTE_TO_TARGET: 'PROMOTE_TO_TARGET',
    REPORT_ADDED: 'REPORT_ADDED',
    ADDED_TO_SHORTLIST: 'ADDED_TO_SHORTLIST',
    REMOVED_FROM_SHORTLIST: 'REMOVED_FROM_SHORTLIST',
  },
};

/**
 * Include options standard per query comuni
 */
const ScoutingIncludes = {
  /** Include per Prospect con relazioni principali */
  prospectDetail: {
    agent: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
      },
    },
    reports: {
      take: 5,
      orderBy: { matchDate: 'desc' },
      select: {
        id: true,
        matchDate: true,
        opponent: true,
        competition: true,
        totalScore: true,
        summary: true,
      },
    },
    eventLogs: {
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        description: true,
        fromStatus: true,
        toStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    },
  },

  /** Include minimo per liste */
  prospectList: {
    agent: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },

  /** Include per Report con prospect */
  reportWithProspect: {
    prospect: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mainPosition: true,
        currentClub: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    },
  },

  /** Include per Watchlist con items */
  watchlistWithItems: {
    prospect: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mainPosition: true,
        currentClub: true,
        status: true,
        potentialScore: true,
      },
    },
  },
};

module.exports = {
  ScoutingModels,
  ScoutingEnums,
  ScoutingIncludes,
  prisma,
};

