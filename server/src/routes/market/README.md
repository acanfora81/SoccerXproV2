# 🛒 Modulo Market - Backend API

## 📋 Panoramica

Il modulo Market gestisce l'intero ciclo di vita delle operazioni di mercato per le società sportive:
- **Targets**: Giocatori obiettivo da acquisire
- **Negotiations**: Trattative in corso con agenti e club
- **Offers**: Offerte economiche inviate/ricevute
- **Budgets**: Budget annuali per trasferimenti, salari e commissioni
- **Agents**: Anagrafica procuratori sportivi

## 🏗️ Architettura

Il modulo segue il pattern **Controller → Service → Prisma** già utilizzato in SoccerXPro:

```
routes/market/
├── index.js              # Router principale con middleware
├── targets.js            # Routes per targets
├── negotiations.js       # Routes per negotiations
├── offers.js             # Routes per offers
├── budgets.js            # Routes per budgets
└── agents.js             # Routes per agents (esistente)

controllers/market/
├── targetsController.js
├── negotiationsController.js
├── offersController.js
└── budgetsController.js

services/market/
├── targetsService.js
├── negotiationsService.js
├── offersService.js
└── budgetsService.js
```

## 🔐 Sicurezza e Middleware

Tutte le routes `/api/market/*` sono protette da:
1. **Feature Flag**: `FEATURE_MARKET_MODULE=true` (env var)
2. **authenticate**: Verifica token JWT
3. **tenantContext**: Estrae `teamId` dal contesto utente
4. **requireDirectorRole**: Solo `DIRECTOR_SPORT` o `ADMIN`

## 📡 API Endpoints

### 🎯 Targets

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/market/targets` | Lista targets con filtri |
| GET | `/api/market/targets/:id` | Dettaglio target |
| POST | `/api/market/targets` | Crea nuovo target |
| PUT | `/api/market/targets/:id` | Aggiorna target |
| DELETE | `/api/market/targets/:id` | Soft delete (status=ARCHIVED) |
| POST | `/api/market/targets/:id/convert-to-player` | Converte target in Player |

**Query params (GET list)**:
- `search`: Cerca in first_name, last_name, current_club
- `status`: Filtra per stato (SCOUTING, INTERESTED, CONTACT, etc.)
- `priority`: Filtra per priorità (1-5)
- `position`: Filtra per ruolo
- `agentId`: Filtra per agente

---

### 🤝 Negotiations

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/market/negotiations` | Lista trattative con filtri |
| GET | `/api/market/negotiations/:id` | Dettaglio trattativa |
| POST | `/api/market/negotiations` | Crea nuova trattativa |
| PUT | `/api/market/negotiations/:id` | Aggiorna trattativa |
| DELETE | `/api/market/negotiations/:id` | Soft delete (status=CLOSED) |
| POST | `/api/market/negotiations/:id/close` | Chiude trattativa |
| POST | `/api/market/negotiations/:id/convert-to-player` | Converte in Player |
| PUT | `/api/market/negotiations/:id/stage` | Aggiorna stage pipeline |
| GET | `/api/market/negotiations/:id/budget-impact` | Calcola impatto budget |

**Query params (GET list)**:
- `search`: Cerca in player_first_name, player_last_name, counterpart, notes
- `status`: Filtra per stato (OPEN, AGREEMENT, CLOSED, REJECTED)
- `stage`: Filtra per fase (SCOUTING, CONTACT, OFFER_SENT, COUNTEROFFER, AGREEMENT)
- `targetId`: Filtra per target collegato
- `agentId`: Filtra per agente

---

