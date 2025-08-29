# GPS Deriver Module

## Descrizione

Il modulo `gpsDeriver.js` fornisce una soluzione "chiavi-in-mano" per l'import "tollerante" di dati GPS che:

- **Accetta CSV con sottoinsiemi di colonne**
- **Ricostruisce le colonne mancanti da un set minimo**
- **Restituisce tutte le colonne del schema, sempre valorizzate**
- **Fornisce un flag che indica cosa è stato imputato o derivato**

## Set Minimo Consigliato

### Obbligatori (meglio se sempre presenti):
- `Player` - Nome del giocatore
- `Day` - Data sessione (YYYY-MM-DD)
- `T` - Durata in minuti
- `Distanza (m)` - Distanza totale percorsa

### Fortemente utili (se arrivano, migliorano la ricostruzione):
- `Pot. met. media` - Potenza metabolica media (W/kg)
- `D 15-20 km/h`, `D 20-25 km/h`, `D > 25 km/h` - Zone di velocità
- `D > 20 W/Kg`, `D>35 W` - Zone metaboliche
- `D Acc > 2m/s2`, `D Dec > -2m/s2` - Accelerazioni/decelerazioni
- `Num Acc > 3 m/s2`, `Num Dec <-3 m/s2` - Eventi intensi
- `SMax (kmh)` - Velocità massima
- `Training Load` - Carico allenante
- `Match` - Flag partita (Yes/No)
- `Position` - Ruolo giocatore

## Regole di Derivazione

### Dist/min
```
Dist/min = Distanza (m) / T
```

### Distanza Equivalente
Se `Dist Equivalente` manca → stima:
```
eqMultiplier = clamp(1 + a*(Pot. met. media − 6)/10 + b*(D Acc >2 / Dist) + c*(D>35W / Dist), 1.02, 1.25)
Dist Equivalente = Dist * eqMultiplier
```
Default: a=0.6, b=0.8, c=1.6

### Zone di Velocità
```
D > 20 km/h = D 20-25 km/h + D > 25 km/h
D > 15 km/h = D 15-20 km/h + D 20-25 km/h + D > 25 km/h
```

Se mancano gli split → stima HSR% per ruolo e tipo (training/match) e riparti tra zone con ratio tipico (60/35/5)

### Percentuali e Densità
```
%D acc > 2m/s2 = (D Acc > 2m/s2 / Distanza (m)) × 100
D Acc/min > 2 m/s2 = (D Acc > 2m/s2 / T)
```

### Training Load
Usa quello del device; se manca → proxy ibrida:
```
TL = Dist * (1 + 0.5*HSR% + 0.02*densità_eventi)
```

## Utilizzo

### Import Base
```javascript
const { completeRow } = require('./gpsDeriver.js');

const partialData = {
  Player: "Giovanni Di Nardo",
  Position: "Difensore",
  Day: "2025-08-10",
  Match: "Yes",
  T: 95,
  "Distanza (m)": 11200
};

const { row: completedRow, imputationFlags } = completeRow(partialData);
```

### Con Opzioni Personalizzate
```javascript
const { row, imputationFlags } = completeRow(partialData, {
  eqA: 0.6, eqB: 0.8, eqC: 1.6,  // Pesi per distanza equivalente
  tlK1: 0.5, tlK2: 0.02,         // Pesi per training load
  defaultDrill: "Allenamento Tecnico"
});
```

### Integrazione nell'Import CSV
```javascript
// Normalizza i dati CSV
const normalizedRow = {
  Player: csvRow["Nome Giocatore"],
  Position: csvRow["Ruolo"],
  Day: csvRow["Data"],
  Match: csvRow["Tipo"] === "Partita" ? "Yes" : "No",
  T: Number(csvRow["Durata (min)"]),
  "Distanza (m)": Number(csvRow["Distanza (m)"])
};

// Completa i dati mancanti
const { row: completedRow, imputationFlags } = completeRow(normalizedRow);

// Log dei campi imputati per audit
const imputedFields = Object.entries(imputationFlags)
  .filter(([, wasImputed]) => wasImputed)
  .map(([field]) => field);

console.log(`Campi imputati per ${completedRow.Player}:`, imputedFields);
```

## Output

Il modulo restituisce un oggetto con:

- `row`: Oggetto completo con tutti i campi valorizzati
- `imputationFlags`: Record che indica quali campi sono stati imputati (true) vs forniti (false)

## Campi di Output

Tutti i 32 campi del schema sono sempre presenti:

- **Base**: Player, Position, T, Day, Match, Drill, Note
- **Distanze**: Distanza (m), Dist Equivalente, %Eq Dist, Dist/min
- **Velocità**: D 15-20 km/h, D 20-25 km/h, D > 25 km/h, D > 20 km/h, D > 15 Km/h, SMax (kmh)
- **Metaboliche**: Pot. met. media, D > 20 W/Kg, D>35 W, MaxPM5
- **Accelerazioni**: D Acc > 2m/s2, D Dec > -2m/s2, %D acc > 2m/s2, %D Dec > -2 m/s2
- **Eventi**: Num Acc > 3 m/s2, Num Dec <-3 m/s2, D Acc > 3 m/s2, D Dec < -3 m/s2
- **Densità**: D Acc/min > 2 m/s2, D Dec/min > -2m/s2
- **Tempo zone**: T/min <5 W/kg, T/min 5-10 W/Kg
- **Indici**: Training Load, RVP

## Coerenze Garantite

- Zone HSR non superano la distanza totale
- Percentuali derivate dalla distanza
- Densità per minuto = distanza_zona / T
- TL stimato solo se il device non lo fornisce
- Tutti i valori numerici >= 0

## Test

Esegui i test con:
```bash
node src/utils/gpsDeriver.example.js
```

## Integrazione nel Sistema

Il modulo è già integrato nel controller di import (`server/src/routes/performance.js`) e viene utilizzato automaticamente durante l'import CSV per completare i dati mancanti.





