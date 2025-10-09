# 🔍 SCOUTING MODULE – Validators

## ✅ COMPLETATO

Tutti i validators Zod per il modulo Scouting sono stati implementati secondo il prompt.

---

## 📁 Struttura File

```
validators/
├── index.ts              ✅ Export centralizzato
├── common.ts             ✅ Helper e validatori condivisi
├── prospect.schema.ts    ✅ Validatori Prospect
├── report.schema.ts      ✅ Validatori Report
└── shortlist.schema.ts   ✅ Validatori Shortlist
```

---

## 📋 Validators Disponibili

### 🔧 Common (common.ts)

#### Schema Base
- `uuidSchema` - Validazione UUID
- `scoutingStatusSchema` - Enum ScoutingStatus
- `paginationSchema` - Paginazione (limit, cursor, skip)
- `dateRangeSchema` - Range di date (fromDate, toDate)
- `searchSchema` - Ricerca testuale (q)
- `listQuerySchema` - Combinazione ricerca + filtri + paginazione

#### Tipi di Dato
- `nameSchema` - Nomi (1-100 caratteri)
- `emailSchema` - Email valida
- `phoneSchema` - Telefono (5-20 caratteri)
- `nationalitySchema` - Codice ISO 3166 (es: ITA, ESP, BRA)
- `positionSchema` - Ruolo calcistico
- `preferredFootSchema` - Piede preferito (LEFT, RIGHT, BOTH)
- `heightSchema` - Altezza cm (140-220)
- `weightSchema` - Peso kg (40-150)
- `marketValueSchema` - Market value (0-500M)
- `scoreSchema` - Punteggio 0-10
- `potentialScoreSchema` - Potenziale 0-100
- `urlSchema` - URL valido
- `longTextSchema` - Testo lungo (max 5000 caratteri)
- `birthDateSchema` - Data di nascita (età 14-45)
- `contractDateSchema` - Data contratto
- `prioritySchema` - Priorità 0-100

#### Helper
- `successResponse()` - Formato risposta successo
- `errorResponse()` - Formato risposta errore
- `sanitizeString()` - Sanitizza stringhe
- `isValidUuid()` - Type guard UUID
- `isValidScoutingStatus()` - Type guard Status

---

### 👤 Prospect (prospect.schema.ts)

#### Create
```typescript
createProspectSchema: {
  // OBBLIGATORI
  firstName: string (1-100)
  lastName: string (1-100)
  
  // OPZIONALI
  fullName?: string (max 200)
  birthDate?: DateTime (età 14-45)
  nationality?: string (ISO 3)
  position?: string (max 50)
  secondaryPosition?: string (max 50)
  preferredFoot?: LEFT | RIGHT | BOTH
  heightCm?: number (140-220)
  weightKg?: number (40-150)
  currentClub?: string (max 200)
  contractUntil?: DateTime
  agentId?: UUID
  marketValue?: number (0-500M)
  potentialScore?: number (0-100)
  scoutingStatus?: ScoutingStatus (default: DISCOVERY)
  notes?: string (max 5000)
}
```

#### Update
```typescript
updateProspectSchema: {
  // Tutti i campi opzionali
  // Stessa struttura di Create
}
```

#### List
```typescript
listProspectsSchema: {
  // Ricerca
  q?: string
  
  // Filtri
  status?: ScoutingStatus[]
  position?: string[]
  nationality?: string[]
  agentId?: UUID
  
  // Range
  minPotentialScore?: number
  maxPotentialScore?: number
  minMarketValue?: number
  maxMarketValue?: number
  fromDate?: DateTime
  toDate?: DateTime
  
  // Paginazione
  limit?: number (default 20, max 100)
  cursor?: UUID
  skip?: number
  
  // Ordinamento
  orderBy?: 'createdAt' | 'updatedAt' | 'lastName' | 'potentialScore' | 'marketValue' | 'birthDate'
  orderDir?: 'asc' | 'desc' (default 'desc')
}
```

#### Promote
```typescript
promoteToTargetSchema: {
  targetPriority?: number (1-5)
  targetNotes?: string (max 5000)
  force?: boolean (default false)
}
```

#### Business Rules
- ✅ fullName auto-generato se non presente
- ✅ contractUntil deve essere futuro
- ✅ Coerenza potentialScore vs marketValue
- ✅ Status TARGETED richiede potentialScore >= 60

---

### 📊 Report (report.schema.ts)

#### Create
```typescript
createReportSchema: {
  // OBBLIGATORI
  prospectId: UUID
  
  // OPZIONALI - Contesto
  matchDate?: DateTime
  opponent?: string (max 200)
  competition?: string (max 200)
  
  // OPZIONALI - Prestazione
  rolePlayed?: string (max 100)
  minutesPlayed?: number (0-120)
  
  // OPZIONALI - Scores (0-10)
  techniqueScore?: number
  tacticsScore?: number
  physicalScore?: number
  mentalityScore?: number
  totalScore?: number (auto-calcolato)
  
  // OPZIONALI - Valutazione
  summary?: string (max 5000)
  
  // OPZIONALI - Media
  videoLink?: URL
  attachmentUrl?: URL
}
```

#### Update
```typescript
updateReportSchema: {
  // Tutti i campi opzionali
  // Stessa struttura di Create
}
```

