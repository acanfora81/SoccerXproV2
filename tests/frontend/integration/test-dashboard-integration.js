/**
 * Test Frontend Integration - Dashboard Completa
 * Testa l'integrazione tra frontend e backend per la dashboard
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'acanfora19811@gmail.com',
  password: 'test'
};

let authToken = null;

// Funzione per fare richieste HTTP
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            data: jsonData,
            headers: res.headers,
            cookies: res.headers['set-cookie']
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data,
            headers: res.headers,
            cookies: res.headers['set-cookie']
          });
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

// Funzione per fare login
async function login() {
  console.log('\n🔐 Login per test integrazione...');
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: TEST_CREDENTIALS
    });

    if (response.status === 200) {
      if (response.data.token) {
        authToken = response.data.token;
      } else if (response.cookies) {
        const authCookie = response.cookies.find(cookie => cookie.includes('access_token'));
        if (authCookie) {
          authToken = authCookie.split('=')[1].split(';')[0];
        }
      }
      console.log('✅ Login riuscito per test integrazione');
      return true;
    } else {
      console.log('❌ Login fallito:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Errore login:', error.message);
    return false;
  }
}

// Test per il flusso completo Team Dashboard
async function testTeamDashboardFlow() {
  console.log('\n🧪 Test Flusso Completo Team Dashboard');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API Team:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  
  // Simula il rendering frontend
  const frontendData = {
    summary: data.summary,
    eventsSummary: data.eventsSummary,
    load: data.load,
    intensity: data.intensity,
    speed: data.speed,
    accelerations: data.accelerations,
    cardio: data.cardio,
    readiness: data.readiness
  };

  console.log('📊 Dati Frontend Simulati:');
  console.log('  - Sessioni Totali:', frontendData.summary?.totalSessions);
  console.log('  - Allenamenti Totali:', frontendData.eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', frontendData.eventsSummary?.numeroPartite);

  // Verifica che tutti i dati necessari per il frontend siano presenti
  const requiredFields = [
    'summary.totalSessions',
    'eventsSummary.numeroAllenamenti',
    'eventsSummary.numeroPartite',
    'load.totalDistance',
    'intensity.avgDistancePerMin',
    'speed.totalHSR',
    'accelerations.avgAccDecPerSession',
    'cardio.avgHR'
  ];

  let allPresent = true;
  requiredFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], frontendData);
    const isPresent = value !== undefined && value !== null;
    console.log(`  ${isPresent ? '✅' : '❌'} ${field}: ${isPresent ? 'OK' : 'MISSING'}`);
    if (!isPresent) allPresent = false;
  });

  return allPresent;
}

// Test per il flusso completo Player Dashboard
async function testPlayerDashboardFlow() {
  console.log('\n🧪 Test Flusso Completo Player Dashboard');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/1?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API Player:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  
  // Simula il rendering frontend per player
  const frontendData = {
    player: response.data.player,
    summary: data.summary,
    eventsSummary: data.eventsSummary,
    load: data.load,
    intensity: data.intensity,
    speed: data.speed,
    accelerations: data.accelerations,
    cardio: data.cardio,
    readiness: data.readiness
  };

  console.log('📊 Dati Player Frontend Simulati:');
  console.log('  - Player:', frontendData.player?.name);
  console.log('  - Sessioni Totali:', frontendData.summary?.totalSessions);
  console.log('  - Allenamenti Totali:', frontendData.eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', frontendData.eventsSummary?.numeroPartite);

  // Verifica che i dati del player siano corretti
  const playerChecks = [
    { name: 'Player info presente', value: !!frontendData.player?.name, expected: true },
    { name: 'Sessioni Alessandro', value: frontendData.summary?.totalSessions, expected: 62 },
    { name: 'Allenamenti Alessandro', value: frontendData.eventsSummary?.numeroAllenamenti, expected: 53 },
    { name: 'Partite Alessandro', value: frontendData.eventsSummary?.numeroPartite, expected: 9 }
  ];

  let allCorrect = true;
  playerChecks.forEach(check => {
    const isCorrect = check.value === check.expected;
    console.log(`  ${isCorrect ? '✅' : '❌'} ${check.name}: ${check.value} (atteso: ${check.expected})`);
    if (!isCorrect) allCorrect = false;
  });

  return allCorrect;
}

// Test per la sincronizzazione filtri frontend-backend
async function testFilterSynchronization() {
  console.log('\n🧪 Test Sincronizzazione Filtri Frontend-Backend');
  
  const filterTests = [
    {
      name: 'Filtro periodo month',
      frontendFilters: { period: 'month' },
      expectedBackendQuery: 'period=month&aggregate=true'
    },
    {
      name: 'Filtro periodo custom con date',
      frontendFilters: { 
        period: 'custom', 
        startDate: '2025-07-01', 
        endDate: '2025-08-31' 
      },
      expectedBackendQuery: 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true'
    },
    {
      name: 'Filtro sessionType training',
      frontendFilters: { 
        period: 'custom', 
        startDate: '2025-07-01', 
        endDate: '2025-08-31',
        sessionType: 'training'
      },
      expectedBackendQuery: 'period=custom&startDate=2025-07-01&endDate=2025-08-31&sessionType=training&aggregate=true'
    }
  ];

  let allPassed = true;
  
  for (const test of filterTests) {
    // Simula la costruzione della query dal frontend
    const params = new URLSearchParams();
    
    if (test.frontendFilters.period) params.append('period', test.frontendFilters.period);
    if (test.frontendFilters.startDate) params.append('startDate', test.frontendFilters.startDate);
    if (test.frontendFilters.endDate) params.append('endDate', test.frontendFilters.endDate);
    if (test.frontendFilters.sessionType) params.append('sessionType', test.frontendFilters.sessionType);
    
    params.append('aggregate', 'true');
    const generatedQuery = params.toString();
    
    // Testa la query sul backend
    const response = await makeRequest(`/api/dashboard/stats/team?${generatedQuery}`);
    const isWorking = response.status === 200;
    
    const isCorrect = generatedQuery === test.expectedBackendQuery && isWorking;
    
    console.log(`  ${isCorrect ? '✅' : '❌'} ${test.name}: ${isCorrect ? 'OK' : 'ERRORE'}`);
    console.log(`    Query generata: ${generatedQuery}`);
    console.log(`    Query attesa:   ${test.expectedBackendQuery}`);
    console.log(`    Backend risponde: ${isWorking ? 'OK' : 'ERROR'}`);
    
    if (!isCorrect) allPassed = false;
  }

  return allPassed;
}

// Test per la gestione degli errori frontend-backend
async function testErrorHandling() {
  console.log('\n🧪 Test Gestione Errori Frontend-Backend');
  
  const errorTests = [
    {
      name: 'Query non valida',
      query: 'period=invalid&aggregate=true',
      expectedStatus: 400
    },
    {
      name: 'Date range non valido',
      query: 'period=custom&startDate=2025-08-31&endDate=2025-07-01&aggregate=true',
      expectedStatus: 400
    },
    {
      name: 'Player ID non valido',
      query: 'period=month&aggregate=true',
      playerId: 'invalid',
      expectedStatus: 400
    }
  ];

  let allPassed = true;
  
  for (const test of errorTests) {
    let response;
    if (test.playerId) {
      response = await makeRequest(`/api/dashboard/stats/player/${test.playerId}?${test.query}`);
    } else {
      response = await makeRequest(`/api/dashboard/stats/team?${test.query}`);
    }
    
    const isErrorHandled = response.status >= 400;
    const hasErrorMessage = response.data?.error || response.data?.message;
    
    console.log(`  ${isErrorHandled ? '✅' : '❌'} ${test.name}: ${isErrorHandled ? 'OK' : 'ERRORE'}`);
    console.log(`    Status: ${response.status}`);
    console.log(`    Messaggio: ${hasErrorMessage || 'Nessun messaggio'}`);
    
    if (!isErrorHandled) allPassed = false;
  }

  return allPassed;
}

// Test per le performance frontend-backend
async function testPerformance() {
  console.log('\n🧪 Test Performance Frontend-Backend');
  
  const performanceTests = [
    {
      name: 'Team Dashboard',
      endpoint: '/api/dashboard/stats/team',
      query: 'period=month&aggregate=true',
      maxTime: 2000
    },
    {
      name: 'Player Dashboard',
      endpoint: '/api/dashboard/stats/player/1',
      query: 'period=month&aggregate=true',
      maxTime: 2000
    },
    {
      name: 'Team Dashboard con filtri complessi',
      endpoint: '/api/dashboard/stats/team',
      query: 'period=custom&startDate=2025-07-01&endDate=2025-08-31&sessionType=training&aggregate=true',
      maxTime: 3000
    }
  ];

  let allPassed = true;
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    const response = await makeRequest(`${test.endpoint}?${test.query}`);
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    const isFast = responseTime <= test.maxTime;
    const isWorking = response.status === 200;
    
    console.log(`  ${isFast && isWorking ? '✅' : '❌'} ${test.name}: ${isFast && isWorking ? 'OK' : 'ERRORE'}`);
    console.log(`    Tempo: ${responseTime}ms (max: ${test.maxTime}ms)`);
    console.log(`    Status: ${response.status}`);
    
    if (!isFast || !isWorking) allPassed = false;
  }

  return allPassed;
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test Integrazione Frontend-Backend');
  console.log('=' .repeat(60));

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Impossibile procedere senza autenticazione');
    return false;
  }

  const tests = [
    { name: 'Flusso Team Dashboard', fn: testTeamDashboardFlow },
    { name: 'Flusso Player Dashboard', fn: testPlayerDashboardFlow },
    { name: 'Sincronizzazione Filtri', fn: testFilterSynchronization },
    { name: 'Gestione Errori', fn: testErrorHandling },
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
    console.log('✅ Frontend e Backend sono perfettamente integrati!');
  } else {
    console.log('⚠️  Alcuni test di integrazione sono falliti!');
  }

  return passed === total;
}

// Esegui i test
runAllTests().catch(console.error);
