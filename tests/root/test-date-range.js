// Test script per verificare il range di date
const { normalizePeriod } = require('./server/src/routes/dashboard.js');

console.log('🧪 Test del range di date...');

// Simula la chiamata con i parametri del problema
const testParams = {
  period: 'custom',
  startDate: '2025-07-01',
  endDate: '2025-08-31'
};

console.log('📅 Parametri di test:', testParams);

try {
  const result = normalizePeriod(testParams);
  console.log('✅ Risultato normalizePeriod:', {
    start: result.start.toISOString(),
    end: result.end.toISOString(),
    type: result.type
  });
  
  // Verifica specifica per il 31/08
  const testDate = new Date('2025-08-31T00:00:00.000Z');
  const isIncluded = testDate >= result.start && testDate <= result.end;
  
  console.log('🔍 Verifica inclusione 31/08:');
  console.log('  - Test date:', testDate.toISOString());
  console.log('  - Range start:', result.start.toISOString());
  console.log('  - Range end:', result.end.toISOString());
  console.log('  - È incluso?', isIncluded);
  
} catch (error) {
  console.error('❌ Errore:', error.message);
}
