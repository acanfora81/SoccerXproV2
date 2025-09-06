/**
 * Test Backend - Dashboard con Autenticazione
 * Testa l'endpoint con autenticazione per verificare i dati reali delle card
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';
const TEAM_ID = '0d55fc72-e2b7-470a-a0c0-9c506d339928';
const PLAYER_ID = 1; // Alessandro Canfora

// Credenziali di test (Alessandro Canfora)
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

    // Aggiungi token di autenticazione se disponibile
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

// Funzione per fare login e ottenere il token
async function login() {
  console.log('\n🔐 Login con credenziali di test...');
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: TEST_CREDENTIALS
    });

    console.log('📊 Risposta login:', {
      status: response.status,
      hasToken: !!response.data.token,
      hasCookies: !!response.cookies,
      cookies: response.cookies
    });

    if (response.status === 200) {
      // Prova a ottenere il token dalla risposta
      if (response.data.token) {
        authToken = response.data.token;
        console.log('✅ Login riuscito! Token ottenuto dalla risposta.');
      } else if (response.cookies) {
        // Estrai il token dai cookie
        const authCookie = response.cookies.find(cookie => cookie.includes('auth') || cookie.includes('token'));
        if (authCookie) {
          authToken = authCookie.split('=')[1].split(';')[0];
          console.log('✅ Login riuscito! Token ottenuto dai cookie.');
        } else {
          console.log('✅ Login riuscito! Ma nessun token trovato.');
          console.log('🔍 Cookie disponibili:', response.cookies);
        }
      } else {
        console.log('✅ Login riuscito! Ma nessun token trovato.');
      }
      return true;
    } else {
      console.log('❌ Login fallito:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Errore durante il login:', error.message);
    return false;
  }
}

// Test per Panoramica Generale con dati reali
async function testPanoramicaGeneraleReal() {
  console.log('\n🧪 Test Panoramica Generale (Dati Reali)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const summary = data.summary;
  const eventsSummary = data.eventsSummary;

  console.log('📊 Dati Reali Ricevuti:');
  console.log('  - Sessioni Totali:', summary?.totalSessions);
  console.log('  - Allenamenti Totali:', eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', eventsSummary?.numeroPartite);
  console.log('  - Durata Media Sessione:', summary?.avgSessionDuration);
  console.log('  - Distanza Media Squadra:', summary?.avgTeamDistance);
  console.log('  - Player Load Medio:', summary?.avgPlayerLoad);
  console.log('  - Velocità Max Media:', summary?.avgMaxSpeed);

  // Verifiche con dati reali
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

// Test per Player con dati reali
async function testPlayerReal() {
  console.log('\n🧪 Test Player (Dati Reali)');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;
  const summary = data.summary;
  const eventsSummary = data.eventsSummary;

  console.log('📊 Dati Player Reali:');
  console.log('  - Sessioni Totali:', summary?.totalSessions);
  console.log('  - Allenamenti Totali:', eventsSummary?.numeroAllenamenti);
  console.log('  - Partite Disputate:', eventsSummary?.numeroPartite);

  // Verifiche specifiche per Alessandro Canfora
  const checks = [
    { 
      name: 'Sessioni Totali Alessandro', 
      value: summary?.totalSessions, 
      expected: 62, 
      tolerance: 0 
    },
    { 
      name: 'Allenamenti Alessandro', 
      value: eventsSummary?.numeroAllenamenti, 
      expected: 53, 
      tolerance: 0 
    },
    { 
      name: 'Partite Alessandro', 
      value: eventsSummary?.numeroPartite, 
      expected: 9, 
      tolerance: 0 
    }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const isValid = Math.abs(check.value - check.expected) <= check.tolerance;
    console.log(`  ${isValid ? '✅' : '❌'} ${check.name}: ${check.value} (atteso: ${check.expected})`);
    if (!isValid) allPassed = false;
  });

  return allPassed;
}

// Test per tutte le sezioni della dashboard
async function testAllSections() {
  console.log('\n🧪 Test Tutte le Sezioni Dashboard');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  const response = await makeRequest(`/api/dashboard/stats/team?${query}`);
  
  if (response.status !== 200) {
    console.error('❌ Errore API:', response.status, response.data);
    return false;
  }

  const data = response.data.data;

  console.log('📊 Sezioni Dashboard:');
  console.log('  - Summary:', !!data.summary);
  console.log('  - EventsSummary:', !!data.eventsSummary);
  console.log('  - Load:', !!data.load);
  console.log('  - Intensity:', !!data.intensity);
  console.log('  - Speed:', !!data.speed);
  console.log('  - Accelerations:', !!data.accelerations);
  console.log('  - Cardio:', !!data.cardio);
  console.log('  - Readiness:', !!data.readiness);

  // Verifica che tutte le sezioni siano presenti
  const sections = ['summary', 'eventsSummary', 'load', 'intensity', 'speed', 'accelerations', 'cardio', 'readiness'];
  const allPresent = sections.every(section => !!data[section]);
  
  console.log(`  ${allPresent ? '✅' : '❌'} Tutte le sezioni presenti: ${allPresent}`);
  
  return allPresent;
}

// Test per confronto Team vs Player
async function testTeamVsPlayer() {
  console.log('\n🧪 Test Confronto Team vs Player');
  
  const query = 'period=custom&startDate=2025-07-01&endDate=2025-08-31&aggregate=true';
  
  const teamResponse = await makeRequest(`/api/dashboard/stats/team?${query}`);
  const playerResponse = await makeRequest(`/api/dashboard/stats/player/${PLAYER_ID}?${query}`);
  
  if (teamResponse.status !== 200 || playerResponse.status !== 200) {
    console.error('❌ Errore API:', teamResponse.status, playerResponse.status);
    return false;
  }

  const teamData = teamResponse.data.data;
  const playerData = playerResponse.data.data;

  console.log('📊 Confronto Dati:');
  console.log('  - Team Sessioni:', teamData.summary?.totalSessions);
  console.log('  - Player Sessioni:', playerData.summary?.totalSessions);
  console.log('  - Team Allenamenti:', teamData.eventsSummary?.numeroAllenamenti);
  console.log('  - Player Allenamenti:', playerData.eventsSummary?.numeroAllenamenti);

  // Verifica la logica corretta:
  // - Sessioni: Team > Player (team somma tutti i giocatori)
  // - Allenamenti: Team = Player (numero di giorni, non moltiplicato per giocatori)
  const teamSessions = teamData.summary?.totalSessions;
  const playerSessions = playerData.summary?.totalSessions;
  const teamTrainings = teamData.eventsSummary?.numeroAllenamenti;
  const playerTrainings = playerData.eventsSummary?.numeroAllenamenti;

  const sessionsCorrect = teamSessions > playerSessions;
  const trainingsCorrect = teamTrainings === playerTrainings;
  
  console.log(`  ${sessionsCorrect ? '✅' : '❌'} Team ha più sessioni del player: ${sessionsCorrect} (${teamSessions} > ${playerSessions})`);
  console.log(`  ${trainingsCorrect ? '✅' : '❌'} Allenamenti uguali (giorni): ${trainingsCorrect} (${teamTrainings} = ${playerTrainings})`);
  
  return sessionsCorrect && trainingsCorrect;
}

// Test principale
async function runAllTests() {
  console.log('🚀 Avvio Test Dashboard con Autenticazione');
  console.log('=' .repeat(50));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Impossibile procedere senza autenticazione');
    return false;
  }

  const tests = [
    { name: 'Panoramica Generale (Dati Reali)', fn: testPanoramicaGeneraleReal },
    { name: 'Player (Dati Reali)', fn: testPlayerReal },
    { name: 'Tutte le Sezioni Dashboard', fn: testAllSections },
    { name: 'Confronto Team vs Player', fn: testTeamVsPlayer }
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
    console.log('🎉 Tutti i test con autenticazione sono passati!');
    console.log('✅ I dati reali delle card sono corretti!');
  } else {
    console.log('⚠️  Alcuni test sono falliti!');
  }

  return passed === total;
}

// Esegui i test
runAllTests().catch(console.error);
