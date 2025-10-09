# ✅ DEPLOYMENT CHECKLIST - SCOUTING MODULE

## 📋 LISTA VERIFICHE PRE-PRODUZIONE

### 🔧 CONFIGURAZIONE

- [ ] **Feature Flag abilitata**
  - File: `server/.env`
  - Riga: `FEATURE_SCOUTING_MODULE=true`
  - Verifica: Presente e = true

- [ ] **Prisma Client rigenerato**
  - Comando: `npx prisma generate`
  - Verifica: Nessun errore

- [ ] **Database schema sincronizzato**
  - Tabelle richieste esistono:
    - [ ] `market_scouting` (ScoutingProspect)
    - [ ] `market_scouting_report` (ScoutingReport)
    - [ ] `market_scouting_shortlist` (ScoutingShortlist)
    - [ ] `market_scouting_shortlist_item` (ScoutingShortlistItem)
    - [ ] `market_scouting_event_log` (ScoutingEventLog)

- [ ] **Enum `ScoutingStatus` presente**
  - Valori: DISCOVERY, MONITORING, ANALYZED, TARGETED, ARCHIVED

---

### 🚀 SERVER

- [ ] **Server si avvia senza errori**
  - Comando: `npm start`
  - Log atteso: `🟢 [INFO] Scouting Module mounted at /api/scouting`

- [ ] **Health check funzionante**
  - URL: `http://localhost:3001/health`
  - Response: `{ "status": "OK", ... }`

- [ ] **Middleware verificati**
  - [ ] `authenticate` (auth.js)
  - [ ] `tenantContext` (tenantContext.js)
  - [ ] `requireScoutingRole` (routes/index.js)

---

### 🔐 SICUREZZA

- [ ] **Multi-tenancy attivo**
  - Test: Crea prospect con User A (team X)
  - Test: User B (team Y) non vede prospect di User A
  - Verifica: `teamId` filtrato correttamente

- [ ] **RBAC funzionante**
  - [ ] SCOUT può creare propri prospects
  - [ ] SCOUT NON può modificare prospects altrui
  - [ ] DIRECTOR_SPORT può modificare tutto
  - [ ] DIRECTOR_SPORT può promuovere a target
  - [ ] ADMIN ha accesso completo

- [ ] **Audit trail attivo**
  - Test: Crea prospect
  - Verifica: Evento CREATE in `market_scouting_event_log`
  - Test: Aggiorna prospect
  - Verifica: Evento UPDATE loggato

---

### 🧪 TESTING ENDPOINT

#### Prospects (7 endpoint)
- [ ] `GET /api/scouting/prospects` - Lista vuota ritorna 200
- [ ] `POST /api/scouting/prospects` - Creazione con dati validi ritorna 201
- [ ] `GET /api/scouting/prospects/:id` - Dettaglio ritorna 200
- [ ] `PUT /api/scouting/prospects/:id` - Aggiornamento ritorna 200
- [ ] `DELETE /api/scouting/prospects/:id` - Eliminazione ritorna 200
- [ ] `POST /api/scouting/prospects/:id/promote` - Promozione ritorna 200 (DIRECTOR_SPORT)
- [ ] `GET /api/scouting/prospects/:id/events` - Cronologia ritorna 200

#### Reports (5 endpoint)
- [ ] `GET /api/scouting/reports` - Lista funzionante
- [ ] `POST /api/scouting/reports` - Creazione funzionante
- [ ] `GET /api/scouting/reports/:id` - Dettaglio funzionante
- [ ] `PUT /api/scouting/reports/:id` - Aggiornamento funzionante
- [ ] `DELETE /api/scouting/reports/:id` - Eliminazione funzionante

#### Shortlists (7 endpoint)
- [ ] `GET /api/scouting/shortlists` - Lista funzionante
- [ ] `POST /api/scouting/shortlists` - Creazione funzionante
- [ ] `GET /api/scouting/shortlists/:id` - Dettaglio funzionante
- [ ] `PUT /api/scouting/shortlists/:id` - Aggiornamento funzionante
- [ ] `DELETE /api/scouting/shortlists/:id` - Eliminazione funzionante
- [ ] `POST /api/scouting/shortlists/:id/items` - Aggiungi item funzionante
- [ ] `DELETE /api/scouting/shortlists/items/:itemId` - Rimuovi item funzionante

---

### 🔍 VALIDAZIONI

- [ ] **Input validation (Zod)**
  - Test: POST prospect con `firstName` vuoto → 400 Bad Request
  - Test: POST prospect con `potentialScore` > 100 → 400 Bad Request
  - Test: POST report con `techniqueScore` > 10 → 400 Bad Request

