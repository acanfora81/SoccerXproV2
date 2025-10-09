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
  birthDate: birthDateSchema,
  nationality: nationalitySchema,
  position: positionSchema,
  secondaryPosition: positionSchema,
  preferredFoot: preferredFootSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
  currentClub: z.string().max(200).optional().nullable(),
  contractUntil: contractDateSchema,
  agentId: optionalUuidSchema,
  marketValue: marketValueSchema,
  potentialScore: potentialScoreSchema,
  scoutingStatus: scoutingStatusSchema.default('DISCOVERY'),
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
  nationality: nationalitySchema,
  position: positionSchema,
  secondaryPosition: positionSchema,
  preferredFoot: preferredFootSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
  currentClub: z.string().max(200).optional().nullable(),
  contractUntil: contractDateSchema,
  agentId: optionalUuidSchema,
  marketValue: marketValueSchema,
  potentialScore: potentialScoreSchema,
  scoutingStatus: scoutingStatusSchema.optional(),
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
  position: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  nationality: z
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
  targetNotes: longTextSchema,
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
    data.potentialScore != null &&
    data.marketValue != null &&
    data.potentialScore > 80 &&
    data.marketValue < 1_000_000
  ) {
    errors.push('Potential score > 80 richiede market value >= 1M');
  }

  if (data.scoutingStatus === 'TARGETED' && (!data.potentialScore || data.potentialScore < 60)) {
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

