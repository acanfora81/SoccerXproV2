# 🔍 MARKET AGENTS - Chiarezza Tabelle

## 📋 **SITUAZIONE ATTUALE**

Hai ragione! In Supabase ci sono **due tabelle**:

1. **`market_agent`** (senza 's') - ❌ **NON ESISTE** nel database
2. **`market_agents`** (con 's') - ✅ **ESISTE** nel database

## 🔍 **SPIEGAZIONE**

### **Schema Prisma vs Database Fisico:**

```prisma
// Nel file schema.prisma
model market_agent {          // ← Nome del modello Prisma
  id Int @id @default(autoincrement())
  // ... altri campi
  @@map("market_agents")      // ← Nome della tabella nel database
}
```

- **`market_agent`** = Nome del modello in Prisma (senza 's')
- **`market_agents`** = Nome della tabella nel database (con 's')

## ✅ **TABELLA CORRETTA DA USARE**

La tabella corretta è **`market_agents`** (con 's').

## 🔧 **PROBLEMA IDENTIFICATO**

Il problema non è il nome della tabella, ma che:

1. ✅ **Tabella `market_agents` esiste**
2. ❌ **Colonna `agentId` NON esiste in `market_targets`**
3. ❌ **Foreign key constraint mancante**

## 🚀 **SOLUZIONE**

### **1. Script SQL Creato:**
Ho creato il file `server/fix_market_targets_agent_column.sql` che:
- Aggiunge la colonna `agentId` a `market_targets`
- Crea la foreign key constraint
- Aggiunge un indice per le performance

### **2. Esegui lo Script:**
```sql
-- Esegui questo script in Supabase SQL Editor
ALTER TABLE soccerxpro.market_targets 
ADD COLUMN IF NOT EXISTS "agentId" INTEGER;

ALTER TABLE soccerxpro.market_targets 
ADD CONSTRAINT IF NOT EXISTS "market_targets_agentId_fkey" 
FOREIGN KEY ("agentId") REFERENCES soccerxpro.market_agents(id);
```

### **3. Riabilita il Codice:**
Dopo aver eseguito lo script, rimuovi i commenti dal file `targetsService.js`:
```javascript
// Prima (commentato)
// agent: true,

// Dopo (riabilitato)
agent: true,
```

## 🧪 **VERIFICA**

Dopo aver eseguito lo script, verifica che:
1. La colonna `agentId` esiste in `market_targets`
2. La foreign key constraint è creata
3. La pagina obiettivi funziona senza errori
4. Le funzionalità degli agenti sono riabilitate

## 📋 **RIEPILOGO**

- ✅ **Tabella corretta**: `market_agents` (con 's')
- ❌ **Problema**: Colonna `agentId` mancante in `market_targets`
- 🔧 **Soluzione**: Esegui lo script SQL per aggiungere la colonna
- 🚀 **Risultato**: Funzionalità agenti completamente operative

La discrepanza che hai notato è normale - Prisma usa nomi diversi per modelli e tabelle!


