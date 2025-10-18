# 🔍 SCOUTING MODULE - Flussi Operativi

## 📋 PANORAMICA FLUSSI

Questo documento descrive i flussi operativi principali del modulo Scouting, dalla scoperta di un giocatore alla sua promozione a Target di mercato.

---

## 🔄 FLUSSO 1: Prospect → Target

### Fase 1: Discovery
```
SCOUT → Crea Prospect → Status: DISCOVERY
```
- **Endpoint**: `POST /api/scouting/prospects`
- **Ruolo richiesto**: SCOUT, DIRECTOR_SPORT, ADMIN
- **Dati minimi**: firstName, lastName, position
- **Evento**: CREATE logged in eventLog

### Fase 2: Monitoring
```
SCOUT → Aggiorna Prospect → Status: MONITORING
```
- **Endpoint**: `PUT /api/scouting/prospects/:id`
- **Trigger**: Aggiunta di dati aggiuntivi (club, valore, note)
- **Evento**: STATUS_CHANGE logged

### Fase 3: Analysis
```
SCOUT → Crea Report → Status: ANALYZED
```
- **Endpoint**: `POST /api/scouting/reports`
- **Collegamento**: Report collegato al Prospect
- **Evento**: REPORT_ADDED logged

### Fase 4: Targeting
```
DIRECTOR_SPORT → Promuove → Status: TARGETED
```
- **Endpoint**: `POST /api/scouting/prospects/:id/promote`
- **Ruolo richiesto**: DIRECTOR_SPORT, ADMIN
- **Risultato**: Crea/aggiorna market_target
- **Evento**: PROMOTE_TO_TARGET logged

---

## 📊 FLUSSO 2: Session → Report

### Fase 1: Session Creation
```
SCOUT → Crea Sessione → Status: OPEN
```
- **Endpoint**: `POST /api/scouting/sessions`
- **Dati**: scoutId, targetId (opzionale), dateObserved, location
- **Multi-tenancy**: teamId automatico

### Fase 2: Observation
```
SCOUT → Osserva Giocatore → Compila Dati
```
- **Campi**: minutes_played, position_played, shirt_number
- **Valutazioni**: overall_rating, potential_rating, recommendation
- **Note**: notes, follow_up_date, next_action

### Fase 3: Report Generation
```
SCOUT → Crea Report → Collega a Session
```
- **Endpoint**: `POST /api/scouting/reports`
- **Collegamento**: sessionId → scouting_session
- **Dati**: summary, strengths, weaknesses, playing_style

### Fase 4: Review
```
DIRECTOR_SPORT → Review → Status: CLOSED
```
- **Endpoint**: `PUT /api/scouting/sessions/:id`
- **Campo**: ds_reviewer_id
- **Status**: OPEN → CLOSED

---

## 📝 FLUSSO 3: Assignment Flow

### Fase 1: Assignment Creation
```
DIRECTOR_SPORT → Assegna Scout → Crea Assignment
```
- **Endpoint**: `POST /api/scouting/assignments`
- **Dati**: scoutId, targetId, dueDate, priority
- **Status**: PENDING

### Fase 2: Scout Acceptance
```
SCOUT → Accetta Assignment → Status: ACCEPTED
```
- **Endpoint**: `PUT /api/scouting/assignments/:id`
- **Status**: PENDING → ACCEPTED

### Fase 3: Session Execution
```
SCOUT → Crea Session → Collega Assignment
```
- **Endpoint**: `POST /api/scouting/sessions`
- **Collegamento**: assignmentId → scouting_assignment
- **Status**: IN_PROGRESS

### Fase 4: Completion
```
SCOUT → Completa → Status: COMPLETED
```
- **Trigger**: Report creato e collegato
- **Status**: IN_PROGRESS → COMPLETED

---

## 🔗 INTEGRAZIONI MARKET

### Prospect → Target Conversion
```javascript
// promote.service.js
const promoteToTarget = async (prospectId, ctx, options) => {
  // 1. Verifica prospect e precondizioni
  // 2. Prepara dati target
  // 3. Crea/aggiorna market_target
  // 4. Aggiorna status prospect
  // 5. Log evento
}
```

### Target → Session Link
```javascript
// session.controller.js
const createSession = async (req, res) => {
  // targetId opzionale per collegare sessione a target esistente
  // Se targetId presente, crea collegamento bidirezionale
}
```

---

## 📈 STATI E TRANSIZIONI

### ScoutingStatus Transitions
```
DISCOVERY → MONITORING → ANALYZED → TARGETED → ARCHIVED
     ↓           ↓           ↓           ↓
   CREATE    UPDATE    REPORT_ADDED  PROMOTE_TO_TARGET
```

### SessionStatus Transitions
```
OPEN → IN_PROGRESS → CLOSED
  ↓         ↓          ↓
CREATE   UPDATE    REVIEW
```

### AssignmentStatus Transitions
```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
   ↓         ↓           ↓           ↓
CREATE   ACCEPT      START       FINISH
```

---

## 🔐 PERMESSI E RUOLI

### SCOUT
- ✅ Crea/aggiorna prospects (solo propri)
- ✅ Crea sessioni e report
- ✅ Accetta assignments
- ❌ Promuove a target
- ❌ Crea assignments

### DIRECTOR_SPORT
- ✅ Tutte le operazioni SCOUT
- ✅ Promuove prospects a target
- ✅ Crea e gestisce assignments
- ✅ Review sessioni
- ✅ Gestisce shortlists

### ADMIN
- ✅ Tutte le operazioni
- ✅ Gestione completa modulo

---

## 📊 METRICHE E REPORTING

### KPI Principali
- **Prospects per Scout**: Numero prospects gestiti
- **Conversion Rate**: DISCOVERY → TARGETED
- **Session Completion**: Sessioni completate vs assegnate
- **Report Quality**: Punteggi medi report

### Dashboard Data
```javascript
// Endpoint per dashboard
GET /api/scouting/dashboard
// Restituisce:
// - Stats per scout
// - Prospects per status
// - Sessioni recenti
// - Assignments pending
```

---

## 🚀 PROSSIMI SVILUPPI

### UI Enhancements
- [ ] Dettaglio Prospect con cronologia
- [ ] Collegamenti Sessioni → Report
- [ ] Dashboard analytics
- [ ] Assignment management

### API Extensions
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Export/Import
- [ ] Integration webhooks

### Business Logic
- [ ] Auto-promotion rules
- [ ] Notification system
- [ ] Performance scoring
- [ ] Market value estimation


