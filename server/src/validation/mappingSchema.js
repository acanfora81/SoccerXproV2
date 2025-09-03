// server/src/validation/mappingSchema.js
const { z } = require('zod');

// mapping atteso: { "CSV Header": { dbField: string, ... } }
const MappingField = z.object({ dbField: z.string().min(1) }).passthrough();
const MappingSchema = z.record(MappingField);

function validateMapping(mapping) {
  const raw = mapping?.mapping ? mapping.mapping : mapping;
  const parsed = MappingSchema.safeParse(raw);
  if (!parsed.success) {
    const err = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid mapping schema: ${err}`);
  }
  return parsed.data;
}

module.exports = { validateMapping };
