/**
 * Test Backend - API Dashboard Team
 * Testa l'endpoint /api/dashboard/stats/team per verificare che tutte le card funzionino correttamente
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'acanfora19811@gmail.com',
  password: 'test'
};
const TEAM_ID = '0d55fc72-e2b7-470a-a0c0-9c506d339928';

// Funzione per fare richieste HTTP
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test per Panoramica Generale
async function testPanoramicaGenerale() {
  console.log('\n🧪 Test Panoramica Generale');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const summary = data.summary;
  const eventsSummary = data.eventsSummary;

  console.log('📊 Dati ricevuti:');
  console.log('  - Sessioni Totali:', summary?.totalSessions);
  console.log('  - Allenamenti Totali:', eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', eventsSummary?.numeroPartite);
  console.log('  - Durata Media Sessione:', summary?.avgSessionDuration);
  console.log('  - Distanza Media Squadra:', summary?.avgTeamDistance);
  console.log('  - Player Load Medio:', summary?.avgPlayerLoad);
  console.log('  - Velocità Max Media:', summary?.avgMaxSpeed);

  // Verifiche
  const checks = [
    { name: 'Sessioni Totali', value: summary?.totalSessions, expected: 'number', min: 0 },
    { name: 'Allenamenti Totali', value: eventsSummary?.numeroAllenamenti, expected: 'number', min: 0 },
    { name: 'Partite Disputate', value: eventsSummary?.numeroPartite, expected: 'number', min: 0 },
    { name: 'Durata Media Sessione', value: summary?.avgSessionDuration, expected: 'number', min: 0 },
    { name: 'Distanza Media Squadra', value: summary?.avgTeamDistance, expected: 'number', min: 0 },
    { name: 'Player Load Medio', value: summary?.avgPlayerLoad, expected: 'number', min: 0 },
    { name: 'Velocità Max Media', value: summary?.avgMaxSpeed, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Carico & Volumi
async function testCaricoVolumi() {
  console.log('\n🧪 Test Carico & Volumi');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const load = data.load;

  console.log('📊 Dati Carico & Volumi:');
  console.log('  - Distanza Totale:', load?.totalDistance);
  console.log('  - Sprint Totali:', load?.totalSprints);
  console.log('  - Passi Totali:', load?.totalSteps);

  // Verifiche
  const checks = [
    { name: 'Distanza Totale', value: load?.totalDistance, expected: 'number', min: 0 },
    { name: 'Sprint Totali', value: load?.totalSprints, expected: 'number', min: 0 },
    { name: 'Passi Totali', value: load?.totalSteps, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Intensità
async function testIntensita() {
  console.log('\n🧪 Test Intensità');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const intensity = data.intensity;

  console.log('📊 Dati Intensità:');
  console.log('  - Distanza/min:', intensity?.avgDistancePerMin);
  console.log('  - Player Load/min:', intensity?.avgPlayerLoadPerMin);
  console.log('  - Sprint per Sessione:', intensity?.avgSprintsPerSession);

  // Verifiche
  const checks = [
    { name: 'Distanza/min', value: intensity?.avgDistancePerMin, expected: 'number', min: 0 },
    { name: 'Player Load/min', value: intensity?.avgPlayerLoadPerMin, expected: 'number', min: 0 },
    { name: 'Sprint per Sessione', value: intensity?.avgSprintsPerSession, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Alta Velocità & Sprint
async function testAltaVelocitaSprint() {
  console.log('\n🧪 Test Alta Velocità & Sprint');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const speed = data.speed;

  console.log('📊 Dati Alta Velocità & Sprint:');
  console.log('  - HSR Totale:', speed?.totalHSR);
  console.log('  - Sprint Distance Media:', speed?.avgSprintDistance);

  // Verifiche
  const checks = [
    { name: 'HSR Totale', value: speed?.totalHSR, expected: 'number', min: 0 },
    { name: 'Sprint Distance Media', value: speed?.avgSprintDistance, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Accelerazioni & Decelerazioni
async function testAccelerazioniDecelerazioni() {
  console.log('\n🧪 Test Accelerazioni & Decelerazioni');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const accelerations = data.accelerations;

  console.log('📊 Dati Accelerazioni & Decelerazioni:');
  console.log('  - Acc+Dec per Sessione:', accelerations?.avgAccDecPerSession);
  console.log('  - Impatti Stimati:', accelerations?.totalImpacts);

  // Verifiche
  const checks = [
    { name: 'Acc+Dec per Sessione', value: accelerations?.avgAccDecPerSession, expected: 'number', min: 0 },
    { name: 'Impatti Stimati', value: accelerations?.totalImpacts, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Cardio & Percezione
async function testCardioPercezione() {
  console.log('\n🧪 Test Cardio & Percezione');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const cardio = data.cardio;

  console.log('📊 Dati Cardio & Percezione:');
  console.log('  - HR Medio Squadra:', cardio?.avgHR);
  console.log('  - HR Max Squadra:', cardio?.maxHR);
  console.log('  - RPE Medio:', cardio?.avgRPE);
  console.log('  - Session-RPE Totale:', cardio?.totalSessionRPE);

  // Verifiche
  const checks = [
    { name: 'HR Medio Squadra', value: cardio?.avgHR, expected: 'number', min: 0 },
    { name: 'HR Max Squadra', value: cardio?.maxHR, expected: 'number', min: 0 },
    { name: 'RPE Medio', value: cardio?.avgRPE, expected: 'number', min: 0 },
    { name: 'Session-RPE Totale', value: cardio?.totalSessionRPE, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = typeof check.value === check.expected && check.value >= check.min;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (${typeof check.value})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test Backend - API Dashboard Team');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Panoramica Generale', fn: testPanoramicaGenerale },
    { name: 'Carico & Volumi', fn: testCaricoVolumi },
    { name: 'Intensità', fn: testIntensita },
    { name: 'Alta Velocità & Sprint', fn: testAltaVelocitaSprint },
    { name: 'Accelerazioni & Decelerazioni', fn: testAccelerazioniDecelerazioni },
    { name: 'Cardio & Percezione', fn: testCardioPercezione }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Risultati: ${passed}/${total} test passati`);
  
  if (passed === total) {
    console.log('🎉 Tutti i test sono passati!');
  } else {
    console.log('⚠️  Alcuni test sono falliti!');
  }

  return passed === total;
}

// Esegui i test
runAllTests().catch(console.error);
