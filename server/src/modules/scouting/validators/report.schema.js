/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Report Validators
 * ===============================================================
 */

const { z } = require('zod');
const {
  uuidSchema,
  scoreSchema,
  longTextSchema,
  urlSchema,
  listQuerySchema,
  optionalUuidSchema,
} = require('./common');

const createReportSchema = z.object({
  prospectId: uuidSchema,
  matchDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  opponent: z.string().max(200).optional().nullable(),
  competition: z.string().max(200).optional().nullable(),
  rolePlayed: z.string().max(100).optional().nullable(),
  minutesPlayed: z.number().int().min(0).max(120).optional().nullable(),
  techniqueScore: scoreSchema,
  tacticsScore: scoreSchema,
  physicalScore: scoreSchema,
  mentalityScore: scoreSchema,
  totalScore: scoreSchema,
  summary: longTextSchema,
  videoLink: urlSchema,
  attachmentUrl: urlSchema,
}).strict();

const updateReportSchema = z.object({
  matchDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  opponent: z.string().max(200).optional().nullable(),
  competition: z.string().max(200).optional().nullable(),
  rolePlayed: z.string().max(100).optional().nullable(),
  minutesPlayed: z.number().int().min(0).max(120).optional().nullable(),
  techniqueScore: scoreSchema,
  tacticsScore: scoreSchema,
  physicalScore: scoreSchema,
  mentalityScore: scoreSchema,
  totalScore: scoreSchema,
  summary: longTextSchema,
  videoLink: urlSchema,
  attachmentUrl: urlSchema,
}).strict();

const listReportsSchema = listQuerySchema.extend({
  prospectId: optionalUuidSchema,
  matchDateFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  matchDateTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  competition: z.string().max(200).optional(),
  minTotalScore: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)).pipe(z.number().min(0).max(10).optional()),
  maxTotalScore: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)).pipe(z.number().min(0).max(10).optional()),
  orderBy: z.enum(['createdAt', 'matchDate', 'totalScore', 'updatedAt']).default('matchDate').optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc').optional(),
});

const reportIdSchema = z.object({
  id: uuidSchema,
});

const calculateTotalScore = (techniqueScore, tacticsScore, physicalScore, mentalityScore) => {
  const scores = [techniqueScore, tacticsScore, physicalScore, mentalityScore].filter((s) => s != null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 100) / 100;
};

module.exports = {
  createReportSchema,
  updateReportSchema,
  listReportsSchema,
  reportIdSchema,
  calculateTotalScore,
};

