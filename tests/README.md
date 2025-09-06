# Test Suite - Dashboard Team

Questa cartella contiene una suite completa di test per verificare il corretto funzionamento della dashboard del team, sia per la vista **Squadra** che **Giocatore**.

## 📁 Struttura

```
tests/
├── backend/           # Test per le API del backend
├── frontend/          # Test per il frontend
│   ├── components/    # Test per i componenti React
│   └── integration/   # Test di integrazione frontend-backend
├── integration/       # Test di integrazione end-to-end
└── README.md         # Questo file
```

## 🚀 Come eseguire i test

### Prerequisiti
1. **Server backend in esecuzione** su `http://localhost:3001`
2. **Database connesso** e popolato con dati di test
3. **Node.js** installato

### Test Backend

#### Test Connettività Dashboard
```bash
node tests/backend/test-dashboard-connectivity.js
```

**Cosa testa:**
- ✅ Connettività del server backend
- ✅ Disponibilità degli endpoint team e player
- ✅ Funzionamento dei filtri
- ✅ Performance degli endpoint

#### Test API Dashboard Team (con autenticazione)
```bash
node tests/backend/test-dashboard-team-api.js
```

**Cosa testa:**
- ✅ Panoramica Generale (Sessioni Totali, Allenamenti, Partite, Durata Media, etc.)
- ✅ Carico & Volumi (Distanza Totale, Sprint Totali, Passi Totali)
- ✅ Intensità (Distanza/min, Player Load/min, Sprint per Sessione)
- ✅ Alta Velocità & Sprint (HSR Totale, Sprint Distance Media)
- ✅ Accelerazioni & Decelerazioni (Acc+Dec per Sessione, Impatti Stimati)
- ✅ Cardio & Percezione (HR Medio, HR Max, RPE Medio, Session-RPE Totale)

#### Test API Dashboard Player
```bash
node tests/backend/test-dashboard-player-api.js
```

**Cosa testa:**
- ✅ Tutte le card della dashboard per un giocatore specifico
- ✅ Verifica che i dati del player siano diversi da quelli del team
- ✅ Controllo dei valori attesi (es. 53 allenamenti, 9 partite per Alessandro Canfora)

### Test Frontend

#### Test Componente TeamDashboard
```bash
node tests/frontend/components/test-team-dashboard.js
```

**Cosa testa:**
- ✅ Rendering delle card con dati corretti
- ✅ Rendering delle sezioni (Panoramica, Carico&Volumi, etc.)
- ✅ Switch tra vista Team e Player
- ✅ Formattazione dei numeri
- ✅ Gestione degli errori
- ✅ Responsività del layout

#### Test Sistema Filtri
```bash
node tests/frontend/components/test-filters.js
```

**Cosa testa:**
- ✅ Validazione dei filtri (periodo, date, sessionType, ruoli)
- ✅ Costruzione della query per il backend
- ✅ Parsing dei filtri dall'URL
- ✅ Sincronizzazione con l'URL
- ✅ Gestione degli stati

#### Test Integrazione Frontend-Backend
```bash
node tests/frontend/integration/test-dashboard-integration.js
```

**Cosa testa:**
- ✅ Flusso completo Team Dashboard
- ✅ Flusso completo Player Dashboard
- ✅ Sincronizzazione filtri frontend-backend
- ✅ Gestione degli errori
- ✅ Performance dell'integrazione

### Test di Integrazione

#### Test Dashboard Completa
```bash
node tests/integration/test-dashboard-complete.js
```

**Cosa testa:**
- ✅ Disponibilità di entrambi gli endpoint (team e player)
- ✅ Struttura corretta dei dati di risposta
- ✅ Coerenza dei dati tra team e player
- ✅ Funzionamento dei filtri (custom, month, week)
- ✅ Performance degli endpoint (< 5 secondi)

## 📊 Card Testate

### Panoramica Generale
- **Sessioni Totali** - Numero totale di sessioni
- **Allenamenti Totali** - Numero di allenamenti
- **Partite Disputate** - Numero di partite
- **Durata Media Sessione** - Durata media in minuti
- **Distanza Media Squadra** - Distanza media in metri
- **Player Load Medio** - Player load medio
- **Velocità Max Media** - Velocità massima media in km/h

### Carico & Volumi
- **Distanza Totale** - Distanza totale percorsa in metri
- **Sprint Totali** - Numero totale di sprint
- **Passi Totali** - Numero totale di passi

### Intensità
- **Distanza/min** - Distanza per minuto in m/min
- **Player Load/min** - Player load per minuto
- **Sprint per Sessione** - Numero medio di sprint per sessione

### Alta Velocità & Sprint
- **HSR Totale** - High Speed Running totale in metri
- **Sprint Distance Media** - Distanza media degli sprint

### Accelerazioni & Decelerazioni
- **Acc+Dec per Sessione** - Accelerazioni e decelerazioni per sessione
- **Impatti Stimati** - Numero totale di impatti stimati

### Cardio & Percezione
- **HR Medio Squadra** - Frequenza cardiaca media
- **HR Max Squadra** - Frequenza cardiaca massima
- **RPE Medio** - Rate of Perceived Exertion medio
- **Session-RPE Totale** - Session-RPE totale

## 🔧 Configurazione

### Variabili di Test
I test utilizzano le seguenti variabili configurabili:

```javascript
const BASE_URL = 'http://localhost:3001';
const TEAM_ID = '0d55fc72-e2b7-470a-a0c0-9c506d339928';
const PLAYER_ID = 1; // Alessandro Canfora
```

### Periodo di Test
I test utilizzano il periodo **01/07/2025 - 31/08/2025** per verificare:
- ✅ Inclusione corretta del 31/08
- ✅ Conteggio corretto delle sessioni (62 totali per Alessandro Canfora)
- ✅ Conteggio corretto degli allenamenti (53)
- ✅ Conteggio corretto delle partite (9)

## 📈 Interpretazione dei Risultati

### ✅ Test Passato
- Tutti i valori sono del tipo corretto
- I valori numerici sono >= 0
- I valori attesi corrispondono (es. 53 allenamenti, 9 partite)
- Gli endpoint rispondono in < 5 secondi

### ❌ Test Fallito
- Valori mancanti o di tipo errato
- Valori negativi quando non dovrebbero esserlo
- Valori attesi non corrispondenti
- Errori di connessione o timeout

## 🐛 Troubleshooting

### Errore di Connessione
```
❌ Errore API: 500
```
**Soluzione:** Verificare che il server backend sia in esecuzione su `http://localhost:3001`

### Dati Mancanti
```
❌ Allenamenti Totali: undefined (undefined)
```
**Soluzione:** Verificare che il database sia popolato e che l'endpoint restituisca `eventsSummary`

### Valori Errati
```
❌ Allenamenti Totali: 0 (atteso: 53)
```
**Soluzione:** Verificare che i filtri funzionino correttamente e che i dati del database siano corretti

## 🔄 Aggiornamenti

Per aggiungere nuovi test:

1. **Backend:** Aggiungere nuove funzioni di test in `test-dashboard-team-api.js` o `test-dashboard-player-api.js`
2. **Integrazione:** Aggiungere nuovi test in `test-dashboard-complete.js`
3. **Frontend:** Implementare test in `tests/frontend/` (da creare)

## 📝 Note

- I test utilizzano **ES Modules** (`import`/`export`)
- I test sono **asincroni** e utilizzano `async/await`
- I test includono **logging dettagliato** per il debugging
- I test verificano sia la **struttura** che i **valori** dei dati