#### List
```typescript
listReportsSchema: {
  // Ricerca
  q?: string
  
  // Filtri
  prospectId?: UUID
  competition?: string
  matchDateFrom?: DateTime
  matchDateTo?: DateTime
  minTotalScore?: number (0-10)
  maxTotalScore?: number (0-10)
  
  // Paginazione
  limit?: number (default 20)
  cursor?: UUID
  skip?: number
  
  // Ordinamento
  orderBy?: 'createdAt' | 'matchDate' | 'totalScore' | 'updatedAt' (default 'matchDate')
  orderDir?: 'asc' | 'desc' (default 'desc')
}
```

#### Business Rules
- ✅ totalScore auto-calcolato come media degli altri scores
- ✅ matchDate max 2 settimane nel futuro
- ✅ Coerenza totalScore vs media scores (tolerance 0.5)
- ✅ Summary minimo 20 caratteri se presente
- ✅ Report deve avere almeno scores O summary

---

### 📝 Shortlist (shortlist.schema.ts)

#### Create Shortlist
```typescript
createShortlistSchema: {
  // OBBLIGATORI
  name: string (1-100)
  
  // OPZIONALI
  description?: string (max 500)
  category?: string (max 100)
  isArchived?: boolean (default false)
}
```

#### Update Shortlist
```typescript
updateShortlistSchema: {
  // Tutti i campi opzionali
  name?: string
  description?: string
  category?: string
  isArchived?: boolean
}
```

#### List Shortlists
```typescript
listShortlistsSchema: {
  // Ricerca
  q?: string
  
  // Filtri
  category?: string
  isArchived?: boolean
  
  // Paginazione
  limit?: number (default 20)
  cursor?: UUID
  skip?: number
  
  // Ordinamento
  orderBy?: 'createdAt' | 'updatedAt' | 'name' (default 'updatedAt')
  orderDir?: 'asc' | 'desc' (default 'desc')
}
```

#### Add Item
```typescript
addItemSchema: {
  // OBBLIGATORI
  prospectId: UUID
  
  // OPZIONALI
  priority?: number (0-100, default auto)
  notes?: string (max 1000)
}
```

#### Update Item
```typescript
updateItemSchema: {
  priority?: number (0-100)
  notes?: string (max 1000)
}
```

#### Bulk Operations
```typescript
bulkAddItemsSchema: {
  prospectIds: UUID[] (min 1, max 50)
  defaultPriority?: number
  notes?: string
}

bulkUpdateItemsSchema: {
  itemIds: UUID[] (min 1, max 50)
  priority?: number
  notes?: string
}

reorderItemsSchema: {
  items: Array<{
    itemId: UUID
    priority: number
  }> (min 1, max 100)
}
```

#### Business Rules
- ✅ Nome generico richiede category
- ✅ Prospect ARCHIVED non può essere aggiunto
- ✅ Prospect già presente → errore 409
- ✅ Priority auto-generata (count + 1)

---

## 🔐 Sanitizzazione e Sicurezza

### Input Sanitization
Tutti i campi string sono:
- ✅ Trimmed (spazi iniziali/finali rimossi)
- ✅ Limitati in lunghezza
- ✅ Caratteri di controllo rimossi

### Validazione Strict
Tutti gli schema usano `.strict()`:
- ❌ Campi extra non permessi
- ✅ Solo campi definiti accettati

### Type Safety
Ogni schema esporta il tipo TypeScript corrispondente:
```typescript
import type { 
  CreateProspectInput,
  UpdateProspectInput,
  ListProspectsInput 
} from './validators';
```

---

## 📊 Response Format

Tutte le risposte seguono il formato standard:

### Successo
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Errore
```json
{
  "success": false,
  "data": null,
  "error": "Messaggio errore dettagliato",
  "meta": {
    "code": "VALIDATION_ERROR",
    "field": "prospectId"
  }
}
```

---

## 🧪 Esempio Utilizzo

### Nel Controller
```typescript
import { 
  createProspectSchema,
  validateAndEnrichProspect,
  validateProspectBusinessRules,
  successResponse,
  errorResponse
} from '../validators';

// Validazione input
const result = createProspectSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json(
    errorResponse(result.error.errors[0].message)
  );
}

// Arricchimento dati
const enrichedData = validateAndEnrichProspect(result.data);

// Business rules
const businessValidation = validateProspectBusinessRules(enrichedData);

if (!businessValidation.valid) {
  return res.status(400).json(
    errorResponse(businessValidation.errors.join(', '))
  );
}

// Chiamata service
const prospect = await prospectService.create(
  req.context.teamId,
  req.user.id,
  enrichedData
);

// Risposta
return res.status(201).json(
  successResponse(prospect, { action: 'CREATED' })
);
```

---

## ✅ Quality Gates

- [x] Tutti i campi dello schema.prisma validati
- [x] Paginazione funzionante (limit + cursor)
- [x] Filtri per liste implementati
- [x] Business rules documentate
- [x] Type safety completa
- [x] Input sanitization attiva
- [x] Response format standard
- [x] Errori Zod mappati correttamente

---

## 🚀 Prossimi Passi

1. ✅ **Validators** - COMPLETATO
2. ⏳ **Services** - Implementare business logic
3. ⏳ **Controllers** - Gestire richieste HTTP
4. ⏳ **Routes** - Definire endpoint Express
5. ⏳ **Tests** - Unit e integration tests

---

**Status**: ✅ **VALIDATORS COMPLETI E PRONTI PER L'USO!**

