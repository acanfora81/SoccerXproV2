# 🔍 SCOUTING MODULE - ENTERPRISE EDITION

## 📋 PANORAMICA

Il **Scouting Module** è un sistema completo per la gestione del processo di scouting e monitoraggio giocatori in SoccerXPro V2.

### 🎯 Funzionalità Principali

1. **Prospects Management** - Gestione giocatori in osservazione
2. **Scouting Reports** - Report di osservazione dettagliati
3. **Shortlists** - Liste personalizzate per categorizzazione
4. **Event Log** - Cronologia completa di ogni azione
5. **Promote to Target** - Conversione prospect → market target

---

## 🏗️ ARCHITETTURA

```
server/src/modules/scouting/
├── modelRefs.js              # Prisma models reference
├── validators/               # Zod validators
│   ├── common.js            # Shared validators
│   ├── prospect.schema.js   # Prospect validation
│   ├── report.schema.js     # Report validation
│   ├── shortlist.schema.js  # Shortlist validation
│   └── index.js             # Export barrel
├── services/                 # Business logic
│   ├── eventLog.service.js  # Event logging
│   ├── prospect.service.js  # Prospect CRUD + rules
│   ├── report.service.js    # Report CRUD
│   ├── shortlist.service.js # Shortlist + items CRUD
│   └── promote.service.js   # Prospect → Target conversion
├── controllers/              # Request handlers
│   ├── prospect.controller.js
│   ├── report.controller.js
│   ├── shortlist.controller.js
│   └── eventLog.controller.js
└── routes/                   # Express routes
    ├── index.js             # Main router + middlewares
    ├── prospects.routes.js  # Prospect endpoints
    ├── reports.routes.js    # Report endpoints
    └── shortlists.routes.js # Shortlist endpoints
```

---

## 🔐 SICUREZZA E AUTORIZZAZIONI

### Multi-Tenancy ✅
- **Tutti i dati filtrati per `teamId`**
- Isolamento completo tra team
- Middleware `tenantContext` sempre attivo

### Role-Based Access Control (RBAC)

| Ruolo | Permessi |
|-------|----------|
| **SCOUT** | Può creare/modificare solo i propri prospects e reports |
| **DIRECTOR_SPORT** | Accesso completo, può promuovere prospects a targets |
| **ADMIN** | Accesso completo, override di tutte le regole |

### Audit Trail ✅
- **Ogni azione tracciata in `ScoutingEventLog`**
- Chi ha fatto cosa, quando
- Cronologia completa per compliance

---

## 📊 MODELLI PRISMA

### ScoutingProspect (market_scouting)
Giocatore in osservazione, con dati anagrafici, fisici, valutazioni e status nel funnel.

**Campi principali**:
- Anagrafica: firstName, lastName, birthDate, nationality
- Fisico: heightCm, weightKg, preferredFoot
- Club: currentClub, contractUntil
- Valutazione: potentialScore (0-100), marketValue
- Status: scoutingStatus (DISCOVERY → MONITORING → ANALYZED → TARGETED → ARCHIVED)

### ScoutingReport (market_scouting_report)
Report di osservazione di una partita/evento.

**Campi principali**:
- Match: matchDate, opponent, competition
- Performance: minutesPlayed, rolePlayed
- Scores (0-10): techniqueScore, tacticsScore, physicalScore, mentalityScore
- Totale: totalScore (calcolato automaticamente)
- Media: videoLink, attachmentUrl

### ScoutingShortlist (market_scouting_shortlist)
Lista personalizzata per categorizzare prospects.

**Campi principali**:
- name, description, category
- isArchived (per nascondere liste obsolete)
- Items: relazione 1:N con ScoutingShortlistItem

### ScoutingShortlistItem (market_scouting_shortlist_item)
Elemento di una shortlist (M:N tra Shortlist e Prospect).

**Campi principali**:
- prospectId, shortlistId
- priority (ordinamento)
- notes (note specifiche per questa lista)

