const { z } = require('zod');

const formationSchema = z.object({
  teamSide: z.enum(['PROSPECT', 'OPPONENT']),
  formation: z.string().min(1),
  positions: z.array(z.object({
    role: z.string(),
    number: z.number().int().positive().nullable(),
    name: z.string().nullable(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })),
});

module.exports = {
  formationSchema,
};

