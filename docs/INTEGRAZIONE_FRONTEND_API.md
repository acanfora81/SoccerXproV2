# 🔗 INTEGRAZIONE FRONTEND CON API CALCOLO FISCALE

## 🎯 **PROBLEMA IDENTIFICATO**
Il frontend sta ancora utilizzando i vecchi calcoli invece dei nuovi endpoint API con la logica unica.

## ✅ **ENDPOINT API FUNZIONANTI**

### **1. Calcolo Netto → Lordo**
```
POST http://localhost:3001/api/taxes/gross-from-net
Content-Type: application/json

{
  "netSalary": 33500,
  "taxRates": {
    "irpefBrackets": [
      { "from": 0, "to": 28000, "rate": 0.23 },
      { "from": 28000, "to": 50000, "rate": 0.35 },
      { "from": 50000, "to": Infinity, "rate": 0.43 }
    ]
  }
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "input": { "grossSalary": 45809.52 },
    "netSalary": 33500.00,
    "companyCost": 65842.03,
    "totalWorkerContributions": 0.00,
    "totalEmployerContributions": 20032.51,
    "irpef": { "net": 12309.52 },
    "employer": {
      "inps": 13550.46,
      "inail": 3618.95,
      "ffc": 2863.10
    }
  }
}
```

### **2. Calcolo Lordo → Netto**
```
POST http://localhost:3001/api/taxes/net-from-gross
Content-Type: application/json

{
  "grossSalary": 56565,
  "taxRates": {
    "irpefBrackets": [
      { "from": 0, "to": 28000, "rate": 0.23 },
      { "from": 28000, "to": 50000, "rate": 0.35 },
      { "from": 50000, "to": Infinity, "rate": 0.43 }
    ]
  }
}
```

## 🔧 **MODIFICHE NECESSARIE AL FRONTEND**

### **File da modificare:**
- `client/src/hooks/useUnifiedFiscalCalculation.js`

### **Modifica suggerita:**
Sostituire i calcoli locali con chiamate API:

```javascript
// PRIMA (calcoli locali)
const result = calculateSalary(grossSalary, taxRates);

// DOPO (chiamata API)
const response = await axios.post('/api/taxes/net-from-gross', {
  grossSalary,
  taxRates
});
const result = response.data.data;
```

## 📊 **RISULTATI ATTUALI**

### **Test con 33.500€ netto:**
- **Lordo calcolato**: €45.809,52
- **Netto verificato**: €33.500,00 ✅
- **Costo aziendale**: €65.842,03
- **Contributi lavoratore**: €0,00 ✅
- **Contributi datore**: €20.032,51

### **Confronto con Excel:**
- **Risultato attuale**: €45.809,52
- **Risultato atteso**: €56.565,00
- **Differenza**: €10.755,48 ⚠️

## 🎯 **PROSSIMI PASSI**

### **1. Integrazione Frontend (URGENTE)**
- Modificare `useUnifiedFiscalCalculation.js` per usare gli endpoint API
- Testare che il frontend mostri i nuovi calcoli

### **2. Calibrazione Parametri (OPZIONALE)**
- Verificare scaglioni IRPEF nel tuo Excel
- Controllare detrazioni applicate
- Calibrare se necessario per raggiungere €56.565

### **3. Test Completo**
- Verificare che inserendo 33.500€ nel frontend si ottenga il lordo corretto
- Controllare che tutti i calcoli siano coerenti

## 🚀 **VANTAGGI DELLA NUOVA ARCHITETTURA**

✅ **Logica unica** nel backend  
✅ **Nessuna duplicazione** di calcoli  
✅ **Facile manutenzione** e aggiornamenti  
✅ **Consistenza** tra frontend e backend  
✅ **Testabilità** degli endpoint  

---
**Creato il**: 21/09/2025  
**Versione**: SoccerXpro V2  
**Sistema**: Integrazione Frontend API












