# 🧮 Fiscal Setup V2 - Architettura Parlante DB-Driven

## 📋 Panoramica

Implementazione completa di un sistema fiscale configurabile, parlante e DB-driven per la gestione di aliquote, contributi e parametri fiscali.

## ✅ Cosa È Stato Implementato

### 1. **Schema Database (Prisma)** ✅
Nuovi modelli con nomenclatura parlante:

- **`tax_rate_v2`**: Aliquote contributive worker/employer (INPS, FFC, INAIL, Solidarietà, Fondo)
- **`tax_contribution_profile`**: Modalità calcolo contributi (LOOKUP/PIECEWISE)
- **`tax_contribution_point`**: Punti lookup contributi (x=lordo, y=contributi)
- **`tax_contribution_bracket`**: Scaglioni contributi piecewise
- **`tax_irpef_detraction_override`**: Override detrazioni IRPEF art.13 (punti x/y)
- **`tax_regional_additional`**: Addizionale regionale unificata
- **`tax_regional_additional_bracket_v2`**: Scaglioni addizionale regionale
- **`tax_municipal_additional`**: Addizionale comunale unificata
- **`tax_municipal_additional_bracket_v2`**: Scaglioni addizionale comunale
- **`tax_bonus_l207_band`**: Bande bonus L.207/2019 (sconto IRPEF %)
- **`tax_extra_deduction_l207`**: Ulteriore detrazione L.207 (full/full_to/fade_to)

**Status**: ✅ Schema aggiornato, client Prisma generato

### 2. **Motore di Calcolo** ✅
File: `server/src/lib/tax/engine-dynamic.js`

**Funzionalità**:
- `computeFromLordoDynamic()`: Calcolo Lordo → Netto
- `computeFromNettoDynamic()`: Calcolo Netto → Lordo (binary search)
- `transformBracketRows()`: Trasforma DB rows in formato motore
- `transformPoints()`: Trasforma punti lookup
- `transformL207Bands()`: Trasforma bande L.207
- `calcContrib()`: Calcolo contributi (lookup o piecewise)
- `calcIRPEF()`: IRPEF progressiva
- `calcDetraction()`: Detrazioni art.13 (standard o override)
- `calcAdditional()`: Addizionali (flat o progressive)
- `calcL207()`: Bonus L.207 con sconto IRPEF + ulteriore detrazione

### 3. **Loader Fiscale** ✅
File: `server/src/services/fiscalProfileLoader.js`

**Funzione**: `loadFiscalProfile({ teamId, year, contractType, region, municipality })`

Carica da DB e costruisce l'oggetto parametri per il motore dinamico:
- Rates contributivi (worker/employer)
- Modalità e dati contributi (lookup/piecewise)
- Scaglioni IRPEF
- Override detrazioni
- Bande L.207 + ulteriore detrazione
- Addizionali regionale/comunale

**Output**: Oggetto parlante per `engine-dynamic.js`

### 4. **API Backend** ✅

#### Rotte Setup (CRUD wizard)
File: `server/src/routes/fiscalSetup.js`

Endpoint montato su `/api/fiscal-setup`:

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/status` | GET | Ritorna stato completamento configurazione |
| `/step/rates` | POST | Salva aliquote base worker/employer |
| `/step/contributions` | POST | Salva profilo contributi (mode + points/brackets) |
| `/step/irpef` | POST | Salva scaglioni IRPEF |
| `/step/regional` | POST | Salva addizionale regionale |
| `/step/municipal` | POST | Salva addizionale comunale |
| `/step/l207` | POST | Salva bande L.207 + ulteriore detrazione |
| `/copy-from-year` | POST | Duplica configurazione da un anno all'altro |

#### Rotte Calcolo V2
File: `server/src/routes/taxes.js`

Nuovi endpoint DB-driven:

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/v2/net-from-gross` | POST | Lordo → Netto (usa loadFiscalProfile + engine) |
| `/v2/gross-from-net` | POST | Netto → Lordo (usa loadFiscalProfile + engine) |

**Nota**: Gli endpoint legacy `/net-from-gross` e `/gross-from-net` sono mantenuti per retrocompatibilità.

### 5. **Frontend - Pagina Configurazione** ✅
File: `client_v3/src/features/taxes/FiscalSetupPage.jsx`

**Funzionalità**:
- **Context Provider**: Condivide stato (teamId, year, contractType, region, municipality) tra step
- **Progress Indicator**: Mostra completamento configurazione
- **Tabs Navigation**: 6 step guidati

#### Step Components

| Step | File | Funzionalità |
|------|------|--------------|
| **Aliquote** | `RatesStep.jsx` | Input aliquote INPS/FFC/INAIL worker/employer, modalità contributi |
| **IRPEF** | `IrpefStep.jsx` | Gestione scaglioni IRPEF progressivi |
| **Regionale** | `RegionalStep.jsx` | Addizionale regionale (flat/progressiva) |
| **Comunale** | `MunicipalStep.jsx` | Addizionale comunale (flat/progressiva) |
| **L.207** | `L207Step.jsx` | Bande sconto IRPEF + ulteriore detrazione |
| **Riepilogo** | `ReviewStep.jsx` | Test calcolo Netto→Lordo con API V2 |