### ScoutingEventLog (market_scouting_event_log)
Cronologia eventi per ogni prospect.

**Azioni**:
- CREATE, UPDATE, STATUS_CHANGE
- PROMOTE_TO_TARGET, REPORT_ADDED
- ADDED_TO_SHORTLIST, REMOVED_FROM_SHORTLIST

---

## 🔄 FLUSSO DI LAVORO

### 1️⃣ DISCOVERY (Scoperta)
```
Scout → Crea Prospect → Status: DISCOVERY
```
Giocatore appena identificato, dati minimi.

### 2️⃣ MONITORING (Monitoraggio)
```
Scout → Aggiorna Prospect → Status: MONITORING
Scout → Crea Report (prima osservazione)
```
Giocatore sotto osservazione attiva, primi report.

### 3️⃣ ANALYZED (Analizzato)
```
Scout → Crea più Report
Scout → Aggiunge a Shortlist
Scout → Aggiorna Status: ANALYZED
```
Giocatore analizzato in profondità, dati completi.

### 4️⃣ TARGETED (Obiettivo)
```
Director Sport → Valuta Prospect
Director Sport → Aggiorna Status: TARGETED
Director Sport → Promuove a Market Target
```
Giocatore pronto per trattativa.

### 5️⃣ CONVERSION (Conversione)
```
Director Sport → POST /api/scouting/prospects/:id/promote
Backend → Crea market_target con dati da prospect
Backend → Log evento PROMOTE_TO_TARGET
```
Prospect convertito in Target di mercato.

---

## 🛠️ API ENDPOINTS

### Base URL
```
http://localhost:3001/api/scouting
```

### Authentication
**Tutti gli endpoint richiedono autenticazione** (Bearer token o cookie HttpOnly).

---

### 📁 PROSPECTS

#### `GET /prospects`
Lista prospects con filtri avanzati.

**Query params**:
- `q` - Ricerca testuale (nome, cognome, club)
- `status` - Filtro per status (array)
- `position` - Filtro per ruolo (array)
- `nationality` - Filtro per nazionalità (array)
- `minPotentialScore` / `maxPotentialScore`
- `minMarketValue` / `maxMarketValue`
- `fromDate` / `toDate` - Range creazione
- `limit` - Paginazione (default: 20, max: 100)
- `skip` - Offset paginazione
- `orderBy` - Ordinamento (createdAt, updatedAt, lastName, potentialScore, marketValue)
- `orderDir` - Direzione (asc, desc)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Mario",
      "lastName": "Rossi",
      "fullName": "Mario Rossi",
      "position": "CF",
      "currentClub": "Team XYZ",
      "scoutingStatus": "MONITORING",
      "potentialScore": 75,
      "marketValue": 5000000,
      "agent": { "firstName": "...", "lastName": "..." }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

#### `POST /prospects`
Crea nuovo prospect.

**Body**:
```json
{
  "firstName": "Mario",
  "lastName": "Rossi",
  "birthDate": "2000-01-15",
  "nationality": "ITA",
  "position": "CF",
  "secondaryPosition": "SS",
  "preferredFoot": "RIGHT",
  "heightCm": 180,
  "weightKg": 75,
  "currentClub": "Team XYZ",
  "contractUntil": "2026-06-30",
  "potentialScore": 75,
  "marketValue": 5000000,
  "notes": "Giocatore promettente..."
}
```

**Response**: `201 Created` con oggetto prospect completo.

---

