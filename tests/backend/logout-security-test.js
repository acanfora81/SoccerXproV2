// 🧪 server/tests/logout-security-test.js
// Test completo logout sicuro

require('dotenv').config({ path: '../.env' });

const axios = require('axios');
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

console.log(`${colors.blue}🧪 LOGOUT SECURITY TEST - SoccerXpro V2${colors.reset}`);
console.log('='.repeat(50));

class LogoutSecurityTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * 📊 Log risultato test
   */
  logResult(testName, passed, details = '') {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
      console.log(`${colors.green}✅ ${testName}${colors.reset}`);
    } else {
      this.testResults.failed++;
      console.log(`${colors.red}❌ ${testName}${colors.reset}`);
    }
    
    if (details) {
      console.log(`   ${colors.yellow}${details}${colors.reset}`);
    }
    
    this.testResults.details.push({
      name: testName,
      passed,
      details
    });
  }

  /**
   * 🔐 Test completo logout sicuro
   */
  async runCompleteLogoutTest() {
    console.log(`\n${colors.blue}🔐 Test Logout Sicuro Completo${colors.reset}`);
    console.log('-'.repeat(30));

    let authToken = null;
    let userEmail = `test.logout.${Date.now()}@example.com`;
    let userId = null;

    try {
      // STEP 1: Registrazione utente test
      console.log('\n1️⃣ Registrazione utente test...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: userEmail,
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'Logout',
        role: 'SECRETARY'
      });

      if (registerResponse.status === 201 && registerResponse.data.access_token) {
        authToken = registerResponse.data.access_token;
        userId = registerResponse.data.user.id;
        this.logResult(
          'Registrazione utente test',
          true,
          `Token ottenuto: ...${authToken.slice(-8)}`
        );
      } else {
        this.logResult('Registrazione utente test', false, 'Token non ottenuto');
        return false;
      }

      // STEP 2: Verifica accesso con token
      console.log('\n2️⃣ Verifica accesso con token...');
      const accessResponse = await axios.get(`${BASE_URL}/test-auth/protected`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      this.logResult(
        'Accesso endpoint protetto PRE-logout',
        accessResponse.status === 200,
        `Status: ${accessResponse.status}`
      );

      // STEP 3: Logout sicuro
      console.log('\n3️⃣ Esecuzione logout sicuro...');
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const logoutSuccess = logoutResponse.status === 200 || logoutResponse.status === 207;
      this.logResult(
        'Logout sicuro eseguito',
        logoutSuccess,
        `Status: ${logoutResponse.status}, Message: ${logoutResponse.data.message}`
      );

      if (logoutResponse.data.details) {
        console.log(`   📊 Details: Token revocato=${logoutResponse.data.details.tokenRevoked}, Sessione chiusa=${logoutResponse.data.details.sessionClosed}`);
      }

      // STEP 4: Test critico - Accesso POST-logout
      console.log('\n4️⃣ TEST CRITICO: Accesso con token revocato...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attesa per propagazione

      try {
        const postLogoutResponse = await axios.get(`${BASE_URL}/test-auth/protected`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Se arriviamo qui, il test è FALLITO - il token funziona ancora
        this.logResult(
          'SICUREZZA: Token revocato dopo logout',
          false,
          `CRITICO: Token ancora valido! Status: ${postLogoutResponse.status}`
        );

        console.log(`${colors.red}🚨 VULNERABILITÀ RILEVATA: Il token JWT funziona ancora dopo logout!${colors.reset}`);
        
      } catch (error) {
        // Se otteniamo un errore 401/403, il test è PASSATO
        const isUnauthorized = error.response && (error.response.status === 401 || error.response.status === 403);
        
        this.logResult(
          'SICUREZZA: Token revocato dopo logout',
          isUnauthorized,
          isUnauthorized 
            ? `✅ Token correttamente revocato (${error.response.status})`
            : `❌ Errore inaspettato: ${error.message}`
        );
      }

      // STEP 5: Test endpoint /me
      console.log('\n5️⃣ Test endpoint /me POST-logout...');
      try {
        const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        this.logResult(
          'Endpoint /me bloccato dopo logout',
          false,
          `PROBLEMA: /me accessibile! Status: ${meResponse.status}`
        );
        
      } catch (error) {
        const isBlocked = error.response && (error.response.status === 401 || error.response.status === 403);
        this.logResult(
          'Endpoint /me bloccato dopo logout',
          isBlocked,
          isBlocked ? '✅ Accesso negato correttamente' : `❌ Errore: ${error.message}`
        );
      }

      // STEP 6: Test refresh token
      if (registerResponse.data.refresh_token) {
        console.log('\n6️⃣ Test refresh token POST-logout...');
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: registerResponse.data.refresh_token
          });

          this.logResult(
            'Refresh token bloccato dopo logout',
            false,
            `PROBLEMA: Refresh riuscito! Status: ${refreshResponse.status}`
          );
          
        } catch (error) {
          const isBlocked = error.response && (error.response.status === 401 || error.response.status === 403);
          this.logResult(
            'Refresh token bloccato dopo logout',
            isBlocked,
            isBlocked ? '✅ Refresh negato correttamente' : `❌ Errore: ${error.message}`
          );
        }
      }

    } catch (error) {
      console.log(`${colors.red}🔴 Errore durante test logout: ${error.message}${colors.reset}`);
      this.logResult('Test logout completo', false, error.message);
      return false;
    }

    return true;
  }

  /**
 * 🔄 Test logout multipli
 */
