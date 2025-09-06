/**
 * Script per eseguire tutti i test frontend
 * Esegue i test in sequenza e fornisce un report completo
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colori per il console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Funzione per eseguire un test
function runTest(testFile, testName) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}🧪 Esecuzione: ${testName}${colors.reset}`);
    console.log(`${colors.blue}📁 File: ${testFile}${colors.reset}`);
    console.log('─'.repeat(60));

    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      const success = code === 0;
      console.log(`\n${success ? colors.green + '✅' : colors.red + '❌'} ${testName}: ${success ? 'PASSED' : 'FAILED'}${colors.reset}`);
      resolve({ name: testName, success, code });
    });

    child.on('error', (error) => {
      console.log(`\n${colors.red}❌ ${testName}: ERROR - ${error.message}${colors.reset}`);
      resolve({ name: testName, success: false, error: error.message });
    });
  });
}

// Funzione principale
async function runAllTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 AVVIO SUITE COMPLETA DI TEST FRONTEND${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  
  const startTime = Date.now();

  // Lista dei test frontend da eseguire
  const tests = [
    {
      file: path.join(__dirname, 'components', 'test-team-dashboard.js'),
      name: 'Test Frontend - TeamDashboard Component'
    },
    {
      file: path.join(__dirname, 'components', 'test-filters.js'),
      name: 'Test Frontend - Filters Component'
    },
    {
      file: path.join(__dirname, 'integration', 'test-dashboard-integration.js'),
      name: 'Test Frontend - Integrazione Dashboard'
    }
  ];

  const results = [];

  // Esegui tutti i test
  for (const test of tests) {
    const result = await runTest(test.file, test.name);
    results.push(result);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Report finale
  console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}📊 REPORT FINALE FRONTEND${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}`);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`\n${colors.bright}📈 Risultati:${colors.reset}`);
  results.forEach(result => {
    const status = result.success ? `${colors.green}✅ PASSED` : `${colors.red}❌ FAILED`;
    const time = result.code !== undefined ? ` (exit code: ${result.code})` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`  ${status}${colors.reset} - ${result.name}${time}${error}`);
  });

  console.log(`\n${colors.bright}📊 Statistiche:${colors.reset}`);
  console.log(`  ${colors.green}✅ Test Passati: ${passed}/${total}${colors.reset}`);
  console.log(`  ${colors.red}❌ Test Falliti: ${failed}/${total}${colors.reset}`);
  console.log(`  ${colors.blue}⏱️  Tempo Totale: ${totalTime}ms${colors.reset}`);

  if (passed === total) {
    console.log(`\n${colors.bright}${colors.green}🎉 TUTTI I TEST FRONTEND SONO PASSATI! 🎉${colors.reset}`);
    console.log(`${colors.green}Il frontend funziona correttamente e si integra perfettamente con il backend.${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}⚠️  ALCUNI TEST FRONTEND SONO FALLITI! ⚠️${colors.reset}`);
    console.log(`${colors.yellow}Verificare i log sopra per identificare i problemi.${colors.reset}`);
  }

  console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(70)}${colors.reset}`);

  // Exit code basato sui risultati
  process.exit(passed === total ? 0 : 1);
}

// Gestione degli errori
process.on('uncaughtException', (error) => {
  console.error(`\n${colors.red}❌ Errore non gestito: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n${colors.red}❌ Promise rifiutata: ${reason}${colors.reset}`);
  process.exit(1);
});

// Esegui i test
runAllTests().catch((error) => {
  console.error(`\n${colors.red}❌ Errore nell'esecuzione dei test: ${error.message}${colors.reset}`);
  process.exit(1);
});
