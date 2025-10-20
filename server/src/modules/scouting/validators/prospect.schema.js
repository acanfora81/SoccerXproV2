/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Prospect Validators
 * ===============================================================
 */

const { z } = require('zod');
const {
  nameSchema,
  nationalitySchema,
  positionSchema,
  preferredFootSchema,
  heightSchema,
  weightSchema,
  birthDateSchema,
  contractDateSchema,
  marketValueSchema,
  potentialScoreSchema,
  longTextSchema,
  scoutingStatusSchema,
  optionalUuidSchema,
  listQuerySchema,
  uuidSchema,
} = require('./common');

/**
 * Schema per creazione Prospect
 */
const createProspectSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  fullName: z.string().max(200).optional().nullable(),
  birthDate: birthDateSchema.optional().nullable(),
  birthPlace: z.string().max(200).optional().nullable(),
  nationalityPrimary: nationalitySchema,
  nationalities: z.array(z.string()).optional().nullable(),
  euStatus: z.enum(['EU', 'NON_EU', 'EFTA', 'UK']).optional().nullable(),
  preferredFoot: preferredFootSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
  wingspanCm: z.number().int().min(100).max(300).optional().nullable(),
  mainPosition: positionSchema.optional(),
  secondaryPositions: z.array(positionSchema).optional().nullable(),
  roleTags: z.array(z.string()).optional().nullable(),
  currentClub: z.string().max(200).optional().nullable(),
  currentLeague: z.string().max(200).optional().nullable(),
  countryClub: z.string().max(200).optional().nullable(),
  contractType: z.enum(['PRO', 'YOUTH', 'AMATEUR', 'FREE_AGENT']).optional().nullable(),
  contractUntil: contractDateSchema.optional().nullable(),
  marketValue: marketValueSchema,
  releaseClause: z.number().min(0).optional().nullable(),
  sellOnClausePct: z.number().min(0).max(100).optional().nullable(),
  agentId: optionalUuidSchema,
  overallScore: z.number().min(0).max(100).optional().nullable(),
  potentialScore: potentialScoreSchema,
  riskIndex: z.number().min(0).max(1).optional().nullable(), // Manteniamo 0-1 nel backend per compatibilità
  status: scoutingStatusSchema.default('DISCOVERY'),
  statusReason: z.string().max(500).optional().nullable(),
  playerId: z.number().int().optional().nullable(),
  targetId: z.number().int().optional().nullable(),
  externalRefs: z.record(z.string(), z.string()).optional().nullable(),
  notes: longTextSchema,
}).strict();

/**
 * Schema per aggiornamento Prospect
 */
const updateProspectSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  fullName: z.string().max(200).optional().nullable(),
  birthDate: birthDateSchema,
  birthPlace: z.string().max(200).optional().nullable(),
  nationalityPrimary: nationalitySchema,
  nationalities: z.array(z.string()).optional().nullable(),
  euStatus: z.enum(['EU', 'NON_EU', 'EFTA', 'UK']).optional().nullable(),
  preferredFoot: preferredFootSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
  wingspanCm: z.number().int().min(100).max(300).optional().nullable(),
  mainPosition: positionSchema.optional(),
  secondaryPositions: z.array(positionSchema).optional().nullable(),
  roleTags: z.array(z.string()).optional().nullable(),
  currentClub: z.string().max(200).optional().nullable(),
  currentLeague: z.string().max(200).optional().nullable(),
  countryClub: z.string().max(200).optional().nullable(),
  contractType: z.enum(['PRO', 'YOUTH', 'AMATEUR', 'FREE_AGENT']).optional().nullable(),
  contractUntil: contractDateSchema,
  marketValue: marketValueSchema,
  releaseClause: z.number().min(0).optional().nullable(),
  sellOnClausePct: z.number().min(0).max(100).optional().nullable(),
  agentId: optionalUuidSchema,
  overallScore: z.number().min(0).max(100).optional().nullable(),
  potentialScore: potentialScoreSchema,
  riskIndex: z.number().min(0).max(1).optional().nullable(), // Manteniamo 0-1 nel backend per compatibilità
  status: scoutingStatusSchema.optional(),
  statusReason: z.string().max(500).optional().nullable(),
  playerId: z.number().int().optional().nullable(),
  targetId: z.number().int().optional().nullable(),
  externalRefs: z.record(z.string(), z.string()).optional().nullable(),
  notes: longTextSchema,
}).strict();

/**
 * Schema per lista Prospects
 */
const listProspectsSchema = listQuerySchema.extend({
  status: z
    .union([scoutingStatusSchema, z.array(scoutingStatusSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  mainPosition: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  nationalityPrimary: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  agentId: optionalUuidSchema,
  minPotentialScore: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(100).optional()),
  maxPotentialScore: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(100).optional()),
  minMarketValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  maxMarketValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  orderBy: z
    .enum(['createdAt', 'updatedAt', 'lastName', 'potentialScore', 'marketValue', 'birthDate'])
    .default('updatedAt')
    .optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc').optional(),
});

/**
 * Schema per ID Prospect
 */
const prospectIdSchema = z.object({
  id: uuidSchema,
});

/**
 * Schema per promozione a Target
 */
const promoteToTargetSchema = z.object({
  targetPriority: z.number().int().min(1).max(5).optional(),
  targetNotes: longTextSchema.optional(),
  force: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean().default(false)),
});

/**
 * Validazione business rules
 */
const validateProspectBusinessRules = (data) => {
  const errors = [];

  if (data.contractUntil) {
    const contractDate = new Date(data.contractUntil);
    const today = new Date();
    if (contractDate < today) {
      errors.push('contractUntil deve essere una data futura');
    }
  }

  if (
    false
  ) {
    // legacy rule removed: potential > 80 requiring market value >= 1M
  }

  if (data.status === 'TARGETED' && (!data.potentialScore || data.potentialScore < 60)) {
    errors.push('Status TARGETED richiede potentialScore >= 60');
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  createProspectSchema,
  updateProspectSchema,
  listProspectsSchema,
  prospectIdSchema,
  promoteToTargetSchema,
  validateProspectBusinessRules,
};

