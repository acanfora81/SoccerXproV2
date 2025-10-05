// server/src/validation/mappingSchema.js
const { z } = require('zod');

// Schema permissivo: accetta qualsiasi oggetto con dbField
const MappingField = z.object({ 
  dbField: z.string().min(1)
}).passthrough(); // passthrough permette campi extra come csvHeader

const MappingSchema = z.record(z.string(), MappingField);

function validateMapping(mapping) {
  const candidate = mapping?.mapping ? mapping.mapping : mapping;
  
  // Validazione diretta con schema permissivo
  const parsed = MappingSchema.safeParse(candidate);
  
  if (parsed.success) {
    console.log('✅ Mapping validato con successo');
    return parsed.data;
  }
  
  // Se fallisce, prova a normalizzare
  console.log('⚠️ Primo tentativo fallito, provo normalizzazione...');
  
  try {
    const normalized = {};
    
    for (const [key, value] of Object.entries(candidate || {})) {
      if (typeof value === 'string') {
        // Forma: { "csvHeader": "dbField" }
        normalized[key] = { dbField: value };
      } else if (value && typeof value === 'object') {
        if (typeof value.dbField === 'string') {
          // Forma già corretta: { "csvHeader": { dbField: "...", ... } }
          normalized[key] = value;
        } else if (typeof value.csvHeader === 'string') {
          // Forma invertita: { "dbField": { csvHeader: "..." } }
          normalized[value.csvHeader] = { dbField: key };
        }
      }
    }
    
    const parsedNormalized = MappingSchema.safeParse(normalized);
    if (parsedNormalized.success) {
      console.log('✅ Mapping normalizzato e validato');
      return parsedNormalized.data;
    }
  } catch (err) {
    console.log('❌ Errore durante normalizzazione:', err.message);
  }
  
  // Ultimo tentativo: accetta tutto e costruisci manualmente
  console.log('⚠️ Ultimo tentativo: validazione manuale...');
  const result = {};
  for (const [key, value] of Object.entries(candidate || {})) {
    if (value && typeof value === 'object' && typeof value.dbField === 'string') {
      result[key] = value;
    }
  }
  
  if (Object.keys(result).length > 0) {
    console.log('✅ Validazione manuale riuscita');
    return result;
  }
  
  // Fallimento totale
  const err = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid mapping schema: ${err}`);
}

module.exports = { validateMapping };