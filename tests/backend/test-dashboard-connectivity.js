/**
 * Test Backend - Connettività Dashboard
 * Testa la connettività e la struttura base degli endpoint senza autenticazione
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';

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

// Test connettività server
async function testServerConnectivity() {
  console.log('\n🧪 Test Connettività Server');
  
  try {
    const response = await makeRequest('/api/dashboard/stats/team?period=month&aggregate=true');
    
    console.log('📊 Risposta Server:');
    console.log('  - Status Code:', response.status);
    console.log('  - Tipo Risposta:', typeof response.data);
    
    if (response.status === 401) {
      console.log('  ✅ Server raggiungibile (401 = autenticazione richiesta)');
      return true;
    } else if (response.status === 200) {
      console.log('  ✅ Server raggiungibile e autenticato');
      return true;
    } else {
      console.log('  ❌ Server non raggiungibile o errore');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Errore di connessione:', error.message);
    return false;
  }
}

// Test endpoint team
async function testTeamEndpoint() {
  console.log('\n🧪 Test Endpoint Team');
  
  try {
    const response = await makeRequest('/api/dashboard/stats/team?period=month&aggregate=true');
    
    console.log('📊 Endpoint Team:');
    console.log('  - Status Code:', response.status);
    console.log('  - Messaggio:', response.data?.error || 'OK');
    
    if (response.status === 401) {
      console.log('  ✅ Endpoint team raggiungibile (autenticazione richiesta)');
      return true;
    } else if (response.status === 200) {
      console.log('  ✅ Endpoint team funzionante');
      return true;
    } else {
      console.log('  ❌ Endpoint team non funzionante');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Errore endpoint team:', error.message);
    return false;
  }
}

// Test endpoint player
async function testPlayerEndpoint() {
  console.log('\n🧪 Test Endpoint Player');
  
  try {
    const response = await makeRequest('/api/dashboard/stats/player/1?period=month&aggregate=true');
    
    console.log('📊 Endpoint Player:');
    console.log('  - Status Code:', response.status);
    console.log('  - Messaggio:', response.data?.error || 'OK');
    
    if (response.status === 401) {
      console.log('  ✅ Endpoint player raggiungibile (autenticazione richiesta)');
      return true;
    } else if (response.status === 200) {
      console.log('  ✅ Endpoint player funzionante');
      return true;
    } else {
      console.log('  ❌ Endpoint player non funzionante');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Errore endpoint player:', error.message);
    return false;
  }
}

// Test filtri
async function testFilters() {
  console.log('\n🧪 Test Filtri');
  
  const filters = [
    { name: 'Periodo Month', query: 'period=month&aggregate=true' },
    { name: 'Periodo Week', query: 'period=week&aggregate=true' },
    { name: 'Periodo Custom', query: 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true' }
  ];
  
  let allPassed = true;
  
  for (const filter of filters) {
    try {
      const response = await makeRequest(`/api/dashboard/stats/team?${filter.query}`);
      
      const isOk = response.status === 401 || response.status === 200;
      console.log(`  ${isOk ? '✅' : '❌'} ${filter.name}: Status ${response.status}`);
      
      if (!isOk) allPassed = false;
    } catch (error) {
      console.log(`  ❌ ${filter.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test performance
async function testPerformance() {
  console.log('\n🧪 Test Performance');
  
  try {
    const startTime = Date.now();
    const response = await makeRequest('/api/dashboard/stats/team?period=month&aggregate=true');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    console.log('📊 Performance:');
    console.log('  - Tempo di risposta:', responseTime + 'ms');
    console.log('  - Status Code:', response.status);
    
    const isFast = responseTime < 5000; // Max 5 secondi
    const isReachable = response.status === 401 || response.status === 200;
    
    console.log(`  ${isFast ? '✅' : '❌'} Velocità: ${isFast ? 'OK' : 'LENTA'}`);
    console.log(`  ${isReachable ? '✅' : '❌'} Raggiungibilità: ${isReachable ? 'OK' : 'ERROR'}`);
    
    return isFast && isReachable;
  } catch (error) {
    console.log('  ❌ Errore performance:', error.message);
    return false;
  }
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test Connettività - Dashboard Backend');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Connettività Server', fn: testServerConnectivity },
    { name: 'Endpoint Team', fn: testTeamEndpoint },
    { name: 'Endpoint Player', fn: testPlayerEndpoint },
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

  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Risultati: ${passed}/${total} test passati`);
  
  if (passed === total) {
    console.log('🎉 Tutti i test di connettività sono passati!');
    console.log('💡 Il server è raggiungibile e gli endpoint funzionano.');
    console.log('🔐 Per test completi, è necessario l\'autenticazione.');
  } else {
    console.log('⚠️  Alcuni test di connettività sono falliti!');
    console.log('🔧 Verificare che il server sia in esecuzione su porta 3001.');
  }

  return passed === total;
}

// Esegui i test
runAllTests().catch(console.error);
