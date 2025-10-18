# 🔍 GUIDA MIGRAZIONE MODULO SCOUT

## 📋 PANORAMICA

Questa guida descrive il processo completo di migrazione del modulo Scout dal vecchio schema alle nuove tabelle con prefisso `scout_*`.

## 🎯 OBIETTIVI

- ✅ **Pulizia completa** delle tabelle scouting esistenti
- ✅ **Nuovo schema** con prefisso `scout_*` per organizzazione
- ✅ **Flusso semplificato**: DISCOVERY → MONITORING → SESSION → REPORT → EVALUATED → TARGETED
- ✅ **8 tabelle core** invece di 15+ tabelle complesse

## 📊 NUOVE TABELLE

### **Core Tables**
1. **scout_prospects** - Giocatori in osservazione (core)
2. **scout_sessions** - Sessioni di osservazione
3. **scout_reports** - Report di valutazione
4. **scout_evaluations** - Valutazioni del DS
5. **scout_followups** - Follow-up operativi
6. **scout_event_logs** - Audit trail completo
7. **scout_watchlists** - Watchlist personali scout
8. **scout_agents** - Agenti/procuratori

## 🚀 PROCESSO DI MIGRAZIONE

### **STEP 1: Backup (Opzionale)**

Se hai dati da salvare:

```sql
-- Backup tabelle esistenti
CREATE TABLE scouting_prospects_backup AS SELECT * FROM soccerxpro.market_scouting;
CREATE TABLE scouting_reports_backup AS SELECT * FROM soccerxpro.market_scouting_report;
```

### **STEP 2: Pulizia Tabelle Esistenti**

Esegui lo script di pulizia in Supabase SQL Editor:

```bash
server/cleanup_scouting_tables.sql
```

Questo script:
- ✅ Rimuove tutte le tabelle scouting esistenti
- ✅ Rimuove enum e tipi personalizzati
- ✅ Verifica la pulizia completata

### **STEP 3: Creazione Nuove Tabelle**

Esegui lo script di creazione in Supabase SQL Editor:

```bash
server/create_scout_tables.sql
```

Questo script:
- ✅ Crea tutte le tabelle scout_*
- ✅ Crea indici per performance
- ✅ Abilita RLS per sicurezza
- ✅ Configura trigger per updated_at

### **STEP 4: Aggiornamento Schema Prisma**

Lo schema Prisma è già stato aggiornato con le nuove tabelle. Rigenera il client:

```bash
cd server
npx prisma generate
npx prisma db pull  # Sincronizza con il database
```

### **STEP 5: Aggiornamento Backend**

Il backend deve essere aggiornato per usare i nuovi modelli:

#### **Modelli Prisma**
- ❌ `ScoutingProspect` → ✅ `ScoutProspect`
- ❌ `ScoutingReport` → ✅ `ScoutReport`
- ❌ `ScoutingEventLog` → ✅ `ScoutEventLog`

#### **Servizi da Aggiornare**
```bash
server/src/modules/scouting/services/
├── prospect.service.js    # Aggiornare riferimenti modelli
├── report.service.js      # Aggiornare riferimenti modelli
├── eventLog.service.js    # Aggiornare riferimenti modelli
└── promote.service.js     # Aggiornare riferimenti modelli
```

### **STEP 6: Aggiornamento Frontend**

Il frontend deve essere aggiornato per usare i nuovi endpoint:

#### **Pagine da Aggiornare**
```bash
client_v3/src/pages/scouting/
├── ProspectsPage.jsx      # Aggiornare struttura dati
├── ProspectDetailPage.jsx # Aggiornare struttura dati
├── SessionsPage.jsx       # Aggiornare struttura dati
└── ReportsPage.jsx        # Aggiornare struttura dati
```

## 📐 SCHEMA DATI

### **scout_prospects**

