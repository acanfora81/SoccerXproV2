// test-api.js
// Test API del sistema fiscale

const http = require('http');

function testAPI() {
  console.log('🧪 Test API Sistema Fiscale\n');
  
  // Test health check
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Health Check: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log('📊 Stato Server:', health.status);
        console.log('🔒 Sicurezza inizializzata:', health.security?.initialized);
        console.log('📅 Timestamp:', health.timestamp);
      } catch (e) {
        console.log('📄 Risposta:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log(`❌ Errore connessione: ${e.message}`);
    console.log('💡 Assicurati che il server sia in esecuzione su porta 3001');
  });

  req.end();
}

// Test dopo 2 secondi per dare tempo al server di avviarsi
setTimeout(testAPI, 2000);