#### `GET /prospects/:id`
Dettaglio prospect con relazioni.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Mario",
    "...": "...",
    "agent": { ... },
    "reports": [ { "id": "...", "totalScore": 7.5, ... } ],
    "shortlistItems": [ { "shortlist": { "name": "Top Targets" } } ],
    "eventLogs": [ { "action": "CREATE", "createdAt": "..." } ]
  }
}
```

---

#### `PUT /prospects/:id`
Aggiorna prospect (stesso body di POST, tutti campi opzionali).

---

#### `DELETE /prospects/:id`
Elimina prospect.

**⚠️ Business Rule**: Non puoi eliminare prospect con status TARGETED. Devi archiviarlo (status → ARCHIVED).

---

#### `POST /prospects/:id/promote`
Promuove prospect a market target.

**Ruoli ammessi**: DIRECTOR_SPORT, ADMIN

**Body**:
```json
{
  "targetPriority": 4,
  "targetNotes": "Obiettivo primario per la prossima finestra",
  "force": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "target": { "id": "...", "first_name": "Mario", ... },
    "prospect": { "id": "...", "scoutingStatus": "TARGETED", ... },
    "message": "Prospect promoted: new target created"
  }
}
```

---

#### `GET /prospects/:id/events`
Cronologia eventi per un prospect.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATE",
      "description": "Prospect creato",
      "createdAt": "2025-10-09T10:00:00Z",
      "user": { "first_name": "John", "last_name": "Doe" }
    }
  ]
}
```

---

### 📝 REPORTS

#### `GET /reports`
Lista reports con filtri.

**Query params**:
- `q` - Ricerca (avversario, competizione, note)
- `prospectId` - Filtro per prospect
- `competition` - Filtro per competizione
- `matchDateFrom` / `matchDateTo` - Range date partita
- `minTotalScore` / `maxTotalScore`
- `limit`, `skip`, `orderBy`, `orderDir`

---

#### `POST /reports`
Crea report di osservazione.

**Body**:
```json
{
  "prospectId": "uuid",
  "matchDate": "2025-10-08",
  "opponent": "Team ABC",
  "competition": "Serie A",
  "rolePlayed": "CF",
  "minutesPlayed": 90,
  "techniqueScore": 7.5,
  "tacticsScore": 8.0,
  "physicalScore": 7.0,
  "mentalityScore": 8.5,
  "summary": "Ottima prestazione, doppietta...",
  "videoLink": "https://youtube.com/watch?v=..."
}
```

**Note**: `totalScore` viene calcolato automaticamente come media dei 4 punteggi.

---

#### `GET /reports/:id`
Dettaglio singolo report.

---

#### `PUT /reports/:id`
Aggiorna report (tutti campi opzionali).

---

#### `DELETE /reports/:id`
Elimina report.

---

### 📋 SHORTLISTS

#### `GET /shortlists`
Lista shortlists con items.

**Query params**:
- `q` - Ricerca (nome, descrizione, categoria)
- `category` - Filtro per categoria
- `isArchived` - Filtro archiviate (true/false)
- `limit`, `skip`, `orderBy`, `orderDir`

---

#### `POST /shortlists`
Crea nuova shortlist.

**Body**:
```json
{
  "name": "Top Attackers 2025",
  "description": "Migliori attaccanti giovani",
  "category": "Forwards",
  "isArchived": false
}
```

---

