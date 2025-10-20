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
    observed: z.boolean().optional().nullable(),
  })).superRefine((positions, ctx) => {
    // Regola: all'interno della stessa squadra, i numeri devono essere univoci
    // Nota: questo schema è valutato per un solo teamSide per volta
    const seen = new Set();
    for (const p of positions) {
      if (p.number == null) continue;
      const key = String(p.number);
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numeri di maglia duplicati nella stessa squadra non sono consentiti',
        });
        break;
      }
      seen.add(key);
    }
  }),
});

module.exports = {
  formationSchema,
};


