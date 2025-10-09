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

const { PrismaClient } = require('../../prisma/generated/client');

// Istanza Prisma condivisa
const prisma = new PrismaClient();

/**
 * Riferimenti ai modelli Prisma per il modulo Scouting
 * 
 * MAPPING TABELLE → MODELLI:
 * - market_scouting              → ScoutingProspect
 * - market_scouting_report       → ScoutingReport
 * - market_scouting_shortlist    → ScoutingShortlist
 * - market_scouting_shortlist_item → ScoutingShortlistItem
 * - market_scouting_event_log    → ScoutingEventLog
 * - market_agent                 → Agent
 */
const ScoutingModels = {
  // ============ MODELLI PRINCIPALI SCOUTING ============
  
  /** Prospect: Giocatore in osservazione (Tabella: market_scouting) */
  Prospect: prisma.scoutingProspect,

  /** Report: Report di osservazione (Tabella: market_scouting_report) */
  Report: prisma.scoutingReport,

  /** Shortlist: Lista personalizzata (Tabella: market_scouting_shortlist) */
  Shortlist: prisma.scoutingShortlist,

  /** ShortlistItem: Elemento shortlist (Tabella: market_scouting_shortlist_item) */
  ShortlistItem: prisma.scoutingShortlistItem,

  /** EventLog: Cronologia eventi (Tabella: market_scouting_event_log) */
  EventLog: prisma.scoutingEventLog,

  /** Agent: Agente/Procuratore (Tabella: market_agent) */
  Agent: prisma.agent,

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
    TARGETED: 'TARGETED',
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
    shortlistItems: {
      select: {
        id: true,
        priority: true,
        shortlist: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
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
        position: true,
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

  /** Include per Shortlist con items */
  shortlistWithItems: {
    items: {
      include: {
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            currentClub: true,
            scoutingStatus: true,
            potentialScore: true,
          },
        },
      },
      orderBy: { priority: 'asc' },
    },
  },
};

module.exports = {
  ScoutingModels,
  ScoutingEnums,
  ScoutingIncludes,
  prisma,
};

