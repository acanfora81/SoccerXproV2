// server/src/app.js
// Main application con sistema logout sicuro

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('../prisma/generated/client');
const cookieParser = require('cookie-parser');


// Import componenti sicurezza
const redisClient = require('./config/redis');
const TokenBlacklist = require('./utils/tokenBlacklist');

console.log('🟢 Starting SoccerXpro V2 Server con logout sicuro...'); // INFO - rimuovere in produzione

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // 🟡 DEBUG - rimuovere in produzione
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: 'http://localhost:3000', // 👈 il tuo frontend in dev
  credentials: true                // 🔑 abilita invio cookie
};
app.use(cors(corsOptions));
app.use(morgan('combined')); // 🟠 PERFORMANCE - valutare caso per caso
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
    console.log('🔵 Inizializzazione sistema sicurezza...'); // INFO DEV

    // Step 1: Inizializza Redis (opzionale)
    try {
      const redisConnected = await redisClient.connect();
      if (redisConnected) {
        console.log('🟢 Redis connesso per token blacklist');
      } else {
        console.log('🟡 Redis non disponibile, modalità fallback attivata');
      }
    } catch (redisError) {
      console.log('🟡 Redis connection error (fallback mode):', redisError.message);
    }

    // Step 2: Inizializza TokenBlacklist
    const blacklistReady = await TokenBlacklist.initialize();
    if (blacklistReady) {
      console.log('🟢 TokenBlacklist inizializzato');
    } else {
      console.log('🟡 TokenBlacklist in modalità limitata');
    }

    securityInitialized = true;
    console.log('🟢 Sistema sicurezza inizializzato');
  } catch (error) {
    console.log('🔴 Errore inizializzazione sicurezza:', error.message);
    securityInitialized = false; // non blocchiamo l'avvio
  }
};

// Health check endpoint con info sicurezza
app.get('/health', async (req, res) => {
  console.log('🔵 Health check requested'); // INFO DEV
  const healthData = {
    status: 'OK',
    message: 'SoccerXpro V2 Server is running',
    timestamp: new Date().toISOString(),
    security: {
      initialized: securityInitialized,
      redis: redisClient.isHealthy(),
      blacklist: securityInitialized ? await TokenBlacklist.getStats() : null,
    },
  };
  res.json(healthData);
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    console.log('🔵 Testing database connection...'); // INFO DEV
    await prisma.$connect();
    console.log('🟢 Database connected successfully');
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    console.log('🔴 Database connection failed:', error.message);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// 🧪 Route di test autenticazione
const testAuthRoutes = require('./routes/test-auth');
app.use('/api/test-auth', testAuthRoutes);

// 🔐 Route autenticazione principali
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 👥 Route giocatori
console.log('🔵 Tentativo caricamento route players...'); // DEBUG
const playersRoutes = require('./routes/players');
app.use('/api/players', playersRoutes);
console.log('🟢 Route players caricate con successo'); // DEBUG

// 📊 Route performance
console.log('🔵 Tentativo caricamento route performance...'); // DEBUG
const performanceRoutes = require('./routes/performance');
app.use('/api/performance', performanceRoutes);
console.log('🟢 Route performance caricate con successo'); // DEBUG

// riepilogo route
console.log('🔵 Route caricate:');
console.log('  - GET /health (con info sicurezza)');
console.log('  - GET /test-db');
console.log('  - GET /api/test-auth/protected');
console.log('  - GET /api/test-auth/optional');
console.log('  - GET /api/test-auth/me');
console.log('  - POST /api/auth/login');
console.log('  - POST /api/auth/register');
console.log('  - POST /api/auth/logout (SICURO)');
console.log('  - POST /api/auth/refresh');
console.log('  - GET /api/auth/me');
console.log('  - GET/POST/PUT/DELETE /api/players');
// elenco dettagliato performance (coerente con routes/performance.js)
console.log('  - GET /api/performance');
console.log('  - GET /api/performance/:id');
console.log('  - POST /api/performance');
console.log('  - DELETE /api/performance/:id');
console.log('  - GET /api/performance/stats/player/:playerId');
console.log('  - GET /api/performance/stats/team');

const PORT = process.env.PORT || 3001;

// Avvia server con inizializzazione sicurezza
const startServer = async () => {
  try {
    await initializeSecurity();
    app.listen(PORT, () => {
      console.log(`🟢 Server running on port ${PORT}`);
      console.log(`🔵 Health check: http://localhost:${PORT}/health`);
      console.log(`🔵 DB test: http://localhost:${PORT}/test-db`);
      console.log(`🔵 Auth test: http://localhost:${PORT}/api/test-auth/optional`);
      console.log(`🔐 Logout sicuro: POST http://localhost:${PORT}/api/auth/logout`);
    });
  } catch (error) {
    console.log('🔴 Errore avvio server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown con pulizia Redis
process.on('beforeExit', async () => {
  console.log('🟡 Shutting down gracefully...');
  try {
    console.log('🟡 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('🟢 Database disconnected');

    if (redisClient.isHealthy()) {
      console.log('🟡 Disconnecting from Redis...');
      await redisClient.disconnect();
      console.log('🟢 Redis disconnected');
    }
  } catch (error) {
    console.log('🔴 Errore durante shutdown:', error.message);
  }
});

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.log('🔴 Uncaught Exception:', error.message);
  console.log('🔴 Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('🔴 Unhandled Rejection at:', promise);
  console.log('🔴 Reason:', reason);
  process.exit(1);
});

// Avvia il server
startServer();

module.exports = app;
