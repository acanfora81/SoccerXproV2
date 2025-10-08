# 🧪 Test Rapido API Market

## Prerequisiti

1. Server in esecuzione: `cd server && npm start`
2. `.env` configurato con `FEATURE_MARKET_MODULE=true`
3. Token JWT valido con ruolo `DIRECTOR_SPORT` o `ADMIN`

## 🔑 Ottenere un Token

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Copia il token dalla risposta e salvalo in una variabile
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Test Endpoints

### 1. Targets

```bash
# Lista tutti i targets
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/targets

# Crea un nuovo target
curl -X POST http://localhost:3001/api/market/targets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mario",
    "last_name": "Rossi",
    "position": "FW",
    "current_club": "AC Milan",
    "priority": 2,
    "status": "SCOUTING"
  }'

# Recupera dettaglio target (sostituisci :id)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/targets/1

# Aggiorna target
curl -X PUT http://localhost:3001/api/market/targets/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priority": 1, "status": "INTERESTED"}'
```

### 2. Negotiations

```bash
# Lista tutte le trattative
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/negotiations

# Crea nuova trattativa
curl -X POST http://localhost:3001/api/market/negotiations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "player_first_name": "Mario",
    "player_last_name": "Rossi",
    "stage": "CONTACT",
    "status": "OPEN",
    "priority": "HIGH",
    "requested_salary_net": "1000000",
    "currency": "EUR"
  }'

# Aggiorna stage trattativa
curl -X PUT http://localhost:3001/api/market/negotiations/1/stage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage": "OFFER_SENT"}'

# Calcola impatto budget
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/negotiations/1/budget-impact

# Chiudi trattativa
curl -X POST http://localhost:3001/api/market/negotiations/1/close \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Offers

```bash
# Lista tutte le offerte
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/offers

# Crea nuova offerta
curl -X POST http://localhost:3001/api/market/offers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "negotiationId": 1,
    "direction": "OUTBOUND",
    "status": "PENDING",
    "player_name": "Mario Rossi",
    "transfer_fee": "5000000",
    "salary_gross_annual": "1500000",
    "contract_years": 3,
    "currency": "EUR"
  }'

# Accetta offerta
curl -X POST http://localhost:3001/api/market/offers/1/accept \
  -H "Authorization: Bearer $TOKEN"

# Rifiuta offerta
curl -X POST http://localhost:3001/api/market/offers/1/reject \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Budgets

```bash
# Lista tutti i budget
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/budgets

# Crea nuovo budget
curl -X POST http://localhost:3001/api/market/budgets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "season_label": "2024/25",
    "type": "FORECAST",
    "transfer_budget": "10000000",
    "wage_budget": "5000000",
    "commission_budget": "500000",
    "currency": "EUR"
  }'

# Aggiorna budget
curl -X PUT http://localhost:3001/api/market/budgets/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transfer_spent": "2000000",
    "wage_spent": "500000"
  }'

# Calcola speso
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/budgets/1/spent

# Calcola rimanente
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/budgets/1/remaining
```

## ✅ Verifica Risposte

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Descrizione errore"
}
```

## 🔍 Debug

Se ricevi errori, verifica:

1. **401 Unauthorized**: Token JWT non valido o scaduto
2. **403 Forbidden**: Ruolo utente non autorizzato (serve DIRECTOR_SPORT o ADMIN)
3. **404 Not Found**: 
   - Endpoint sbagliato
   - Feature flag `FEATURE_MARKET_MODULE` non attivo
   - Risorsa (target, negotiation, offer, budget) non trovata per il team
4. **500 Internal Server Error**: Errore server, controlla i log con `npm start`

## 📝 Log Server

Per vedere i log dettagliati delle richieste:
```bash
cd server
npm start

# Cerca questi pattern nei log:
# 🟢 [INFO] Request received
# 🔵 [DEBUG] Processing...
# 🔴 [ERROR] Error occurred
```

## 🧰 Strumenti Consigliati

- **Postman**: Import collection con endpoints
- **Thunder Client** (VS Code): Extension per test API
- **curl**: Da terminale (come negli esempi sopra)

## 🎯 Quick Test Script

Crea un file `test-market.sh`:

```bash
#!/bin/bash

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Token (sostituisci con il tuo)
TOKEN="your-token-here"

echo "🧪 Testing Market API..."

# Test Targets
echo -e "\n${GREEN}1. Testing Targets${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/targets | jq

# Test Negotiations
echo -e "\n${GREEN}2. Testing Negotiations${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/negotiations | jq

# Test Offers
echo -e "\n${GREEN}3. Testing Offers${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/offers | jq

# Test Budgets
echo -e "\n${GREEN}4. Testing Budgets${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/market/budgets | jq

echo -e "\n${GREEN}✅ Tests completed!${NC}"
```

Rendi eseguibile e lancia:
```bash
chmod +x test-market.sh
./test-market.sh
```

---

**Happy Testing! 🚀**

