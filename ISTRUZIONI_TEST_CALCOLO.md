# 🧪 ISTRUZIONI TEST CALCOLO FISCALE

## 🎯 **OBIETTIVO**
Verificare che i calcoli fiscali del backend siano allineati con il file Excel.

## 🚀 **ENDPOINT CREATI**

### **1. Lordo → Netto**
```
POST http://localhost:3001/api/taxes/net-from-gross
Content-Type: application/json

{
  "grossSalary": 56565,
  "taxRates": {
    "inpsWorker": 9.19,
    "ffcWorker": 1.25,
    "solidarityWorker": 0.50,
    "inpsEmployer": 29.58,
    "inailEmployer": 7.90,
    "ffcEmployer": 6.25,
    "regionalAdditionalRate": 0,
    "municipalAdditionalRate": 0,
    "irpefBrackets": [
      { "from": 0, "to": 28000, "rate": 0.23 },
      { "from": 28000, "to": 50000, "rate": 0.35 },
      { "from": 50000, "to": Infinity, "rate": 0.43 }
    ]
  },
  "opts": { 
    "useExcelModel": true, 
    "includeAdditionals": false 
  }
}
```

### **2. Netto → Lordo**
```
POST http://localhost:3001/api/taxes/gross-from-net
Content-Type: application/json

{
  "netSalary": 33500,
  "taxRates": {
    "inpsWorker": 9.19,
    "ffcWorker": 1.25,
    "solidarityWorker": 0.50,
    "inpsEmployer": 29.58,
    "inailEmployer": 7.90,
    "ffcEmployer": 6.25,
    "regionalAdditionalRate": 0,
    "municipalAdditionalRate": 0,
    "irpefBrackets": [
      { "from": 0, "to": 28000, "rate": 0.23 },
      { "from": 28000, "to": 50000, "rate": 0.35 },
      { "from": 50000, "to": Infinity, "rate": 0.43 }
    ]
  },
  "opts": { 
    "useExcelModel": true, 
    "includeAdditionals": false 
  }
}
```

## 📊 **RISULTATI ATTESI**

### **Test 1: 56.565 lordo → netto**
- **Netto atteso**: ~33.500
- **Contributi lavoratore**: ~6.188
- **IRPEF netta**: ~14.302
- **Costo aziendale**: ~81.300

### **Test 2: 33.500 netto → lordo**
- **Lordo atteso**: ~56.565
- **Contributi datore**: INPS 29.58% + INAIL 7.9% + FFC 6.25% = 43.73%
- **Costo aziendale**: ~81.300

## 🔧 **COME TESTARE**

### **Opzione 1: Script automatico**
```bash
node test-tax-api.cjs
```

### **Opzione 2: Postman/Thunder Client**
1. Avvia il server: `npm run dev` (nella cartella server)
2. Usa gli endpoint sopra con i payload JSON
3. Confronta i risultati con il tuo Excel

### **Opzione 3: cURL**
```bash
# Test lordo → netto
curl -X POST http://localhost:3001/api/taxes/net-from-gross \
  -H "Content-Type: application/json" \
  -d '{"grossSalary": 56565, "opts": {"useExcelModel": true}}'

# Test netto → lordo
curl -X POST http://localhost:3001/api/taxes/gross-from-net \
  -H "Content-Type: application/json" \
  -d '{"netSalary": 33500, "opts": {"useExcelModel": true}}'
```

## 🐛 **SE I RISULTATI NON COINCIDONO**

### **Possibili cause:**
1. **Scaglioni IRPEF** diversi da quelli del tuo Excel
2. **Detrazioni** calcolate diversamente
3. **Addizionali** non disabilitate correttamente
4. **Arrotondamenti** non allineati

### **Soluzioni:**
1. **Verifica scaglioni IRPEF** nel tuo Excel
2. **Controlla detrazioni** applicate
3. **Disabilita addizionali** completamente
4. **Calibra arrotondamenti** se necessario

## 📝 **NOTE**
- Gli endpoint sono configurati per il **profilo Excel** (`useExcelModel: true`)
- Le **addizionali** sono disabilitate (`includeAdditionals: false`)
- I **parametri** possono essere letti dal database se necessario
- La **tolleranza** è di 0.01€ per i calcoli inversi

---
**Creato il**: 21/09/2025  
**Versione**: SoccerXpro V2  
**Sistema**: Test Calcolo Fiscale









