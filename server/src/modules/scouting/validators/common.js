/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Common Validators
 * ===============================================================
 * 
 * Helper e validatori condivisi per il modulo Scouting
 */

const { z } = require('zod');

/**
 * Enumerazione ScoutingStatus
 */
const scoutingStatusSchema = z.enum([
  'DISCOVERY',
  'MONITORING',
  'ANALYZED',
  'EVALUATED',
  'TARGETED',
  'SIGNED',
  'REJECTED',
  'ARCHIVED',
]);

/**
 * Validazione UUID
 */
const uuidSchema = z.string().uuid({ message: 'ID deve essere un UUID valido' });

/**
 * Validazione UUID opzionale
 */
const optionalUuidSchema = z.string().uuid().optional().nullable();

/**
 * Validazione paginazione
 */
const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  cursor: z.string().uuid().optional(),
  skip: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
});

/**
 * Validazione date range
 */
const dateRangeSchema = z.object({
  fromDate: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  toDate: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

/**
 * Validazione ricerca testuale
 */
const searchSchema = z.object({
  q: z
    .string()
    .max(200, 'Query di ricerca troppo lunga')
    .optional()
    .transform((val) => val?.trim()),
});

/**
 * Validazione array di stringhe
 */
const stringArraySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((val) => (Array.isArray(val) ? val : [val]))
  .optional();

/**
 * Validazione filtri comuni
 */
const commonFiltersSchema = z
  .object({
    status: stringArraySchema,
    role: stringArraySchema,
    position: stringArraySchema,
    nationality: stringArraySchema,
  })
  .partial();

/**
 * Combinazione ricerca + filtri + paginazione
 */
const listQuerySchema = searchSchema
  .merge(commonFiltersSchema)
  .merge(dateRangeSchema)
  .merge(paginationSchema);

/**
 * Validazione score (0-10)
 */
const scoreSchema = z
  .number()
  .min(0, 'Score minimo: 0')
  .max(10, 'Score massimo: 10')
  .optional()
  .nullable();

/**
 * Validazione potential score (0-100)
 */
const potentialScoreSchema = z
  .number()
  .min(0, 'Potential score minimo: 0')
  .max(100, 'Potential score massimo: 100')
  .optional()
  .nullable();

/**
 * Validazione URL
 */
const urlSchema = z
  .string()
  .url('URL non valido')
  .max(500, 'URL troppo lungo')
  .optional()
  .nullable();

/**
 * Validazione note/testo lungo
 */
const longTextSchema = z
  .string()
  .max(5000, 'Testo troppo lungo (max 5000 caratteri)')
  .optional()
  .nullable()
  .transform((val) => val?.trim() || null);

/**
 * Validazione nome
 */
const nameSchema = z
  .string()
  .min(1, 'Nome obbligatorio')
  .max(100, 'Nome troppo lungo')
  .transform((val) => val.trim());

/**
 * Validazione email
 */
const emailSchema = z
  .string()
  .email('Email non valida')
  .max(200, 'Email troppo lunga')
  .optional()
  .nullable();

/**
 * Validazione telefono
 */
const phoneSchema = z
  .string()
  .min(5, 'Telefono troppo corto')
  .max(20, 'Telefono troppo lungo')
  .optional()
  .nullable();

/**
 * Validazione nazionalità (nome completo)
 */
const nationalitySchema = z
  .string()
  .min(2, 'Nazionalità deve essere di almeno 2 caratteri')
  .max(50, 'Nazionalità deve essere di massimo 50 caratteri')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nazionalità può contenere solo lettere e spazi')
  .optional()
  .nullable();

/**
 * Validazione posizione
 */
const positionSchema = z
  .string()
  .max(50, 'Posizione troppo lunga')
  .optional()
  .nullable();

/**
 * Validazione piede preferito
 */
const preferredFootSchema = z
  .enum(['LEFT', 'RIGHT', 'BOTH'])
  .optional()
  .nullable();

/**
 * Validazione altezza (cm)
 */
const heightSchema = z
  .number()
  .int('Altezza deve essere un numero intero')
  .min(140, 'Altezza minima: 140cm')
  .max(220, 'Altezza massima: 220cm')
  .optional()
  .nullable();

/**
 * Validazione peso (kg)
 */
const weightSchema = z
  .number()
  .int('Peso deve essere un numero intero')
  .min(40, 'Peso minimo: 40kg')
  .max(150, 'Peso massimo: 150kg')
  .optional()
  .nullable();

/**
 * Validazione market value
 */
const marketValueSchema = z
  .number()
  .min(0, 'Market value non può essere negativo')
  .max(500_000_000, 'Market value troppo alto')
  .optional()
  .nullable();

/**
 * Validazione data di nascita
 */
const birthDateSchema = z
  .string()
  .datetime()
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 14 && age <= 45;
    },
    { message: 'Età deve essere tra 14 e 45 anni' }
  );

/**
 * Validazione data contratto
 */
const contractDateSchema = z
  .string()
  .datetime()
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .optional()
  .nullable();

/**
 * Validazione priorità
 */
const prioritySchema = z
  .number()
  .int('Priorità deve essere un numero intero')
  .min(0, 'Priorità minima: 0')
  .max(100, 'Priorità massima: 100')
  .default(0);

/**
 * Response format helpers
 */
const successResponse = (data, meta) => ({
  success: true,
  data,
  error: null,
  meta,
});

const errorResponse = (error, meta) => ({
  success: false,
  data: null,
  error,
  meta,
});

/**
 * Helper per sanitizzare stringhe
 */
const sanitizeString = (str) => {
  if (!str) return null;
  return str
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 5000);
};

module.exports = {
  // Schemas
  scoutingStatusSchema,
  uuidSchema,
  optionalUuidSchema,
  paginationSchema,
  dateRangeSchema,
  searchSchema,
  stringArraySchema,
  commonFiltersSchema,
  listQuerySchema,
  scoreSchema,
  potentialScoreSchema,
  urlSchema,
  longTextSchema,
  nameSchema,
  emailSchema,
  phoneSchema,
  nationalitySchema,
  positionSchema,
  preferredFootSchema,
  heightSchema,
  weightSchema,
  marketValueSchema,
  birthDateSchema,
  contractDateSchema,
  prioritySchema,
  
  // Helpers
  successResponse,
  errorResponse,
  sanitizeString,
};

