/**
 * Test Backend - API Dashboard Player
 * Testa l'endpoint /api/dashboard/stats/player/:id per verificare che tutte le card funzionino correttamente
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'acanfora19811@gmail.com',
  password: 'test'
};
const PLAYER_ID = 1; // Alessandro Canfora

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

// Test per Panoramica Generale (Player)
async function testPanoramicaGeneralePlayer() {
  console.log('\n🧪 Test Panoramica Generale (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const summary = data.summary;
  const eventsSummary = data.eventsSummary;

  console.log('📊 Dati Player ricevuti:');
  console.log('  - Sessioni Totali:', summary?.totalSessions);
  console.log('  - Allenamenti Totali:', eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', eventsSummary?.numeroPartite);
  console.log('  - Durata Media Sessione:', summary?.avgSessionDuration);
  console.log('  - Distanza Media Squadra:', summary?.avgTeamDistance);
  console.log('  - Player Load Medio:', summary?.avgPlayerLoad);
  console.log('  - Velocità Max Media:', summary?.avgMaxSpeed);

  // Verifiche specifiche per il player
  const checks = [
    { name: 'Sessioni Totali', value: summary?.totalSessions, expected: 62, tolerance: 0 },
    { name: 'Allenamenti Totali', value: eventsSummary?.numeroAllenamenti, expected: 53, tolerance: 0 },
    { name: 'Partite Disputate', value: eventsSummary?.numeroPartite, expected: 9, tolerance: 0 },
    { name: 'Durata Media Sessione', value: summary?.avgSessionDuration, expected: 'number', min: 0 },
    { name: 'Distanza Media Squadra', value: summary?.avgTeamDistance, expected: 'number', min: 0 },
    { name: 'Player Load Medio', value: summary?.avgPlayerLoad, expected: 'number', min: 0 },
    { name: 'Velocità Max Media', value: summary?.avgMaxSpeed, expected: 'number', min: 0 }
  ];

  let allPassed = true;
  checks.forEach(check => {
    let isValid = false;
    
    if (typeof check.expected === 'number') {
      // Verifica con tolleranza
      isValid = Math.abs(check.value - check.expected) <= check.tolerance;
    } else if (check.expected === 'number') {
      // Verifica tipo
      isValid = typeof check.value === 'number' && check.value >= check.min;
    }
    
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (atteso: ${check.expected})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per Carico & Volumi (Player)
async function testCaricoVolumiPlayer() {
  console.log('\n🧪 Test Carico & Volumi (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const load = data.load;

  console.log('📊 Dati Carico & Volumi (Player):');
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

// Test per Intensità (Player)
async function testIntensitaPlayer() {
  console.log('\n🧪 Test Intensità (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const intensity = data.intensity;

  console.log('📊 Dati Intensità (Player):');
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

// Test per Alta Velocità & Sprint (Player)
async function testAltaVelocitaSprintPlayer() {
  console.log('\n🧪 Test Alta Velocità & Sprint (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const speed = data.speed;

  console.log('📊 Dati Alta Velocità & Sprint (Player):');
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

// Test per Accelerazioni & Decelerazioni (Player)
async function testAccelerazioniDecelerazioniPlayer() {
  console.log('\n🧪 Test Accelerazioni & Decelerazioni (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const accelerations = data.accelerations;

  console.log('📊 Dati Accelerazioni & Decelerazioni (Player):');
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

// Test per Cardio & Percezione (Player)
async function testCardioPercezionePlayer() {
  console.log('\n🧪 Test Cardio & Percezione (Player)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const cardio = data.cardio;

  console.log('📊 Dati Cardio & Percezione (Player):');
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

// Test per verificare che i dati del player siano diversi da quelli del team
async function testPlayerVsTeamData() {
  console.log('\n🧪 Test Player vs Team Data');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  // Richiesta team
  const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
  // Richiesta player
  const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (teamResponse.status !== 200 || playerResponse.status !== 200) {
    console.error('❌ Errore API:', teamResponse.status, playerResponse.status);
    return false;
  }

  const teamData = teamResponse.data.data;
  const playerData = playerResponse.data.data;

  console.log('📊 Confronto Team vs Player:');
  console.log('  - Team Sessioni Totali:', teamData.summary?.totalSessions);
  console.log('  - Player Sessioni Totali:', playerData.summary?.totalSessions);
  console.log('  - Team Allenamenti:', teamData.eventsSummary?.numeroAllenamenti);
  console.log('  - Player Allenamenti:', playerData.eventsSummary?.numeroAllenamenti);

  // Verifiche
  const checks = [
    { 
      name: 'Sessioni Totali diverse', 
      team: teamData.summary?.totalSessions, 
      player: playerData.summary?.totalSessions,
      expected: 'different'
    },
    { 
      name: 'Allenamenti diversi', 
      team: teamData.eventsSummary?.numeroAllenamenti, 
      player: playerData.eventsSummary?.numeroAllenamenti,
      expected: 'different'
    }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isDifferent = check.team !== check.player;
    console.log(`  ${isDifferent ? '✅' : '❌'} ${check.name}: Team=${check.team}, Player=${check.player}`);
    if (!isDifferent) allPassed = false;
  });

  return allPassed;
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test Backend - API Dashboard Player');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Panoramica Generale (Player)', fn: testPanoramicaGeneralePlayer },
    { name: 'Carico & Volumi (Player)', fn: testCaricoVolumiPlayer },
    { name: 'Intensità (Player)', fn: testIntensitaPlayer },
    { name: 'Alta Velocità & Sprint (Player)', fn: testAltaVelocitaSprintPlayer },
    { name: 'Accelerazioni & Decelerazioni (Player)', fn: testAccelerazioniDecelerazioniPlayer },
    { name: 'Cardio & Percezione (Player)', fn: testCardioPercezionePlayer },
    { name: 'Player vs Team Data', fn: testPlayerVsTeamData }
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
