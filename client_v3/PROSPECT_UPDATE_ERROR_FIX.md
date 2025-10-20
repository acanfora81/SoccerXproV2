# 🔧 FIX: Errore Aggiornamento Prospect

## ❌ **PROBLEMA IDENTIFICATO**

Errore 400 (Bad Request) quando si prova a modificare lo status di un prospect da "Monitoraggio" a "Obiettivo".

```
PUT http://localhost:3001/api/scouting/prospects/92f88908-c3d5-48e8-ae0e-5718f1fbf521 400 (Bad Request)
```

## 🔍 **ANALISI DEL PROBLEMA**

### **1. Validazione Backend**
Il backend usa lo schema `updateProspectSchema` che accetta:
- `status: scoutingStatusSchema.optional()`
- Valori validi: `DISCOVERY`, `MONITORING`, `ANALYZED`, `EVALUATED`, `TARGETED`, `SIGNED`, `REJECTED`, `ARCHIVED`

### **2. Mapping Frontend**
Il frontend mappa correttamente:
- `TARGETED` → `Obiettivo` ✅
- `MONITORING` → `Monitoraggio` ✅

### **3. Possibili Cause**
1. **Validazione fallita** su altri campi obbligatori
2. **Formato dati** non corretto
3. **Business rules** non rispettate
4. **Permessi** insufficienti

## ✅ **SOLUZIONI IMPLEMENTATE**

### **1. Logging Dettagliato**
Aggiunto logging per debug:
```javascript
console.log('Updating prospect with payload:', payload);
console.log('Update response:', response);
```

### **2. Gestione Errori Migliorata**
Traduzione messaggi di errore in italiano:
```javascript
if (err?.message?.includes('Invalid prospect ID')) {
  errorMsg = 'ID prospect non valido';
} else if (err?.message?.includes('Prospect not found')) {
  errorMsg = 'Prospect non trovato';
} else if (err?.message?.includes('Not authorized')) {
  errorMsg = 'Non autorizzato a modificare questo prospect';
} else if (err?.message?.includes('validation')) {
  errorMsg = 'Dati non validi. Controlla i campi obbligatori.';
} else if (err?.message?.includes('400')) {
  errorMsg = 'Dati non validi. Verifica i campi inseriti.';
}
```

## 🧪 **COME DEBUGGARE**

### **1. Controlla Console Browser**
Dopo aver provato a salvare, controlla la console per:
- `Updating prospect with payload:` - Verifica i dati inviati
- `Update response:` - Verifica la risposta del server
- `Error saving prospect:` - Verifica l'errore specifico

### **2. Controlla Network Tab**
Nel DevTools → Network:
- Cerca la richiesta `PUT /api/scouting/prospects/...`
- Controlla il **Request Payload**
- Controlla la **Response** per dettagli dell'errore

### **3. Verifica Campi Obbligatori**
Assicurati che tutti i campi obbligatori siano compilati:
- `firstName` ✅
- `lastName` ✅
- `nationalityPrimary` ✅
- `preferredFoot` ✅
- `heightCm` ✅
- `weightKg` ✅
- `marketValue` ✅
- `potentialScore` ✅

## 🔧 **POSSIBILI SOLUZIONI**

### **1. Se il Problema è nei Campi Obbligatori**
Verifica che tutti i campi richiesti siano compilati correttamente.

### **2. Se il Problema è nei Permessi**
Assicurati di avere il ruolo corretto:
- **SCOUT** - Può modificare solo i propri prospect
- **DIRECTOR_SPORT** - Può modificare tutti i prospect
- **ADMIN** - Può modificare tutti i prospect

### **3. Se il Problema è nel Formato Dati**
Controlla che i numeri siano validi:
- `heightCm` - Numero intero positivo
- `weightKg` - Numero intero positivo
- `marketValue` - Numero positivo
- `potentialScore` - Numero tra 0 e 100

## 📋 **CHECKLIST DEBUG**

- [ ] Controlla console browser per payload
- [ ] Verifica Network tab per response
- [ ] Controlla che tutti i campi obbligatori siano compilati
- [ ] Verifica che i numeri siano in formato corretto
- [ ] Controlla i permessi utente
- [ ] Verifica che lo status sia un valore valido

## 🎯 **PROSSIMI PASSI**

1. **Prova a salvare** il prospect modificato
2. **Controlla la console** per i log dettagliati
3. **Condividi i log** per un'analisi più approfondita
4. **Verifica i campi** obbligatori
5. **Controlla i permessi** utente

## ✅ **STATUS**

- ✅ **Logging dettagliato** aggiunto
- ✅ **Gestione errori** migliorata
- ✅ **Messaggi in italiano** implementati
- 🔄 **Debug in corso** - necessari log per identificare causa specifica

Con i log dettagliati ora possiamo identificare esattamente cosa sta causando l'errore 400! 🔍