async testMultipleLogouts() {
  console.log(`\n${colors.blue}🔄 Test Logout Multipli${colors.reset}`);
  console.log('-'.repeat(30));

  try {
    // Registra nuovo utente per test multipli
    const userEmail = `test.multiple.${Date.now()}@example.com`;
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: userEmail,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'Multiple',
      role: 'SECRETARY'
    });

    if (registerResponse.status !== 201) {
      this.logResult('Test logout multipli', false, 'Registrazione fallita');
      return;
    }

    const token = registerResponse.data.access_token;
    const refreshToken = registerResponse.data.refresh_token;

    // Primo logout
    const logout1 = await axios.post(`${BASE_URL}/auth/logout`, {
      refresh_token: refreshToken
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Secondo logout (dovrebbe gestire token già revocato)
    try {
      const logout2 = await axios.post(`${BASE_URL}/auth/logout`, {
        refresh_token: refreshToken
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.logResult(
        'Doppio logout gestito correttamente',
        logout2.status === 401 || logout2.status === 403,
        `Status secondo logout: ${logout2.status}`
      );
    } catch (error) {
      this.logResult(
        'Doppio logout gestito correttamente',
        error.response && (error.response.status === 401 || error.response.status === 403),
        'Secondo logout correttamente rifiutato'
      );
    }

  } catch (error) {
    this.logResult('Test logout multipli', false, error.message);
  }
}

  /**
   * 📊 Test stato blacklist
   */
  async testBlacklistStatus() {
    console.log(`\n${colors.blue}📊 Test Stato Blacklist${colors.reset}`);
    console.log('-'.repeat(30));

    try {
      const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      
      if (healthResponse.data.security && healthResponse.data.security.blacklist) {
        const blacklistStats = healthResponse.data.security.blacklist;
        
        console.log(`   Redis healthy: ${blacklistStats.redisHealthy}`);
        console.log(`   Memory blacklist size: ${blacklistStats.memorySize}`);
        console.log(`   Redis blacklist size: ${blacklistStats.redisSize}`);
        
        this.logResult(
          'Blacklist funzionante',
          true,
          `Redis: ${blacklistStats.redisHealthy}, Items: ${blacklistStats.redisSize + blacklistStats.memorySize}`
        );
      } else {
        this.logResult('Blacklist funzionante', false, 'Statistiche blacklist non disponibili');
      }

    } catch (error) {
      this.logResult('Test stato blacklist', false, error.message);
    }
  }

  /**
   * 📈 Riepilogo finale
   */
  printSummary() {
    console.log(`\n${colors.blue}📈 RIEPILOGO TEST LOGOUT SICURO${colors.reset}`);
    console.log('='.repeat(50));
    
    const passRate = Math.round((this.testResults.passed / this.testResults.total) * 100);
    const statusColor = passRate >= 80 ? colors.green : passRate >= 60 ? colors.yellow : colors.red;
    
    console.log(`Test totali: ${this.testResults.total}`);
    console.log(`${colors.green}Passati: ${this.testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Falliti: ${this.testResults.failed}${colors.reset}`);
    console.log(`${statusColor}Tasso successo: ${passRate}%${colors.reset}`);
    
    if (this.testResults.failed > 0) {
      console.log(`\n${colors.red}❌ Test falliti:${colors.reset}`);
      this.testResults.details
        .filter(t => !t.passed)
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.details}`);
        });
    }
    
    // Raccomandazioni sicurezza
    console.log(`\n${colors.blue}🔒 RACCOMANDAZIONI SICUREZZA:${colors.reset}`);
    
    const hasSecurityIssues = this.testResults.details.some(t => 
      !t.passed && t.name.includes('SICUREZZA')
    );
    
    if (hasSecurityIssues) {
      console.log(`${colors.red}🚨 CRITICO: Vulnerabilità logout rilevate!${colors.reset}`);
      console.log('   1. Verificare configurazione Redis');
      console.log('   2. Controllare implementazione TokenBlacklist');
      console.log('   3. Testare middleware authenticate()');
    } else {
      console.log(`${colors.green}✅ Sistema logout sicuro funzionante${colors.reset}`);
      console.log('   1. Token correttamente revocati');
      console.log('   2. Blacklist operativa');
      console.log('   3. Endpoint protetti dopo logout');
    }
  }

  /**
   * 🚀 Esegui tutti i test
   */
  async runAllTests() {
    console.log(`${colors.blue}🚀 Avvio test completi logout sicuro...${colors.reset}\n`);
    
    await this.runCompleteLogoutTest();
    await this.testMultipleLogouts();
    await this.testBlacklistStatus();
    
    this.printSummary();
    
    // Exit code per CI/CD
    process.exit(this.testResults.failed > 0 ? 1 : 0);
  }
}

// Esegui i test se chiamato direttamente
if (require.main === module) {
  const test = new LogoutSecurityTest();
  test.runAllTests().catch(error => {
    console.log(`${colors.red}🔴 Errore critico test: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = LogoutSecurityTest;