#### `GET /shortlists/:id`
Dettaglio shortlist con tutti gli items.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Top Attackers 2025",
    "items": [
      {
        "id": "uuid",
        "priority": 1,
        "notes": "Obiettivo primario",
        "prospect": {
          "firstName": "Mario",
          "lastName": "Rossi",
          "position": "CF",
          "potentialScore": 85
        }
      }
    ]
  }
}
```

---

#### `POST /shortlists/:id/items`
Aggiungi prospect a shortlist.

**Body**:
```json
{
  "prospectId": "uuid",
  "priority": 1,
  "notes": "Obiettivo primario per gennaio"
}
```

**⚠️ Business Rules**:
- Non puoi aggiungere prospect ARCHIVED
- Non puoi aggiungere lo stesso prospect due volte

---

#### `DELETE /shortlists/items/:itemId`
Rimuovi prospect da shortlist.

---

## 📐 VALIDAZIONI BUSINESS RULES

### Prospect
1. **Contract Until**: Deve essere futura
2. **High Potential**: Se potentialScore > 80 → marketValue >= 1M
3. **Targeted Status**: Richiede potentialScore >= 60

### Report
1. **Scores**: Tutti i punteggi 0-10
2. **Total Score**: Calcolato automaticamente (media)
3. **Minutes Played**: 0-120

### Shortlist
1. **Prospect ARCHIVED**: Non aggiungibile a shortlist
2. **Duplicate**: Stesso prospect non può essere due volte nella stessa shortlist

---

## 🔧 CONFIGURAZIONE

### 1. Abilita Feature Flag
Aggiungi al file `server/.env`:
```bash
FEATURE_SCOUTING_MODULE=true
```

### 2. Verifica Database
Assicurati che il database contenga le tabelle del modulo Scouting (schema Prisma già integrato).

### 3. Genera Prisma Client
```bash
cd server
npx prisma generate
```

### 4. Restart Server
```bash
npm start
```

---

## 🧪 TESTING

### cURL Examples

```bash
# 1. Lista prospects
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/scouting/prospects?limit=10&status=MONITORING"

# 2. Crea prospect
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Mario","lastName":"Rossi","position":"CF","potentialScore":75}' \
  "http://localhost:3001/api/scouting/prospects"

# 3. Crea report
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prospectId":"UUID","techniqueScore":8,"tacticsScore":7}' \
  "http://localhost:3001/api/scouting/reports"

# 4. Promuovi a target
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetPriority":4}' \
  "http://localhost:3001/api/scouting/prospects/UUID/promote"
```

---

## 📊 STATISTICHE IMPLEMENTAZIONE

| Componente | File | Righe | Status |
|------------|------|-------|--------|
| **Validators** | 5 | ~600 | ✅ |
| **Services** | 5 | ~800 | ✅ |
| **Controllers** | 4 | ~600 | ✅ |
| **Routes** | 4 | ~200 | ✅ |
| **Docs** | 6 | ~1000 | ✅ |
| **TOTALE** | **24** | **~3200** | ✅ |

---

## 📝 FILE DOCUMENTAZIONE

- `README.md` - Questa documentazione completa
- `ENV_CONFIG.md` - Configurazione variabili ambiente
- `ADD_ENV_FLAG.md` - Istruzioni abilitazione feature flag
- `CONVERSION_COMPLETE.md` - Log conversione TypeScript → JavaScript
- `PROGRESS.md` - Tracking implementazione
- `SCHEMA_VERIFICATION.md` - Verifica compatibilità Prisma

---

## ✅ CHECKLIST DEPLOYMENT

- [✅] Prisma schema integrato
- [✅] Validators (Zod) implementati
- [✅] Services con business logic
- [✅] Controllers con error handling
- [✅] Routes con RBAC
- [✅] Multi-tenancy verificato
- [✅] Audit trail completo
- [✅] Feature flag integrato
- [✅] Documentazione completa
- [ ] Frontend pages (TODO - client_v3)
- [ ] E2E tests
- [ ] Load testing

---

## 🚀 PROSSIMI PASSI

1. **Frontend (client_v3)**:
   - ProspectsPage.jsx (lista + filtri)
   - ProspectDetailModal.jsx (dettagli + tabs)
   - ReportsPage.jsx (lista reports)
   - ShortlistsPage.jsx (gestione liste)

2. **Integrazioni**:
   - Export prospect → Excel/CSV
   - Import batch prospects
   - Notifiche email per status changes

3. **Analytics**:
   - Dashboard KPI scouting
   - Report aggregati per scout
   - Conversion rate TARGETED → SIGNED

---

**STATUS**: 🟢 **BACKEND COMPLETO - PRONTO PER PRODUZIONE**

**Versione**: 2.0.0 - Enterprise Edition  
**Data**: 09/10/2025  
**Autore**: SoccerXPro Development Team
