// server/src/app.js
// Main application con sistema logout sicuro

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import componenti sicurezza
const redisClient = require('./config/redis');
const TokenBlacklist = require('./utils/tokenBlacklist');
const { getPrismaClient } = require('./config/database');

console.log('🟢 [INFO] Starting Soccer X Pro Suite Server con logout sicuro...');

// Get shared Prisma Client
const prisma = getPrismaClient();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: 'http://localhost:5173', // 👈 il tuo frontend in dev
  credentials: true
};
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Inizializzazione sicurezza all'avvio
let securityInitialized = false;

/**
 * 🔧 Inizializzazione componenti sicurezza
 */
const initializeSecurity = async () => {
  try {
    console.log('🔵 [DEBUG] Inizializzazione sistema sicurezza...');

    try {
      const redisConnected = await redisClient.connect();
      if (redisConnected) {
        console.log('🟢 [INFO] Redis connesso per token blacklist');
      } else {
        console.log('🟡 [WARN] Redis non disponibile, modalità fallback attivata');
      }
    } catch (redisError) {
      console.log('🟡 [WARN] Redis connection error (fallback mode):', redisError.message);
    }

    const blacklistReady = await TokenBlacklist.initialize();
    if (blacklistReady) {
      console.log('🟢 [INFO] TokenBlacklist inizializzato');
    } else {
      console.log('🟡 [WARN] TokenBlacklist in modalità limitata');
    }

    securityInitialized = true;
    console.log('🟢 [INFO] Sistema sicurezza inizializzato');
  } catch (error) {
    console.log('🔴 Errore inizializzazione sicurezza:', error.message);
    securityInitialized = false;
  }
};

// Health check
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'Soccer X Pro Suite Server is running',
    timestamp: new Date().toISOString(),
    security: {
      initialized: securityInitialized,
      redis: redisClient.isHealthy(),
      blacklist: securityInitialized ? await TokenBlacklist.getStats() : null,
    },
  };
  res.json(healthData);
});

// Test DB
app.get('/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// 🧪 Test auth
const testAuthRoutes = require('./routes/auth/test-auth');
app.use('/api/test-auth', testAuthRoutes);

// 🔐 Auth
const authRoutes = require('./routes/auth/auth');
app.use('/api/auth', authRoutes);

// 🚀 Onboarding (pubblico - non richiede autenticazione)
const onboardingRoutes = require('./routes/onboarding');
app.use('/api/onboarding', onboardingRoutes);

// 👥 Users Management (solo ADMIN)
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

// 👥 Players
const playersRoutes = require('./routes/players/players');
app.use('/api/players', playersRoutes);

// 📊 Performance CRUD
const performanceRoutes = require('./routes/performance/performance');
app.use('/api/performance', performanceRoutes);

// 📈 Dashboard
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// 🎯 Session Types
const sessionTypesRoutes = require('./routes/session-types');
app.use('/api/session-types', sessionTypesRoutes);

// 📋 Contracts
const contractsRoutes = require('./routes/contracts/contracts');
app.use('/api/contracts', contractsRoutes);

// 💰 Tax Rates Upload
const taxRatesUpload = require('./routes/tax/taxratesUpload');
app.use('/api/taxrates', taxRatesUpload);

const bonusTaxRatesUpload = require('./routes/tax/bonusTaxRatesUpload');
app.use('/api/bonustaxrates', bonusTaxRatesUpload);

// 👥 Players Upload
const playersUpload = require('./routes/players/playersUpload');
app.use('/api/players', playersUpload);

// 📊 Contracts Summary
const contractsSummary = require('./routes/contracts/contractsSummary');
app.use('/api/contracts-summary', contractsSummary);

// 💰 Tax Calculations
const taxesRoutes = require('./routes/taxes');
app.use('/api/taxes', taxesRoutes);

// 🏥 Medical Area (GDPR)
const medicalRoutes = require('./routes/medical');
app.use('/api/medical', medicalRoutes);


// Riepilogo route
console.log('🔵 [DEBUG] Route caricate:');
console.log('  - GET /health');
console.log('  - GET /test-db');
console.log('  - /api/test-auth/*');
console.log('  - /api/auth/*');
console.log('  - /api/players/*');
console.log('  - /api/performance/* (CRUD)');
console.log('  - /api/dashboard/* (Dashboard)');
console.log('  - /api/session-types/* (Session Types)');
console.log('  - /api/contracts/* (Contracts)');
console.log('  - /api/taxrates/* (Tax Rates Upload)');
console.log('  - /api/bonustaxrates/* (Bonus Tax Rates Upload)');
console.log('  - /api/contracts-summary/summary (Contracts Summary)');
console.log('  - /api/contracts-summary/export (Contracts Export)');
console.log('  - /api/taxes/* (Tax Calculations)');
console.log('  - /api/medical/* (Medical GDPR)');
console.log('');


const PORT = process.env.PORT || 3001;

// Avvio server
const startServer = async () => {
  try {
    await initializeSecurity();
    app.listen(PORT, () => {
      console.log(`🟢 [INFO] Server running on port ${PORT}`);
      console.log(`🔵 [DEBUG] Health check: http://localhost:${PORT}/health`);
      console.log(`🔵 [DEBUG] DB test: http://localhost:${PORT}/test-db`);
      console.log(`🔵 [DEBUG] Auth test: http://localhost:${PORT}/api/test-auth/optional`);
      console.log(`🔐 Logout sicuro: POST http://localhost:${PORT}/api/auth/logout`);
    });
  } catch (error) {
    console.log('🔴 Errore avvio server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect();
    if (redisClient.isHealthy()) {
      await redisClient.disconnect();
    }
  } catch (error) {
    console.log('🔴 Errore durante shutdown:', error.message);
  }
});

// Error handling global
process.on('uncaughtException', (error) => {
  console.log('🔴 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('🔴 Unhandled Rejection at:', promise);
  console.log('🔴 Reason:', reason);
  process.exit(1);
});

// Start
startServer();

module.exports = app;
