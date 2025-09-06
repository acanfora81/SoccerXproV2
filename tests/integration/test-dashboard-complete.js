/**
 * Test di Integrazione - Dashboard Completa
 * Testa sia l'endpoint team che player per verificare la coerenza dei dati
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'acanfora19811@gmail.com',
  password: 'test'
};
const TEAM_ID = '0d55fc72-e2b7-470a-a0c0-9c506d339928';
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

// Test per verificare che entrambi gli endpoint rispondano correttamente
async function testEndpointsAvailability() {
  console.log('\n🧪 Test Disponibilità Endpoint');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  try {
    const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
    const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
    
    console.log('📊 Status Code:');
    console.log('  - Team Endpoint:', teamResponse.status);
    console.log('  - Player Endpoint:', playerResponse.status);
    
    const teamOk = teamResponse.status === 200;
    const playerOk = playerResponse.status === 200;
    
    console.log(`  ${teamOk ? '✅' : '❌'} Team Endpoint: ${teamOk ? 'OK' : 'ERROR'}`);
    console.log(`  ${playerOk ? '✅' : '❌'} Player Endpoint: ${playerOk ? 'OK' : 'ERROR'}`);
    
    return teamOk && playerOk;
  } catch (error) {
    console.error('❌ Errore nel test disponibilità:', error.message);
    return false;
  }
}

// Test per verificare la struttura dei dati
async function testDataStructure() {
  console.log('\n🧪 Test Struttura Dati');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  try {
    const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
    const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
    
    if (teamResponse.status !== 200 || playerResponse.status !== 200) {
      console.error('❌ Endpoint non disponibili');
      return false;
    }
    
    const teamData = teamResponse.data.data;
    const playerData = playerResponse.data.data;
    
    // Verifica struttura team
    const teamStructure = {
      summary: typeof teamData.summary === 'object',
      eventsSummary: typeof teamData.eventsSummary === 'object',
      load: typeof teamData.load === 'object',
      intensity: typeof teamData.intensity === 'object',
      speed: typeof teamData.speed === 'object',
      accelerations: typeof teamData.accelerations === 'object',
      cardio: typeof teamData.cardio === 'object',
      readiness: typeof teamData.readiness === 'object'
    };
    
    // Verifica struttura player
    const playerStructure = {
      summary: typeof playerData.summary === 'object',
      eventsSummary: typeof playerData.eventsSummary === 'object',
      load: typeof playerData.load === 'object',
      intensity: typeof playerData.intensity === 'object',
      speed: typeof playerData.speed === 'object',
      accelerations: typeof playerData.accelerations === 'object',
      cardio: typeof playerData.cardio === 'object',
      readiness: typeof playerData.readiness === 'object'
    };
    
    console.log('📊 Struttura Dati Team:');
    Object.entries(teamStructure).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'MISSING'}`);
    });
    
    console.log('📊 Struttura Dati Player:');
    Object.entries(playerStructure).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'MISSING'}`);
    });
    
    const teamOk = Object.values(teamStructure).every(v => v);
    const playerOk = Object.values(playerStructure).every(v => v);
    
    return teamOk && playerOk;
  } catch (error) {
    console.error('❌ Errore nel test struttura:', error.message);
    return false;
  }
}

// Test per verificare la coerenza dei dati tra team e player
async function testDataConsistency() {
  console.log('\n🧪 Test Coerenza Dati');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  try {
    const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
    const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
    
    if (teamResponse.status !== 200 || playerResponse.status !== 200) {
      console.error('❌ Endpoint non disponibili');
      return false;
    }
    
    const teamData = teamResponse.data.data;
    const playerData = playerResponse.data.data;
    
    console.log('📊 Confronto Dati:');
    console.log('  - Team Sessioni Totali:', teamData.summary?.totalSessions);
    console.log('  - Player Sessioni Totali:', playerData.summary?.totalSessions);
    console.log('  - Team Allenamenti:', teamData.eventsSummary?.numeroAllenamenti);
    console.log('  - Player Allenamenti:', playerData.eventsSummary?.numeroAllenamenti);
    console.log('  - Team Partite:', teamData.eventsSummary?.numeroPartite);
    console.log('  - Player Partite:', playerData.eventsSummary?.numeroPartite);
    
    // Verifiche di coerenza
    const checks = [
      {
        name: 'Player ha meno sessioni del team',
        condition: playerData.summary?.totalSessions <= teamData.summary?.totalSessions,
        team: teamData.summary?.totalSessions,
        player: playerData.summary?.totalSessions
      },
      {
        name: 'Player ha meno allenamenti del team',
        condition: playerData.eventsSummary?.numeroAllenamenti <= teamData.eventsSummary?.numeroAllenamenti,
        team: teamData.eventsSummary?.numeroAllenamenti,
        player: playerData.eventsSummary?.numeroAllenamenti
      },
      {
        name: 'Player ha meno partite del team',
        condition: playerData.eventsSummary?.numeroPartite <= teamData.eventsSummary?.numeroPartite,
        team: teamData.eventsSummary?.numeroPartite,
        player: playerData.eventsSummary?.numeroPartite
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      console.log(`  ${check.condition ? '✅' : '❌'} ${check.name}: Team=${check.team}, Player=${check.player}`);
      if (!check.condition) allPassed = false;
    });
    
    return allPassed;
  } catch (error) {
    console.error('❌ Errore nel test coerenza:', error.message);
    return false;
  }
}

// Test per verificare i filtri
async function testFilters() {
  console.log('\n🧪 Test Filtri');
  
  const filters = [
    { name: 'Periodo Custom', query: 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true' },
    { name: 'Periodo Mese', query: 'period=month&aggregate=true' },
    { name: 'Periodo Settimana', query: 'period=week&aggregate=true' }
  ];
  
  let allPassed = true;
  
  for (const filter of filters) {
    try {
      const teamResponse = await makeRequest(`/api/dashboard/stats/team?${filter.query}`);
      const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${filter.query}`);
      
      const teamOk = teamResponse.status === 200;
      const playerOk = playerResponse.status === 200;
      
      console.log(`  ${teamOk && playerOk ? '✅' : '❌'} ${filter.name}: Team=${teamOk ? 'OK' : 'ERROR'}, Player=${playerOk ? 'OK' : 'ERROR'}`);
      
      if (!teamOk || !playerOk) allPassed = false;
    } catch (error) {
      console.log(`  ❌ ${filter.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test per verificare le performance
async function testPerformance() {
  console.log('\n🧪 Test Performance');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  try {
    const startTime = Date.now();
    
    const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
    const teamTime = Date.now() - startTime;
    
    const playerStartTime = Date.now();
    const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
    const playerTime = Date.now() - playerStartTime;
    
    console.log('📊 Tempi di Risposta:');
    console.log(`  - Team Endpoint: ${teamTime}ms`);
    console.log(`  - Player Endpoint: ${playerTime}ms`);
    
    const teamOk = teamResponse.status === 200 && teamTime < 5000; // Max 5 secondi
    const playerOk = playerResponse.status === 200 && playerTime < 5000;
    
    console.log(`  ${teamOk ? '✅' : '❌'} Team Performance: ${teamOk ? 'OK' : 'SLOW/ERROR'}`);
    console.log(`  ${playerOk ? '✅' : '❌'} Player Performance: ${playerOk ? 'OK' : 'SLOW/ERROR'}`);
    
    return teamOk && playerOk;
  } catch (error) {
    console.error('❌ Errore nel test performance:', error.message);
    return false;
  }
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test di Integrazione - Dashboard Completa');
  console.log('=' .repeat(60));

  const tests = [
    { name: 'Disponibilità Endpoint', fn: testEndpointsAvailability },
    { name: 'Struttura Dati', fn: testDataStructure },
    { name: 'Coerenza Dati', fn: testDataConsistency },
    { name: 'Filtri', fn: testFilters },
    { name: 'Performance', fn: testPerformance }
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

  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Risultati: ${passed}/${total} test passati`);
  
  if (passed === total) {
    console.log('🎉 Tutti i test di integrazione sono passati!');
  } else {
    console.log('⚠️  Alcuni test di integrazione sono falliti!');
  }

  return passed === total;
}

// Esegui i test
runAllTests().catch(console.error);
