// Esempio di utilizzo del modulo gpsDeriver
// Questo file mostra come utilizzare il modulo per completare dati GPS mancanti

const { completeRow } = require('./gpsDeriver.js');

// Esempio 1: CSV con dati minimi (solo 4 colonne obbligatorie)
console.log('=== ESEMPIO 1: CSV MINIMO ===');
const minimalData = {
  Player: "Giovanni Di Nardo",
  Position: "Difensore", 
  Day: "2025-08-10",
  Match: "Yes",
  T: 95,
  "Distanza (m)": 11200
};

const { row: completedMinimal, imputationFlags: flags1 } = completeRow(minimalData);

console.log('Dati completati:', {
  player: completedMinimal.Player,
  distanza: completedMinimal["Distanza (m)"],
  distEquivalente: completedMinimal["Dist Equivalente"],
  trainingLoad: completedMinimal["Training Load"],
  hsr: completedMinimal["D > 15 Km/h"],
  acwr: completedMinimal.ACWR
});

console.log('Campi imputati:', Object.entries(flags1).filter(([,v]) => v).map(([k]) => k));

// Esempio 2: CSV con dati parziali (alcuni campi forniti)
console.log('\n=== ESEMPIO 2: CSV PARZIALE ===');
const partialData = {
  Player: "Alessandro Canfora",
  Position: "Attaccante",
  Day: "2025-07-22", 
  Match: "No",
  T: 100,
  "Distanza (m)": 9000,
  "Training Load": 360, // Fornito dal device
  "D 20-25 km/h": 700,  // Fornito dal device
  "D > 25 km/h": 220    // Fornito dal device
};

const { row: completedPartial, imputationFlags: flags2 } = completeRow(partialData);

console.log('Dati completati:', {
  player: completedPartial.Player,
  trainingLoad: completedPartial["Training Load"], // Dovrebbe rimanere 360
  dOver20: completedPartial["D > 20 km/h"], // Dovrebbe essere 700 + 220 = 920
  dOver15: completedPartial["D > 15 Km/h"]
});

console.log('Campi imputati:', Object.entries(flags2).filter(([,v]) => v).map(([k]) => k));

// Esempio 3: CSV completo (tutti i campi forniti)
console.log('\n=== ESEMPIO 3: CSV COMPLETO ===');
const completeData = {
  Player: "Test Player",
  Position: "Centrocampista",
  Day: "2025-08-15",
  Match: "Yes", 
  T: 90,
  "Distanza (m)": 10000,
  "Dist Equivalente": 11500,
  "Training Load": 450,
  "D 15-20 km/h": 1200,
  "D 20-25 km/h": 800,
  "D > 25 km/h": 200,
  "D Acc > 2m/s2": 800,
  "D Dec > -2m/s2": 750,
  "Pot. met. media": 9.5,
  "SMax (kmh)": 32
};

const { row: completedFull, imputationFlags: flags3 } = completeRow(completeData);

console.log('Dati completati:', {
  player: completedFull.Player,
  distEquivalente: completedFull["Dist Equivalente"], // Dovrebbe rimanere 11500
  trainingLoad: completedFull["Training Load"], // Dovrebbe rimanere 450
  dOver20: completedFull["D > 20 km/h"], // Dovrebbe essere 800 + 200 = 1000
  smax: completedFull["SMax (kmh)"] // Dovrebbe rimanere 32
});

console.log('Campi imputati:', Object.entries(flags3).filter(([,v]) => v).map(([k]) => k));

// Esempio 4: Utilizzo nell'import CSV
console.log('\n=== ESEMPIO 4: INTEGRAZIONE IMPORT CSV ===');
const csvRow = {
  "Nome Giocatore": "Mario Rossi",
  "Ruolo": "Difensore",
  "Data": "2025-08-20",
  "Tipo": "Allenamento",
  "Durata (min)": 85,
  "Distanza (m)": 8500,
  "Velocità Max": 28.5
};

// Normalizza i dati CSV
const normalizedRow = {
  Player: csvRow["Nome Giocatore"],
  Position: csvRow["Ruolo"],
  Day: csvRow["Data"],
  Match: csvRow["Tipo"] === "Partita" ? "Yes" : "No",
  T: Number(csvRow["Durata (min)"]),
  "Distanza (m)": Number(csvRow["Distanza (m)"]),
  "SMax (kmh)": Number(csvRow["Velocità Max"])
};

const { row: completedCsv, imputationFlags: flags4 } = completeRow(normalizedRow, {
  eqA: 0.6, eqB: 0.8, eqC: 1.6,
  tlK1: 0.5, tlK2: 0.02,
  defaultDrill: "Allenamento Tecnico"
});

console.log('CSV completato:', {
  player: completedCsv.Player,
  distanza: completedCsv["Distanza (m)"],
  distEquivalente: completedCsv["Dist Equivalente"],
  trainingLoad: completedCsv["Training Load"],
  hsr: completedCsv["D > 15 Km/h"],
  smax: completedCsv["SMax (kmh)"]
});

console.log('Campi imputati dal CSV:', Object.entries(flags4).filter(([,v]) => v).map(([k]) => k));

console.log('\n=== FINE ESEMPI ===');
