# 🔍 SCHEMA SCOUTING - VERIFICA COMPATIBILITÀ

## ✅ MODELLI PRISMA DISPONIBILI

### Modelli Enterprise (Schema v2 - market_scouting*)
Questi sono i modelli che **DEVI USARE** per il prompt fornito:

```typescript
// File: server/src/modules/scouting/modelRefs.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ScoutingModels = {
  // Modelli principali
  Prospect: prisma.scoutingProspect,       // Tabella: market_scouting
  Report: prisma.scoutingReport,           // Tabella: market_scouting_report
  Shortlist: prisma.scoutingShortlist,     // Tabella: market_scouting_shortlist
  ShortlistItem: prisma.scoutingShortlistItem, // Tabella: market_scouting_shortlist_item
  EventLog: prisma.scoutingEventLog,       // Tabella: market_scouting_event_log
  Agent: prisma.agent,                     // Tabella: market_agent
  
  // Per integrazione con modulo Market
  Target: prisma.market_target,            // Tabella: market_targets
  Negotiation: prisma.market_negotiation,  // Tabella: market_negotiations
  Offer: prisma.market_offer,              // Tabella: market_offers
};

export const ScoutingEnums = {
  Status: ['DISCOVERY', 'MONITORING', 'ANALYZED', 'TARGETED', 'ARCHIVED'] as const,
};
```

---

## 📋 MAPPING SCHEMA → PROMPT

### 1. ScoutingProspect (market_scouting)
**Compatibilità: ✅ PERFETTA**

| Campo Prompt | Campo Schema | Tipo | Note |
|-------------|--------------|------|------|
| firstName | firstName | String | ✅ |
| lastName | lastName | String | ✅ |
| fullName | fullName | String? | ✅ |
| birthDate | birthDate | DateTime? | ✅ |
| nationality | nationality | String? | ✅ |
| position | position | String? | ✅ |
| secondaryPosition | secondaryPosition | String? | ✅ |
| preferredFoot | preferredFoot | String? | ✅ |
| heightCm | heightCm | Int? | ✅ |
| weightKg | weightKg | Int? | ✅ |
| currentClub | currentClub | String? | ✅ |
| contractUntil | contractUntil | DateTime? | ✅ |
| agentId | agentId | String @db.Uuid | ✅ |
| marketValue | marketValue | Float? | ✅ |
| potentialScore | potentialScore | Float? | ✅ |
| scoutingStatus | scoutingStatus | ScoutingStatus | ✅ |
| notes | notes | String? | ✅ |
| teamId | teamId | String @db.Uuid | ✅ Multi-tenant |
| createdById | createdById | Int | ✅ Riferisce UserProfile.id |
| updatedById | updatedById | Int? | ✅ |

### 2. ScoutingReport (market_scouting_report)
**Compatibilità: ✅ PERFETTA**

| Campo Prompt | Campo Schema | Tipo | Note |
|-------------|--------------|------|------|
| prospectId | prospectId | String @db.Uuid | ✅ |
| matchDate | matchDate | DateTime? | ✅ |
| opponent | opponent | String? | ✅ |
| competition | competition | String? | ✅ |
| rolePlayed | rolePlayed | String? | ✅ |
| minutesPlayed | minutesPlayed | Int? | ✅ |
| techniqueScore | techniqueScore | Float? | ✅ 0-10 |
| tacticsScore | tacticsScore | Float? | ✅ 0-10 |
| physicalScore | physicalScore | Float? | ✅ 0-10 |
| mentalityScore | mentalityScore | Float? | ✅ 0-10 |
| totalScore | totalScore | Float? | ✅ Media automatica |
| summary | summary | String? | ✅ Max 5k |
| videoLink | videoLink | String? | ✅ URL |
| attachmentUrl | attachmentUrl | String? | ✅ URL |

### 3. ScoutingShortlist (market_scouting_shortlist)
**Compatibilità: ✅ PERFETTA**

| Campo Prompt | Campo Schema | Tipo | Note |
|-------------|--------------|------|------|
| name | name | String | ✅ |
| description | description | String? | ✅ |
| category | category | String? | ✅ "Under 23", "Defenders" |
| isArchived | isArchived | Boolean | ✅ default false |

### 4. ScoutingEventLog (market_scouting_event_log)
**Compatibilità: ✅ PERFETTA**

