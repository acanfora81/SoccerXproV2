# SISTEMA CALCOLO FISCALE UNIFICATO

## 📋 **File Inclusi**

### **Backend (Server)**
- `taxCalculator.js` - **MOTORE PRINCIPALE** del calcolo fiscale
- `taxes.js` - API routes per i calcoli fiscali
- `contracts.js` - Controller per la gestione contratti

### **Frontend (Client)**
- `useUnifiedFiscalCalculation.js` - Hook React per i calcoli fiscali
- `NewContractModal.jsx` - Componente per creazione/editing contratti
- `italianNumbers.js` - Utility per parsing numeri italiani

## 🎯 **Sistema Unificato con TaxCalculator**

### **Caratteristiche Principali:**
- ✅ **Database-first** con fallback robusti
- ✅ **Calcolo diretto** netto → lordo (nessuna ricerca binaria)
- ✅ **Gestione parametri mancanti** (year, region, municipality)
- ✅ **Scaglioni IRPEF** e addizionali dal database
- ✅ **Logica generica** (non dipende da Excel)

### **API Endpoints:**
- `POST /api/taxes/net-from-gross` - Lordo → Netto
- `POST /api/taxes/gross-from-net` - Netto → Lordo (calcolo diretto)

## 🔧 **Funzioni Principali**

### **taxCalculator.js**
- `calcolaStipendioCompleto()` - Calcolo lordo → netto
- `calcolaLordoDaNetto()` - Calcolo diretto netto → lordo
- `calcolaIrpef()` - Calcolo IRPEF con scaglioni
- `calcolaAddizionali()` - Calcolo addizionali regionali/comunali

### **useUnifiedFiscalCalculation.js**
- `calculateSalaryFromNet()` - Chiama API per netto → lordo
- `calculateSalaryFromGross()` - Chiama API per lordo → netto
- `calculateBonusTax()` - Calcolo tasse bonus

## 📊 **Formula Calcolo Diretto**

```
Netto = Lordo - ContributiLavoratore - IRPEF - Addizionali
Lordo = (Netto + IRPEF + Addizionali) / (1 - TassiLavoratore)
```

### **Contributi Lavoratore:**
- INPS: 9.19%
- FFC: 1.25%
- Solidarietà: 0.50%
- **Totale: 10.94%**

### **Contributi Datore:**
- INPS: 29.58%
- INAIL: 7.90%
- FFC: 6.25%
- **Totale: 43.73%**

## 🗄️ **Database Tables**

### **IRPEF Brackets:**
- `tax_irpef_bracket` - Scaglioni IRPEF per anno

### **Tax Config:**
- `tax_config` - Configurazioni fiscali (detrazioni, ecc.)

### **Addizionali:**
- `tax_regional_additional` - Addizionali regionali
- `tax_municipal_additional` - Addizionali comunali
- `tax_regional_additional_scheme` - Schemi addizionali regionali
- `tax_municipal_additional_rule` - Regole addizionali comunali

## 🚀 **Vantaggi del Sistema Unificato**

1. ✅ **Performance** - Calcolo diretto istantaneo
2. ✅ **Precisione** - Netto esatto senza approssimazioni
3. ✅ **Robustezza** - Fallback per parametri mancanti
4. ✅ **Manutenibilità** - Un solo motore di calcolo
5. ✅ **Scalabilità** - Facile aggiunta di nuove funzionalità

## 🔍 **Debug e Logs**

Il sistema include logging dettagliato per:
- Calcoli IRPEF e addizionali
- Accesso al database
- Fallback utilizzati
- Errori e eccezioni

## 📝 **Note per lo Sviluppo**

- Tutti i calcoli usano `round2()` per precisione
- Gestione automatica di `year: undefined`
- Fallback hardcoded per parametri mancanti
- Compatibilità con frontend esistente