```javascript
{
  id: uuid,
  teamId: uuid,
  createdById: int,
  
  // Identità
  firstName: string,
  lastName: string,
  fullName: string,
  birthDate: date,
  nationalityPrimary: string,
  
  // Profilo calcistico
  mainPosition: string,
  secondaryPositions: json,
  heightCm: int,
  weightKg: int,
  
  // Club & mercato
  currentClub: string,
  contractUntil: date,
  marketValue: float,
  agentId: uuid,
  
  // Valutazioni
  overallScore: float,
  potentialScore: float,
  status: string, // DISCOVERY, MONITORING, ANALYZED, EVALUATED, TARGETED
  
  // Link
  playerId: int,
  targetId: int,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **scout_sessions**

```javascript
{
  id: uuid,
  prospectId: uuid,
  teamId: uuid,
  createdById: int,
  
  observationType: string, // LIVE, VIDEO, TRAINING, TOURNAMENT
  dateObserved: date,
  location: string,
  opponent: string,
  competition: string,
  minutesPlayed: int,
  rolePlayed: string,
  rating: float,
  notes: text,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **scout_reports**

```javascript
{
  id: uuid,
  prospectId: uuid,
  sessionId: uuid,
  teamId: uuid,
  createdById: int,
  
  matchDate: date,
  opponent: string,
  competition: string,
  
  // Valutazioni
  techniqueScore: float,
  tacticsScore: float,
  physicalScore: float,
  mentalityScore: float,
  totalScore: float,
  
  summary: text,
  videoLink: string,
  attachmentUrl: string,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔄 FLUSSO OPERATIVO

```
1. DISCOVERY
   ↓ Scout crea prospect
   
2. MONITORING
   ↓ Scout aggiorna dati
   
3. SESSION
   ↓ Scout osserva partita
   
4. REPORT
   ↓ Scout compila report
   
5. EVALUATED
   ↓ DS valuta prospect
   
6. TARGETED
   ↓ Promozione a market_target
```

## 🔐 SICUREZZA

### **Multi-Tenancy**
- ✅ Tutti i dati filtrati per `teamId`
- ✅ RLS abilitato su tutte le tabelle
- ✅ Isolamento completo tra team

### **RBAC**
- ✅ SCOUT: Può creare/modificare i suoi dati
- ✅ DIRECTOR_SPORT: Accesso completo + promozione
- ✅ ADMIN: Accesso completo

### **Audit Trail**
- ✅ Ogni azione loggata in `scout_event_logs`
- ✅ Tracciamento completo del flusso
- ✅ Storico cambi di stato

## 📊 PERFORMANCE

### **Indici Ottimizzati**
- ✅ `idx_scout_prospects_team_status` - Query per team e status
- ✅ `idx_scout_prospects_name` - Ricerca per nome
- ✅ `idx_scout_sessions_team_date` - Query sessioni per data
- ✅ `idx_scout_reports_prospect` - Report per prospect

### **Query Ottimizzate**
```javascript
// Esempio query ottimizzata
const prospects = await prisma.scoutProspect.findMany({
  where: {
    teamId: teamId,
    status: 'MONITORING'
  },
  include: {
    sessions: {
      orderBy: { dateObserved: 'desc' },
      take: 5
    },
    reports: {
      orderBy: { createdAt: 'desc' },
      take: 3
    }
  }
});
```

## 🧪 TEST

### **Test Backend**
```bash
cd server
npm test -- --grep "Scout"
```

### **Test Frontend**
```bash
cd client_v3
npm run dev
# Naviga a /dashboard/scouting
```

### **Test Endpoint API**
```bash
# Health check
curl http://localhost:3001/api/scouting/debug

# Lista prospects (con token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/scouting/prospects
```

## 🎯 CHECKLIST MIGRAZIONE

- [ ] **STEP 1**: Backup dati esistenti (se necessario)
- [ ] **STEP 2**: Eseguire `cleanup_scouting_tables.sql` in Supabase
- [ ] **STEP 3**: Eseguire `create_scout_tables.sql` in Supabase
- [ ] **STEP 4**: Rigenerare Prisma client (`npx prisma generate`)
- [ ] **STEP 5**: Aggiornare servizi backend
- [ ] **STEP 6**: Aggiornare componenti frontend
- [ ] **STEP 7**: Testare flusso completo
- [ ] **STEP 8**: Verificare performance
- [ ] **STEP 9**: Deploy in produzione

## 🆘 TROUBLESHOOTING

### **Errore: Tabelle non trovate**
```bash
# Verifica che le tabelle siano state create
SELECT tablename FROM pg_tables 
WHERE schemaname = 'soccerxpro' 
AND tablename LIKE 'scout_%';
```

### **Errore: Foreign key constraint**
```bash
# Verifica che le tabelle di riferimento esistano
SELECT * FROM soccerxpro.teams LIMIT 1;
SELECT * FROM soccerxpro.user_profiles LIMIT 1;
```

### **Errore: Prisma client non aggiornato**
```bash
cd server
npx prisma generate --force
```

## 📚 DOCUMENTAZIONE AGGIUNTIVA

- **Schema Prisma**: `server/prisma/schema.prisma`
- **Script SQL**: `server/cleanup_scouting_tables.sql` e `server/create_scout_tables.sql`
- **Servizi Backend**: `server/src/modules/scouting/services/`
- **Componenti Frontend**: `client_v3/src/pages/scouting/`

## 🎉 RISULTATO FINALE

Dopo la migrazione avrai:
- ✅ **Schema pulito** e organizzato con prefisso `scout_*`
- ✅ **8 tabelle core** invece di 15+ tabelle complesse
- ✅ **Flusso semplificato** e intuitivo
- ✅ **Performance ottimali** con indici appropriati
- ✅ **Sicurezza enterprise** con RLS e multi-tenancy
- ✅ **Audit trail completo** per compliance

---

**Buona migrazione! 🚀**