### 💼 Offers

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/market/offers` | Lista offerte con filtri |
| GET | `/api/market/offers/:id` | Dettaglio offerta |
| POST | `/api/market/offers` | Crea nuova offerta |
| PUT | `/api/market/offers/:id` | Aggiorna offerta |
| DELETE | `/api/market/offers/:id` | Elimina definitivamente |
| POST | `/api/market/offers/:id/accept` | Accetta offerta |
| POST | `/api/market/offers/:id/reject` | Rifiuta offerta |

**Query params (GET list)**:
- `search`: Cerca in player_name, club_from, club_to, notes
- `status`: Filtra per stato (PENDING, ACCEPTED, REJECTED, EXPIRED)
- `direction`: Filtra per direzione (INBOUND, OUTBOUND)
- `negotiationId`: Filtra per trattativa
- `agentId`: Filtra per agente

---

### 💰 Budgets

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/market/budgets` | Lista budget con filtri |
| GET | `/api/market/budgets/:id` | Dettaglio budget |
| POST | `/api/market/budgets` | Crea nuovo budget |
| PUT | `/api/market/budgets/:id` | Aggiorna budget |
| DELETE | `/api/market/budgets/:id` | Elimina definitivamente |
| GET | `/api/market/budgets/:id/spent` | Calcola totale speso |
| GET | `/api/market/budgets/:id/remaining` | Calcola rimanente |

**Query params (GET list)**:
- `season_label`: Filtra per stagione (es. "2024/25")
- `type`: Filtra per tipo (FORECAST, ACTUAL)

**Vincolo**: Unico per combinazione `teamId + season_label + type`

---

## 📊 Formato Risposta API

### ✅ Success
```json
{
  "success": true,
  "data": { ... }
}
```

### ❌ Error
```json
{
  "success": false,
  "error": "Descrizione errore"
}
```

## 🔗 Relazioni tra Modelli

```
market_target
    ↓ (targetId)
market_negotiation
    ↓ (negotiationId)
market_offer

market_agent ← agentId → market_negotiation
market_agent ← agentId → market_offer
market_agent ← agentId → market_target

market_negotiation → signed_player_id → Player (quando firmato)
market_target → converted_player_id → Player (quando convertito)
```

## 🧪 Testing

Per testare le API, assicurati che:
1. `.env` contenga `FEATURE_MARKET_MODULE=true`
2. L'utente abbia ruolo `DIRECTOR_SPORT` o `ADMIN`
3. Il token JWT sia valido e contenga `teamId`

**Esempio cURL**:
```bash
# Lista targets
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/market/targets

# Crea nuovo target
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Mario","last_name":"Rossi","position":"FW"}' \
  http://localhost:3001/api/market/targets
```

## 📝 Note Implementazione

### Multi-tenancy
Tutti i metodi verificano `teamId` da `req.context.teamId` per garantire isolamento dati.

### Soft Delete
- **Targets**: `status = 'ARCHIVED'`
- **Negotiations**: `status = 'CLOSED'` + `outcome = 'CANCELLED'`
- **Offers**: Hard delete (elimina fisicamente)
- **Budgets**: Hard delete

### Conversione Player
I metodi `convertToPlayer` per targets e negotiations sono stub che lanciano `'Player conversion not yet implemented'`.  
L'implementazione completa richiede logica custom per:
1. Creare record in `Player` table
2. Aggiornare `signed_player_id` o `converted_player_id`
3. Gestire la creazione automatica del contratto

## 🚀 Deploy

Le routes sono già montate in `server/src/app.js`:
```javascript
const marketRoutes = require('./routes/market');
app.use('/api/market', marketRoutes);
```

Nessuna modifica necessaria al file principale.

## 📦 Dipendenze Prisma

I seguenti modelli Prisma sono utilizzati:
- `market_agent`
- `market_target`
- `market_negotiation`
- `market_offer`
- `market_budget`

Schema completo in `server/prisma/schema.prisma`.

## ✅ Checklist Completamento

- [x] Services creati per Targets, Negotiations, Offers, Budgets
- [x] Controllers creati con gestione errori
- [x] Routes aggiornate per usare controllers
- [x] Route `/api/market/budgets` creata
- [x] File `index.js` aggiornato con budgets
- [x] Nessun errore di linting
- [x] Compatibilità con architettura esistente
- [x] Multi-tenancy garantito
- [x] Documentazione API completa

---

**Autore**: AI Assistant  
**Data**: 2025-01-08  
**Versione**: 1.0.0