- [ ] **Business rules**
  - Test: DELETE prospect TARGETED → 409 Conflict
  - Test: Promuovi prospect con score < 60 → 400 Bad Request
  - Test: Aggiungi prospect ARCHIVED a shortlist → 400 Bad Request

---

### 📊 PERFORMANCE

- [ ] **Query ottimizzate**
  - Verifica: GET prospects usa `include` solo necessari
  - Verifica: Paginazione funziona (limit, skip)
  - Verifica: Filtri non causano full table scan

- [ ] **Indici database** (opzionale ma consigliato)
  - [ ] `market_scouting.teamId`
  - [ ] `market_scouting.scoutingStatus`
  - [ ] `market_scouting_report.prospectId`
  - [ ] `market_scouting_shortlist_item.shortlistId`
  - [ ] `market_scouting_event_log.prospectId`

---

### 📝 DOCUMENTAZIONE

- [ ] **File presenti**
  - [ ] INDEX.md
  - [ ] QUICK_START.md
  - [ ] README.md
  - [ ] IMPLEMENTATION_COMPLETE.md
  - [ ] ENV_CONFIG.md
  - [ ] ADD_ENV_FLAG.md

- [ ] **Esempi cURL funzionanti**
  - Verifica: Esempi in README.md sono aggiornati
  - Test: Almeno 3 esempi testati con successo

---

### 🎯 EDGE CASES

- [ ] **Prospect senza report**
  - Test: GET prospect/:id con 0 reports → array vuoto in `reports`

- [ ] **Shortlist senza items**
  - Test: GET shortlist/:id con 0 items → array vuoto in `items`

- [ ] **Filtri multipli**
  - Test: GET prospects?status=MONITORING&position=CF → filtra correttamente

- [ ] **Paginazione limite**
  - Test: GET prospects?limit=1000 → max 100 applicato
  - Test: GET prospects?skip=9999 → nessun errore

---

### 🚨 ERROR HANDLING

- [ ] **Errori gestiti correttamente**
  - [ ] 400 Bad Request (input invalidi)
  - [ ] 401 Unauthorized (no auth)
  - [ ] 403 Forbidden (ruolo insufficiente)
  - [ ] 404 Not Found (risorsa inesistente)
  - [ ] 409 Conflict (violazione business rule)
  - [ ] 500 Internal Server Error (errori imprevisti)

- [ ] **Messaggi errore utili**
  - Test: Errore contiene descrizione chiara
  - Verifica: Nessun stack trace esposto in produzione

---

### 🔄 INTEGRAZIONE

- [ ] **Promote to Target funzionante**
  - Test: POST prospects/:id/promote
  - Verifica: Record creato in `market_targets`
  - Verifica: `signed_player_id` collegato correttamente
  - Verifica: Evento PROMOTE_TO_TARGET loggato

- [ ] **Relazioni Prisma corrette**
  - [ ] Prospect → Agent (optional)
  - [ ] Prospect → Reports (1:N)
  - [ ] Prospect → ShortlistItems (1:N)
  - [ ] Prospect → EventLogs (1:N)
  - [ ] Shortlist → ShortlistItems (1:N)

---

### 📈 MONITORING (Produzione)

- [ ] **Logging configurato**
  - [ ] Eventi CREATE/UPDATE/DELETE loggati
  - [ ] Errori loggati con stack trace
  - [ ] Accessi loggati (audit trail)

- [ ] **Metriche da monitorare**
  - [ ] Numero prospects per team
  - [ ] Numero reports creati/settimana
  - [ ] Tasso conversione TARGETED → market_target
  - [ ] Tempo medio risposta API

---

### 🎓 TRAINING (Team)

- [ ] **Backend team formato**
  - [ ] Architettura spiegata (validators → services → controllers)
  - [ ] Business rules documentate
  - [ ] Flow RBAC chiaro

- [ ] **Frontend team informato**
  - [ ] Endpoint API condivisi
  - [ ] Esempi request/response forniti
  - [ ] Ruoli e permessi spiegati

---

## ✅ FIRMA DEPLOYMENT

**Data**: _______________

**Responsabile Backend**: _______________

**Responsabile DevOps**: _______________

**Note**:
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

## 🚀 GO-LIVE CHECKLIST

Prima di andare in produzione:

1. [ ] **Backup database completo**
2. [ ] **Feature flag testata in staging**
3. [ ] **Rollback plan preparato**
4. [ ] **Team notificato**
5. [ ] **Documentazione aggiornata**
6. [ ] **Monitoring attivo**

---

**STATUS**: ⬜ IN PROGRESS | ✅ COMPLETATO | ❌ FALLITO

**Versione**: 2.0.0 - Enterprise Edition  
**Data Deployment**: _______________

