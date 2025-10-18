const { z } = require('zod');

const listSessionsSchema = z.object({
  prospectId: z.string().uuid().optional(),
  q: z.string().optional(),
  observationType: z.enum(['LIVE', 'VIDEO', 'TRAINING', 'TOURNAMENT']).optional(),
  rolePlayed: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
});

const createSessionSchema = z.object({
  prospectId: z.string().uuid(),
  observationType: z.enum(['LIVE', 'VIDEO', 'TRAINING', 'TOURNAMENT']).optional(),
  dateObserved: z.string().datetime().optional().or(z.string().min(1).optional()),
  location: z.string().optional(),
  opponent: z.string().optional(),
  competition: z.string().optional(),
  minutesPlayed: z.coerce.number().int().optional(),
  rolePlayed: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().optional(),
  prospectTeamSide: z.enum(['HOME', 'AWAY']).optional(),
});

const updateSessionSchema = z.object({
  prospectId: z.string().uuid().optional(),
  observationType: z.enum(['LIVE', 'VIDEO', 'TRAINING', 'TOURNAMENT']).optional(),
  dateObserved: z.string().datetime().optional().or(z.string().min(1).optional()),
  location: z.string().optional(),
  opponent: z.string().optional(),
  competition: z.string().optional(),
  minutesPlayed: z.coerce.number().int().optional(),
  rolePlayed: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().optional(),
  prospectTeamSide: z.enum(['HOME', 'AWAY']).optional(),
});

const sessionIdSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  listSessionsSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionIdSchema,
};




