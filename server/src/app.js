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

console.log('🟢 Starting SoccerXpro V2 Server con logout sicuro...');

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
    console.log('🔵 Inizializzazione sistema sicurezza...');

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
    securityInitialized = false;
  }
};

// Health check
app.get('/health', async (req, res) => {
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
const testAuthRoutes = require('./routes/test-auth');
app.use('/api/test-auth', testAuthRoutes);

// 🔐 Auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 👥 Players
const playersRoutes = require('./routes/players');
app.use('/api/players', playersRoutes);

// 📊 Performance CRUD
const performanceRoutes = require('./routes/performance');
app.use('/api/performance', performanceRoutes);

// Riepilogo route
console.log('🔵 Route caricate:');
console.log('  - GET /health');
console.log('  - GET /test-db');
console.log('  - /api/test-auth/*');
console.log('  - /api/auth/*');
console.log('  - /api/players/*');
console.log('  - /api/performance/* (CRUD)');


const PORT = process.env.PORT || 3001;

// Avvio server
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