| Campo Prompt | Campo Schema | Tipo | Note |
|-------------|--------------|------|------|
| prospectId | prospectId | String @db.Uuid | ✅ |
| action | action | String | ✅ "CREATE", "UPDATE", etc. |
| description | description | String? | ✅ |
| fromStatus | fromStatus | ScoutingStatus? | ✅ |
| toStatus | toStatus | ScoutingStatus? | ✅ |

### 5. Agent (market_agent)
**Compatibilità: ✅ PERFETTA**

| Campo Prompt | Campo Schema | Tipo | Note |
|-------------|--------------|------|------|
| firstName | firstName | String | ✅ |
| lastName | lastName | String | ✅ |
| email | email | String? | ✅ |
| phone | phone | String? | ✅ |
| company | company | String? | ✅ |
| licenseNumber | licenseNumber | String? | ✅ |
| country | country | String? | ✅ |

---

## ⚠️ PUNTI DI ATTENZIONE

### 1. **UserProfile vs User**
- ✅ **RISOLTO**: Tutti i riferimenti ora puntano a `UserProfile` (Int)
- Il campo `createdById` è di tipo `Int` e riferisce `UserProfile.id`
- Relazioni nominate per evitare conflitti (es: `@relation("ScoutingProspectCreatedBy")`)

### 2. **Dual Schema Scouting**
- ⚠️ **ATTENZIONE**: Abbiamo **DUE moduli scouting** nello schema:
  - **Scouting v1**: Modelli `scouting_*` (scout, session, report, rubric, ecc.)
  - **Scouting v2 Enterprise**: Modelli `ScoutingProspect`, `ScoutingReport`, ecc.

**RACCOMANDAZIONE**: Per il prompt fornito, usa **SOLO i modelli v2 Enterprise** (`ScoutingProspect`, etc.). I modelli v1 possono essere ignorati o rimossi in futuro.

### 3. **Mapping Tabelle**
```
ScoutingProspect      → market_scouting
ScoutingReport        → market_scouting_report
ScoutingShortlist     → market_scouting_shortlist
ScoutingShortlistItem → market_scouting_shortlist_item
ScoutingEventLog      → market_scouting_event_log
Agent                 → market_agent
```

### 4. **Integrazione con Market Module**
Per "Promuovi a Target", usa:
```typescript
// Modello esistente per creare target di mercato
prisma.market_target.create({
  data: {
    teamId: prospect.teamId,
    // ... snapshot dati da prospect
    // Riferimento al prospect originale (se esiste un campo)
  }
});
```

---

## 🎯 CHECKLIST IMPLEMENTAZIONE

### Backend
- [ ] Creare `server/src/modules/scouting/modelRefs.ts` con export dei modelli reali
- [ ] Validators Zod con i campi esatti dello schema
- [ ] Services: verificare che **tutti** i campi UUID siano gestiti correttamente
- [ ] Multi-tenancy: `where: { teamId }` in **TUTTE** le query
- [ ] Audit: `createdById`, `updatedById` valorizzati (Int, non UUID string)
- [ ] EventLog: scrivere su ogni create/update/status change
- [ ] Promote service: crea/aggiorna `market_target`

### Frontend
- [ ] API client: usare endpoint corretti (`/api/scouting/...`)
- [ ] Componenti: gestire UUID per IDs (non Int)
- [ ] Forms: validazione campi opzionali
- [ ] StatusBadge: enum `ScoutingStatus` (5 valori)

---

## ✅ VALIDAZIONE FINALE

**Schema compatibile con prompt?** ✅ **SÌ**

**Campi mancanti?** ❌ **NESSUNO**

**Conflitti di tipo?** ✅ **RISOLTI** (User → UserProfile)

**Multi-tenancy supportato?** ✅ **SÌ** (teamId presente in tutti i modelli)

**Pronto per sviluppo?** ✅ **SÌ**

---

## 📝 NOTE AGGIUNTIVE

1. **Prisma Client rigenerato**: ✅ Completato con successo
2. **Relazioni inverse**: ✅ Aggiunte a `Team` e `UserProfile`
3. **Enum ScoutingStatus**: ✅ Con `@@schema("soccerxpro")`
4. **Nomi modelli**: I modelli Prisma usano **PascalCase** (`ScoutingProspect`), le tabelle usano **snake_case** (`market_scouting`)

**Prossimi passi consigliati**:
1. Implementare `modelRefs.ts` come mostrato sopra
2. Creare validators Zod
3. Implementare services con multi-tenancy
4. Creare controllers e routes
5. Implementare frontend pages

---

**CONCLUSIONE**: Lo schema è **COMPLETAMENTE COMPATIBILE** con il prompt fornito e pronto per l'implementazione! 🚀

