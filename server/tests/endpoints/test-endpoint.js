// Test endpoint
const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    console.log('🔵 [TEST] Test endpoint...');
    
    const baseUrl = 'http://localhost:3001';
    
    // Test health endpoint
    console.log('🔵 [TEST] Test health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ [TEST] Health endpoint:', healthData);
    
    // Test database endpoint
    console.log('🔵 [TEST] Test database endpoint...');
    const dbResponse = await fetch(`${baseUrl}/test-db`);
    const dbData = await dbResponse.json();
    console.log('✅ [TEST] Database endpoint:', dbData);
    
    // Test auth endpoint
    console.log('🔵 [TEST] Test auth endpoint...');
    const authResponse = await fetch(`${baseUrl}/api/auth/health`);
    const authData = await authResponse.json();
    console.log('✅ [TEST] Auth endpoint:', authData);
    
    // Test registrazione endpoint
    console.log('🔵 [TEST] Test registrazione endpoint...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register-with-team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teamName: 'Test Endpoint',
        email: 'test-endpoint-' + Date.now() + '@example.com',
        password: 'testpassword123',
        first_name: 'Test',
        last_name: 'Endpoint',
        plan: 'BASIC'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ [TEST] Registrazione endpoint:', registerData);
    
  } catch (error) {
    console.error('❌ [TEST] Errore test endpoint:', error.message);
  }
}

testEndpoint();








