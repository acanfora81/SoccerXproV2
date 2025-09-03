// 🔧 server/src/config/redis.js
// Configurazione Redis per token blacklist

const redis = require('redis');
console.log('🟢 [INFO] Inizializzazione client Redis...'); // INFO - rimuovere in produzione

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * 🔌 Inizializza connessione Redis
   */
  async connect() {
    try {
      // Configurazione client Redis
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        // Configurazione per environment di sviluppo
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      };

      // Crea client Redis
      if (process.env.REDIS_URL) {
        console.log('🔵 [DEBUG] Connessione Redis via URL...'); // INFO DEV - rimuovere in produzione
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          ...redisConfig
        });
      } else {
        console.log('🔵 [DEBUG] Connessione Redis via host/port...'); // INFO DEV - rimuovere in produzione
        this.client = redis.createClient(redisConfig);
      }

      // Event listeners
      this.client.on('connect', () => {
        console.log('🟢 [INFO] Redis: Connessione stabilita'); // INFO - rimuovere in produzione
      });

      this.client.on('ready', () => {
        console.log('🟢 [INFO] Redis: Client pronto'); // INFO - rimuovere in produzione
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.log('🔴 Redis: Errore connessione:', error.message); // ERROR - mantenere essenziali
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🟡 [WARN] Redis: Connessione chiusa'); // WARNING - rimuovere in produzione
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🟡 [WARN] Redis: Tentativo riconnessione...'); // WARNING - rimuovere in produzione
      });

      // Connetti
      await this.client.connect();
      
      // Test ping
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        console.log('🟢 [INFO] Redis: Test ping riuscito'); // INFO - rimuovere in produzione
      }

      return true;

    } catch (error) {
      console.log('🔴 Redis: Errore inizializzazione:', error.message); // ERROR - mantenere essenziali
      this.isConnected = false;
      
      // In sviluppo, continua senza Redis
      if (process.env.NODE_ENV === 'development') {
        console.log('🟡 [WARN] Redis: Modalità fallback attivata (sviluppo)'); // WARNING - rimuovere in produzione
        return false;
      }
      
      throw error;
    }
  }

  /**
   * ❌ Disconnetti da Redis
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        console.log('🟢 [INFO] Redis: Disconnessione completata'); // INFO - rimuovere in produzione
      }
    } catch (error) {
      console.log('🔴 Redis: Errore disconnessione:', error.message); // ERROR - mantenere essenziali
    }
  }

  /**
   * 🏥 Verifica stato connessione
   */
  isHealthy() {
    return this.isConnected && this.client?.isReady;
  }

  /**
   * 📝 Set con TTL
   */
  async setEx(key, seconds, value) {
    try {
      if (!this.isHealthy()) {
        console.log('🟡 [WARN] Redis non disponibile per setEx'); // WARNING - rimuovere in produzione
        return false;
      }
      
      await this.client.setEx(key, seconds, value);
      return true;
    } catch (error) {
      console.log('🔴 Redis setEx error:', error.message); // ERROR - mantenere essenziali
      return false;
    }
  }

  /**
   * 📖 Get valore
   */
  async get(key) {
    try {
      if (!this.isHealthy()) {
        console.log('🟡 [WARN] Redis non disponibile per get'); // WARNING - rimuovere in produzione
        return null;
      }
      
      return await this.client.get(key);
    } catch (error) {
      console.log('🔴 Redis get error:', error.message); // ERROR - mantenere essenziali
      return null;
    }
  }

  /**
   * 🗑️ Elimina chiave
   */
  async del(key) {
    try {
      if (!this.isHealthy()) {
        console.log('🟡 [WARN] Redis non disponibile per del'); // WARNING - rimuovere in produzione
        return false;
      }
      
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.log('🔴 Redis del error:', error.message); // ERROR - mantenere essenziali
      return false;
    }
  }

  /**
   * 🔍 Verifica esistenza chiave
   */
  async exists(key) {
    try {
      if (!this.isHealthy()) {
        console.log('🟡 [WARN] Redis non disponibile per exists'); // WARNING - rimuovere in produzione
        return false;
      }
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.log('🔴 Redis exists error:', error.message); // ERROR - mantenere essenziali
      return false;
    }
  }

  /**
   * 🧹 Pulisci pattern di chiavi
   */
  async deletePattern(pattern) {
    try {
      if (!this.isHealthy()) {
        console.log('🟡 [WARN] Redis non disponibile per deletePattern'); // WARNING - rimuovere in produzione
        return 0;
      }
      
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.client.del(keys);
      console.log(`🔵 [DEBUG] Redis: Eliminate ${result} chiavi con pattern ${pattern}`); // INFO DEV - rimuovere in produzione
      return result;
    } catch (error) {
      console.log('🔴 Redis deletePattern error:', error.message); // ERROR - mantenere essenziali
      return 0;
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;