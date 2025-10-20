# 🔧 FIX: Errore 500 nella Promozione Prospect → Target

## ❌ **PROBLEMA IDENTIFICATO**

Errore 500 (Internal Server Error) quando si prova a promuovere un prospect a target:

```
POST http://localhost:3001/api/scouting/prospects/92f88908-c3d5-48e8-ae0e-5718f1fbf521/promote 500 (Internal Server Error)
```

## 🔍 **CAUSA DEL PROBLEMA**

Il servizio di promozione (`promote.service.js`) utilizzava **nomi di campi non corretti** per il modello `market_target`:

### **Campi Errati vs Corretti:**

| Campo Errato | Campo Corretto | Motivo |
|--------------|----------------|---------|
| `nationality` | `nationalityPrimary` | Nome campo nel prospect |
| `position` | `mainPosition` | Nome campo nel prospect |
| `secondary_position` | `secondary_roles` | Nome campo nel target |
| `preferred_foot` | `foot` | Nome campo nel target |
| `scoutingStatus` | `status` | Nome campo nel prospect |
| `created_by` | `discovery_user_id` | Nome campo nel target |
| `createdAt` | `discovery_date` | Nome campo nel target |

## ✅ **SOLUZIONI IMPLEMENTATE**

### **1. Corretti i Nomi dei Campi**
```javascript
// PRIMA (❌)
const targetData = {
  nationality: prospect.nationality,
  position: prospect.position,
  secondary_position: prospect.secondaryPosition,
  preferred_foot: prospect.preferredFoot,
  // ...
};

// DOPO (✅)
const targetData = {
  nationality: prospect.nationalityPrimary,
  position: prospect.mainPosition,
  secondary_roles: prospect.secondaryPositions ? prospect.secondaryPositions.join(', ') : null,
  foot: prospect.preferredFoot,
  // ...
};
```

### **2. Corretti i Campi di Audit**
```javascript
// PRIMA (❌)
created_by: ctx.userId,
createdAt: new Date(),

// DOPO (✅)
discovery_user_id: ctx.userId,
discovery_date: new Date(),
```

### **3. Corretti i Riferimenti allo Status**
```javascript
// PRIMA (❌)
const isTargeted = prospect.scoutingStatus === 'TARGETED';
scoutingStatus: 'TARGETED',

// DOPO (✅)
const isTargeted = prospect.status === 'TARGETED';
status: 'TARGETED',
```

### **4. Aggiunto Campo Mancante**
```javascript
// Aggiunto campo club_country
club_country: prospect.countryClub,
```

## 🎯 **RISULTATO**

### **Prima (❌):**
- Errore 500 durante la promozione
- Campi non trovati nel database
- Promozione fallita

### **Dopo (✅):**
- Promozione riuscita
- Target creato correttamente
- Status prospect aggiornato a TARGETED

## 🧪 **TEST**

### **1. Test Promozione:**
1. Apri un prospect con status "MONITORING"
2. Clicca "Promuovi a Target"
3. Conferma l'azione
4. **Risultato**: ✅ Promozione riuscita

### **2. Verifica Target Creato:**
1. Vai in Market → Obiettivi
2. Verifica che il target sia stato creato
3. **Risultato**: ✅ Target visibile con dati corretti

### **3. Verifica Status Prospect:**
1. Torna in Scouting → Prospects
2. Verifica che lo status sia "TARGETED"
3. **Risultato**: ✅ Status aggiornato

## 📋 **MAPPING CAMPI COMPLETO**

### **Prospect → Target:**
```javascript
prospect.firstName → target.first_name
prospect.lastName → target.last_name
prospect.nationalityPrimary → target.nationality
prospect.mainPosition → target.position
prospect.secondaryPositions → target.secondary_roles (join)
prospect.preferredFoot → target.foot
prospect.heightCm → target.height_cm
prospect.weightKg → target.weight_kg
prospect.currentClub → target.current_club
prospect.countryClub → target.club_country
prospect.contractUntil → target.contract_until
prospect.marketValue → target.market_value
prospect.overallScore → target.overall_rating
prospect.potentialScore → target.potential_rating
```

## ✅ **STATUS**

- ✅ **Campi corretti** nel servizio di promozione
- ✅ **Mapping corretto** Prospect → Target
- ✅ **Promozione funzionante**
- ✅ **Target creato** correttamente
- ✅ **Status aggiornato** a TARGETED

## 🎯 **RISULTATO FINALE**

La promozione Prospect → Target ora funziona perfettamente! 🎉

Il prospect "Ercole Di Nicola" può essere promosso a target senza errori.


