# Aggiornamento Aliquote Fiscali 2025

## 🎯 **PROBLEMA RISOLTO**
Il calcolo stipendio lordo/netto mostrava un netto troppo basso per colpa di aliquote contributive sbagliate.

### **❌ PRIMA (SBAGLIATE):**
- **PROFESSIONAL**: INPS 29.58% + INAIL 7.9% + FFC 6.25% = **43.73% totale**
- **APPRENTICESHIP**: INPS 11.61% + FFC 6.25% = **17.86% totale**

**Esempio**: 12.500€ lordi → 7.034€ netti ❌ (Troppo basso!)

### **✅ DOPO (CORRETTE 2025):**
- **PROFESSIONAL**: INPS 9.19% + INAIL 0.5% + FFC 6.25% = **15.94% totale**
- **APPRENTICESHIP**: INPS 5.84% + FFC 6.25% = **12.09% totale**
- **AMATEUR**: Solo FFC 6.25% = **6.25% totale**

**Esempio**: 12.500€ lordi → 10.507€ netti ✅ (Molto più ragionevole!)

## 📂 **FILE MODIFICATI:**

### **Backend:**
1. **`server/src/routes/contracts/contractsSummary.js`**
   - Aggiornate aliquote hardcoded per calcolo riepilogo contratti

2. **`server/prisma/migrations/20250120_update_tax_rates_2025/migration.sql`**
   - Migrazione per aggiornare aliquote nel database
   - Inserisce aliquote corrette per tutti i team

3. **`server/update-tax-rates-2025.sql`**
   - Script di aggiornamento diretto del database

### **Documentazione:**
4. **`docs/TAX_RATES_UPDATE_2025.md`** (questo file)
   - Documentazione completa delle modifiche

## 🎯 **ALIQUOTE 2025 CORRETTE:**

| Tipo Contratto | INPS | INAIL | FFC | Totale |
|----------------|------|-------|-----|--------|
| **PROFESSIONAL** | 9.19% | 0.5% | 6.25% | **15.94%** |
| **APPRENTICESHIP** | 5.84% | 0% | 6.25% | **12.09%** |
| **AMATEUR** | 0% | 0% | 6.25% | **6.25%** |

## 📋 **COME APPLICARE LE MODIFICHE:**

1. **Backend già aggiornato** ✅
2. **Eseguire migrazione database**:
   ```bash
   npx prisma db push
   ```
3. **Riavviare server** per applicare le nuove aliquote
4. **Testare calcolo** con 12.500€ lordi → dovrebbe dare ~10.507€ netti

## 🧮 **ESEMPIO CALCOLO CORRETTO:**

```
Stipendio Lordo: 12.500€

PROFESSIONAL:
- INPS (9.19%): 12.500 × 9.19% = 1.149€
- INAIL (0.5%): 12.500 × 0.5% = 63€
- FFC (6.25%): 12.500 × 6.25% = 781€
- Totale Contributi: 1.993€
- STIPENDIO NETTO: 12.500 - 1.993 = 10.507€ ✅
```

## 🔍 **NOTE TECNICHE:**

- Le aliquote sono specifiche per il **settore calcistico**
- Solo la **parte a carico del lavoratore** viene detratta dal lordo
- Le aliquote **datore di lavoro** (es. INPS 30%) non influenzano il netto
- **FFC (6.25%)** rimane invariato per tutti i tipi di contratto

## ✅ **RISULTATO:**
Ora il calcolo stipendiale è **realistico e conforme** alle normative del calcio italiano 2025!