### 6. **Routing & Menu** ✅

**Router**: `client_v3/src/app/router.jsx`
```javascript
{ path: "dashboard/tax/fiscal-setup", element: <FiscalSetupPage /> }
```

**Sidebar**: `client_v3/src/app/layout/Sidebar.jsx`
```javascript
{
  id: 'fiscal-setup',
  label: '⚙️ Configurazione Fiscale',
  path: '/dashboard/tax/fiscal-setup',
  requiredPermission: 'contracts:write'
}
```

## 🔄 Flusso di Utilizzo

1. **Configurazione**:
   - Accedi a `/dashboard/tax/fiscal-setup`
   - Seleziona Anno, Tipo Contratto, Regione, Comune
   - Compila gli step: Aliquote → IRPEF → Regionale → Comunale → L.207
   - Testa il calcolo nel tab "Riepilogo"

2. **Calcolo nei Contratti**:
   - L'hook `useUnifiedFiscalCalculation` chiama `/api/taxes/v2/gross-from-net` o `/v2/net-from-gross`
   - Il backend usa `loadFiscalProfile` per caricare i parametri dal DB
   - Il motore `engine-dynamic` esegue il calcolo
   - Ritorna: gross, net, contributi worker/employer, costo azienda, breakdown fiscale

## 📊 Vantaggi Architettura

### Parlante
- Nomenclatura chiara: `inpsWorkerPct`, `inailEmployerPct`, ecc.
- Ogni campo dice chi lo paga e cosa rappresenta
- UI con tooltip esplicativi

### DB-Driven
- Zero logiche hardcoded
- Configurazione completamente a DB
- Modifiche normative = update DB, non codice

### Modulare
- Motore calcolo (`engine-dynamic.js`) separato da loader (`fiscalProfileLoader.js`)
- API V2 separate da legacy (backward compatibility)
- Step UI indipendenti

### Testabile
- Tab "Riepilogo" per test immediato
- Endpoint `/status` per validazione configurazione
- Log dettagliati in loader e motore

## 🚀 Prossimi Passi

### Quando DB Disponibile
```bash
# Genera migrazione
cd server
npx prisma migrate dev --name fiscal_setup_v2_parlante

# Applica migrazione
npx prisma migrate deploy
```

### Popolamento Iniziale
Usa `/api/fiscal-setup/copy-from-year` per duplicare configurazioni esistenti oppure popola manualmente tramite UI.

### Migrazione Graduale
1. Popola `tax_rate_v2` con dati da `TaxRate` legacy
2. Aggiorna frontend per usare `/v2/` endpoints
3. Depreca endpoint legacy quando tutti migrati

## 📝 Note Tecniche

- **Prisma Client**: Generato con successo ✅
- **Conflitti naming**: Risolti (`tax_rate` → `tax_rate_v2`, map: `tax_rates_v2`)
- **Binary Search**: Utilizzata in `computeFromNettoDynamic` per convergenza Netto→Lordo
- **Interpolazione Lineare**: Usata in mode LOOKUP per punti contributi
- **Scaglioni Progressivi**: Supportati in IRPEF, addizionali, contributi

## 🐛 Fix Precedenti Integrati

✅ Worker contributions breakdown corretto (inps/ffc/solidarity separati)  
✅ Solidarity employer letto da DB  
✅ Addizionali con fallback (is_default o primo disponibile)  
✅ True gross calculation per employer contributions  
✅ Detrazioni art.13 gestite correttamente nel netto→lordo  

## 📚 File Modificati/Creati

### Backend
- ✅ `server/prisma/schema.prisma` (nuovi modelli V2)
- ✅ `server/src/lib/tax/engine-dynamic.js` (nuovo)
- ✅ `server/src/services/fiscalProfileLoader.js` (nuovo)
- ✅ `server/src/routes/fiscalSetup.js` (nuovo)
- ✅ `server/src/routes/taxes.js` (endpoint V2 aggiunti)
- ✅ `server/src/app.js` (mount fiscalSetup routes)

### Frontend
- ✅ `client_v3/src/features/taxes/FiscalSetupPage.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/RatesStep.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/IrpefStep.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/RegionalStep.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/MunicipalStep.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/L207Step.jsx` (nuovo)
- ✅ `client_v3/src/features/taxes/steps/ReviewStep.jsx` (nuovo)
- ✅ `client_v3/src/app/router.jsx` (route aggiunta)
- ✅ `client_v3/src/app/layout/Sidebar.jsx` (menu aggiornato)

---

**Implementazione completata il**: 15 Ottobre 2025  
**Stato**: ✅ Pronto per migrazione DB e test end-to-end


