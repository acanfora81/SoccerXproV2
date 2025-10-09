/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Shortlist Validators
 * ===============================================================
 */

const { z } = require('zod');
const {
  nameSchema,
  longTextSchema,
  uuidSchema,
  listQuerySchema,
  prioritySchema,
} = require('./common');

const createShortlistSchema = z.object({
  name: nameSchema,
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable().transform((val) => val?.trim() || null),
  isArchived: z.boolean().default(false),
}).strict();

const updateShortlistSchema = z.object({
  name: nameSchema.optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isArchived: z.boolean().optional(),
}).strict();

const listShortlistsSchema = listQuerySchema.extend({
  category: z.string().max(100).optional(),
  isArchived: z.string().optional().transform((val) => {
    if (val === 'true' || val === '1') return true;
    if (val === 'false' || val === '0') return false;
    return undefined;
  }).pipe(z.boolean().optional()),
  orderBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt').optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc').optional(),
});

const shortlistIdSchema = z.object({
  id: uuidSchema,
});

const addItemSchema = z.object({
  prospectId: uuidSchema,
  priority: prioritySchema,
  notes: z.string().max(1000).optional().nullable().transform((val) => val?.trim() || null),
}).strict();

const updateItemSchema = z.object({
  priority: prioritySchema.optional(),
  notes: z.string().max(1000).optional().nullable().transform((val) => val?.trim() || null),
}).strict();

const itemIdSchema = z.object({
  itemId: uuidSchema,
});

const bulkAddItemsSchema = z.object({
  prospectIds: z.array(uuidSchema).min(1).max(50),
  defaultPriority: prioritySchema.optional(),
  notes: z.string().max(1000).optional().nullable(),
}).strict();

module.exports = {
  createShortlistSchema,
  updateShortlistSchema,
  listShortlistsSchema,
  shortlistIdSchema,
  addItemSchema,
  updateItemSchema,
  itemIdSchema,
  bulkAddItemsSchema,
};

