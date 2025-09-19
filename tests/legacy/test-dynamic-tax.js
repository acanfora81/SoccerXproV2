// server/test-dynamic-tax.js
// Test del sistema fiscale parametrico

const { 
  computeFromLordoDynamic, 
  computeFromNettoDynamic,
  transformBracketRows,
  transformPoints,
  transformL207Bands
} = require('./src/lib/tax/engine-dynamic');

console.log('🧪 Test Sistema Fiscale Parametrico\n');

// Test dati di esempio
const testConfig = {
  contribMode: 'LOOKUP',
  contribPoints: [
    { x: 10000, y: 1000 },
    { x: 20000, y: 2000 },
    { x: 30000, y: 3000 },
    { x: 50000, y: 5000 }
  ],
  irpefBrackets: [
    { from: 0, to: 15000, rate: 0.23, fixed: 0 },
    { from: 15000, to: 28000, rate: 0.25, fixed: 0 },
    { from: 28000, to: 50000, rate: 0.35, fixed: 0 },
    { from: 50000, to: null, rate: 0.43, fixed: 0 }
  ],
  addRegionBrackets: [
    { from: 0, to: null, rate: 0.01, fixed: 0 }
  ],
  addCityBrackets: [
    { from: 0, to: null, rate: 0.005, fixed: 0 }
  ],
  l207Bands: [
    { max: 8500, pct: 0.071 },
    { max: 15000, pct: 0.053 },
    { max: 20000, pct: 0.048 }
  ],
  l207Full: 1000,
  l207FullTo: 32000,
  l207FadeTo: 40000,
  fondoRate: 0.005
};

// Test calcolo da lordo
console.log('📊 Test Calcolo da Lordo (25.000€)');
const result1 = computeFromLordoDynamic(25000, testConfig);
console.log('Risultato:', JSON.stringify(result1, null, 2));

console.log('\n📊 Test Calcolo da Lordo (50.000€)');
const result2 = computeFromLordoDynamic(50000, testConfig);
console.log('Risultato:', JSON.stringify(result2, null, 2));

// Test calcolo da netto
console.log('\n📊 Test Calcolo da Netto (18.000€)');
const result3 = computeFromNettoDynamic(18000, testConfig);
console.log('Risultato:', JSON.stringify(result3, null, 2));

// Test funzioni di trasformazione
console.log('\n🔧 Test Funzioni di Trasformazione');

const testBracketRows = [
  { from_amount: 0, to_amount: 15000, rate: 0.23, fixed: 0 },
  { from_amount: 15000, to_amount: 28000, rate: 0.25, fixed: 0 },
  { from_amount: 28000, to_amount: null, rate: 0.35, fixed: 0 }
];

const transformedBrackets = transformBracketRows(testBracketRows);
console.log('Scaglioni trasformati:', transformedBrackets);

const testPoints = [
  { gross: 10000, contrib: 1000 },
  { gross: 20000, contrib: 2000 },
  { gross: 30000, contrib: 3000 }
];

const transformedPoints = transformPoints(testPoints);
console.log('Punti trasformati:', transformedPoints);

const testL207Bands = [
  { max_amount: 8500, pct: 0.071 },
  { max_amount: 15000, pct: 0.053 }
];

const transformedBands = transformL207Bands(testL207Bands);
console.log('Bande L.207 trasformate:', transformedBands);

console.log('\n✅ Test completati con successo!');


