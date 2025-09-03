# 📖 GPS Deriver — Modulo di Derivazione Intelligente Dati GPS

## 📋 Panoramica
Il modulo `gpsDeriver.js` è un sistema intelligente per l’importazione e la derivazione di dati GPS incompleti.  
Permette di:
- Accettare CSV/XLSX anche con colonne parziali  
- Ricostruire i campi mancanti con algoritmi basati su profili ruolo/tipo sessione  
- Restituire **sempre tutte le colonne dello schema** con flag che indicano se un campo è originale o stimato  

È già integrato nell’`import controller` (`server/src/routes/performance.js`) e viene utilizzato automaticamente al caricamento dei dati performance.

---

## 🎯 Funzionalità principali
1. **Completamento automatico dati**
   - Dist/min  
   - Zone di velocità (15-20, 20-25, >25 km/h)  
   - Potenza metabolica media  
   - Distanza equivalente e %Eq Dist  
   - Accelerazioni/decelerazioni, eventi intensi  
   - Training Load stimato se mancante  

2. **Profili per ruolo (HSR)**
```js
const HSR_PROFILES = {
  Portiere:       { train: 0.03, match: 0.05 },
  Difensore:      { train: 0.12, match: 0.18 },
  Centrocampista: { train: 0.16, match: 0.24 },
  Attaccante:     { train: 0.14, match: 0.22 },
  default:        { train: 0.13, match: 0.20 }
};
```
Utilizzati per stimare la quota di HSR quando i dati non sono forniti.

3. **Ripartizione zone velocità**
```js
const HSR_SPLIT = { 
  z15_20: 0.60,  // 60% in zona 15-20 km/h
  z20_25: 0.35,  // 35% in zona 20-25 km/h
  z25p:   0.05   // 5% sopra 25 km/h
};
```
Quando mancano gli split, il sistema ripartisce l’HSR stimato in base a queste percentuali tipiche.

---

## 🗂️ Set minimo consigliato (per import CSV)
**Obbligatori** (minimo indispensabile):
- `Player` – Nome giocatore  
- `Day` – Data (YYYY-MM-DD)  
- `T` – Durata in minuti  
- `Distanza (m)` – Distanza totale  

**Fortemente utili**:
- Zone velocità (`D 15-20 km/h`, `D 20-25 km/h`, `D > 25 km/h`)  
- Potenza metabolica media  
- Zone metaboliche (`D > 20 W/kg`, `D > 35W`)  
- Accelerazioni/decelerazioni  
- `SMax (kmh)` (top speed)  
- `Training Load` (se fornito)  
- `Position` (ruolo) e `Match` (Yes/No)

---

## 🔧 Funzioni pubbliche

### `completeRow(row, options)`
Completa una riga con valori stimati.
- **Parametri**:  
  - `row` → oggetto con i dati della sessione  
  - `options` → `{ eqA, eqB, eqC, tlK1, tlK2, defaultDrill }`  
- **Campi derivati**: Dist/min, Pot. met. media, Dist. Equivalente, %Eq Dist, zone velocità, distanze cumulative.  
- **Output**:  
  - `row` → oggetto completo  
  - `imputationFlags` → record `{ campo: true/false }`  

### `roleOf(position)`
Restituisce il ruolo standard a partire dalla posizione dichiarata.

### `isMatchFlag(value)`
Riconosce se una sessione è una partita (`Yes`/`No`).

---

## 📊 Algoritmi di stima

### 1. Potenza metabolica media
- **Match** → Portieri 6.0, altri 9.2  
- **Allenamento** → Portieri 5.5, altri 8.2  
+ variazione casuale ±0.3

### 2. Distanza equivalente
```
DistEq = Dist × eqMultiplier
eqMultiplier = clamp(1 + a*(PotMet−6)/10 + b*(DAcc>2/Dist) + c*(D>35W/Dist), 1.02, 1.25)
```
Default: a=0.6, b=0.8, c=1.6

### 3. Zone velocità
Se mancano i valori specifici:
1. Calcola HSR totale basato su profilo ruolo/tipo  
2. Ripartisce con HSR_SPLIT  
3. Somma nelle distanze cumulative (`D > 15`, `D > 20`)

### 4. Training Load
- Se presente → usa device  
- Se mancante → proxy:  
```
TL = Dist × (1 + 0.5*HSR% + 0.02*densità_eventi)
```

---

## ⚙️ Configurazione
- `eqA`, `eqB`, `eqC` → coefficienti distanza equivalente (default 0.6/0.8/1.6)  
- `tlK1`, `tlK2` → pesi calcolo Training Load stimato  
- `HSR threshold` → default 20 km/h (configurabile)  
- `defaultDrill` → label attività quando mancante  

---

## 🔍 Validazione e coerenze garantite
- Zone HSR ≤ distanza totale  
- Percentuali derivate dalla distanza  
- Densità per minuto = distanza_zona / T  
- Tutti i numeri ≥ 0  
- `flags.fieldName = true` se stimato, `false` se originale  

---

## 📈 Esempio utilizzo
```js
const { completeRow } = require('./gpsDeriver');

const rawData = {
  Player: "Mario Rossi",
  Position: "Centrocampista",
  Day: "2025-08-30",
  Match: "No",
  T: 90,
  "Distanza (m)": 8500
};

const { row, imputationFlags } = completeRow(rawData, {
  eqA: 0.6, eqB: 0.8, eqC: 1.6,
  defaultDrill: "Allenamento"
});

console.log("Dati completati:", row);
console.log("Campi imputati:", Object.keys(imputationFlags).filter(f => imputationFlags[f]));
```

---

## 📤 Integrazione import CSV
```js
const normalizedRow = {
  Player: csvRow["Nome"],
  Position: csvRow["Ruolo"],
  Day: csvRow["Data"],
  Match: csvRow["Tipo"] === "Partita" ? "Yes" : "No",
  T: Number(csvRow["Durata"]),
  "Distanza (m)": Number(csvRow["Distanza (m)"])
};

const { row, imputationFlags } = completeRow(normalizedRow);
```

---

## 📑 Campi di output (sempre presenti, 32)
- **Base**: Player, Position, Day, T, Match, Drill, Note  
- **Distanze**: Distanza (m), Dist Equivalente, %Eq Dist, Dist/min  
- **Velocità**: D 15-20, D 20-25, D >25, D >20, D >15, SMax (kmh)  
- **Metaboliche**: Pot. met. media, D >20 W/kg, D >35W, MaxPM5  
- **Accelerazioni**: D Acc >2, D Dec >-2, %D Acc >2, %D Dec >-2  
- **Eventi**: Num Acc >3, Num Dec <-3, D Acc >3, D Dec <-3  
- **Densità**: D Acc/min >2, D Dec/min >-2  
- **Tempo zone**: T/min <5 W/kg, T/min 5-10 W/kg  
- **Indici**: Training Load, RVP  

---

## 🧪 Test
Esegui:
```bash
node src/utils/gpsDeriver.example.js
```

---

## 🆕 Changelog
- **v1.1** → Aggiunti profili HSR ruolo, ripartizione HSR_SPLIT, documentate funzioni pubbliche, chiarita soglia HSR, esempi aggiornati.  
- **v1.0** → Prima versione, set minimo, regole derivazione, output completo.  
