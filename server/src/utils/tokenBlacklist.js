// 🛡️ server/src/utils/tokenBlacklist.js
// Gestione blacklist token per logout sicuro

const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');
console.log('🟢 Caricamento token blacklist manager...'); // INFO - rimuovere in produzione

class TokenBlacklist {
  
  /**
   * 🚫 Aggiungi token alla blacklist
   */
  static async addToBlacklist(token) {
    try {
      console.log('🔵 Aggiunta token a blacklist...'); // INFO DEV - rimuovere in produzione
      
      // Decodifica token per ottenere exp (scadenza)
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        console.log('🟡 Token non decodificabile o senza scadenza'); // WARNING - rimuovere in produzione
        return false;
      }
      
      // Calcola TTL rimanente del token
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = decoded.exp - now;
      
      if (timeToExpire <= 0) {
        console.log('🔵 Token già scaduto, skip blacklist'); // INFO DEV - rimuovere in produzione
        return true; // Token già scaduto, non serve blacklist
      }
      
      // Chiave Redis per il token
      const blacklistKey = `blacklist:${this.getTokenHash(token)}`;
      
      // Aggiungi a Redis con TTL = scadenza token
      const success = await redisClient.setEx(
        blacklistKey,
        timeToExpire,
        JSON.stringify({
          addedAt: new Date().toISOString(),
          userId: decoded.sub || decoded.user_id || 'unknown',
          reason: 'logout'
        })
      );
      
      if (success) {
        console.log('🟢 Token aggiunto a blacklist con TTL:', timeToExpire); // INFO - rimuovere in produzione
      } else {
        console.log('🟡 Fallback: Token blacklist in memoria'); // WARNING - rimuovere in produzione
        // Fallback in memoria per sviluppo senza Redis
        this.memoryBlacklist.set(this.getTokenHash(token), {
          addedAt: Date.now(),
          expiresAt: decoded.exp * 1000
        });
      }
      
      return true;
      
    } catch (error) {
      console.log('🔴 Errore aggiunta blacklist:', error.message); // ERROR - mantenere essenziali
      return false;
    }
  }
  
  /**
   * 🔍 Verifica se token è in blacklist
   */
  static async isBlacklisted(token) {
    try {
      const tokenHash = this.getTokenHash(token);
      const blacklistKey = `blacklist:${tokenHash}`;
      
      // Prima controlla Redis
      if (redisClient.isHealthy()) {
        const exists = await redisClient.exists(blacklistKey);
        if (exists) {
          console.log('🔵 Token trovato in blacklist Redis'); // INFO DEV - rimuovere in produzione
          return true;
        }
      }
      
      // Fallback controllo memoria
      const memoryEntry = this.memoryBlacklist.get(tokenHash);
      if (memoryEntry) {
        // Controlla se scaduto
        if (Date.now() < memoryEntry.expiresAt) {
          console.log('🔵 Token trovato in blacklist memoria'); // INFO DEV - rimuovere in produzione
          return true;
        } else {
          // Rimuovi entry scaduta
          this.memoryBlacklist.delete(tokenHash);
        }
      }
      
      return false;
      
    } catch (error) {
      console.log('🔴 Errore verifica blacklist:', error.message); // ERROR - mantenere essenziali
      // In caso di errore, assume non blacklisted per evitare blocchi
      return false;
    }
  }
  
  /**
   * 🧹 Pulisci blacklist utente (logout globale)
   */
  static async clearUserTokens(userId) {
    try {
      console.log('🔵 Pulizia token utente:', userId); // INFO DEV - rimuovere in produzione
      
      if (redisClient.isHealthy()) {
        const pattern = `blacklist:*`;
        const deletedCount = await redisClient.deletePattern(pattern);
        console.log(`🟢 Eliminati ${deletedCount} token blacklist per logout globale`); // INFO - rimuovere in produzione
        return deletedCount;
      }
      
      // Fallback memoria: pulisci tutto (semplificato)
      const sizeBefore = this.memoryBlacklist.size;
      this.memoryBlacklist.clear();
      console.log(`🟡 Pulita blacklist memoria: ${sizeBefore} entries`); // WARNING - rimuovere in produzione
      return sizeBefore;
      
    } catch (error) {
      console.log('🔴 Errore pulizia token utente:', error.message); // ERROR - mantenere essenziali
      return 0;
    }
  }
  
  /**
   * 📊 Statistiche blacklist
   */
  static async getStats() {
    try {
      const stats = {
        redisHealthy: redisClient.isHealthy(),
        memorySize: this.memoryBlacklist.size,
        redisSize: 0
      };
      
      if (redisClient.isHealthy()) {
        try {
          const keys = await redisClient.client.keys('blacklist:*');
          stats.redisSize = keys.length;
        } catch (error) {
          console.log('🟡 Errore conteggio chiavi Redis:', error.message); // WARNING - rimuovere in produzione
        }
      }
      
      return stats;
      
    } catch (error) {
      console.log('🔴 Errore statistiche blacklist:', error.message); // ERROR - mantenere essenziali
      return {
        redisHealthy: false,
        memorySize: 0,
        redisSize: 0,
        error: error.message
      };
    }
  }
  
  /**
   * 🔐 Hash del token per chiave Redis
   */
  static getTokenHash(token) {
    // Usa gli ultimi 32 caratteri del token come hash
    // Evita di memorizzare il token completo per sicurezza
    return token.slice(-32);
  }
  
  /**
   * 🧠 Fallback blacklist in memoria per sviluppo
   */
  static memoryBlacklist = new Map();
  
  /**
   * 🧹 Pulizia periodica memoria (garbage collection)
   */
  static startMemoryCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [hash, entry] of this.memoryBlacklist.entries()) {
        if (now >= entry.expiresAt) {
          this.memoryBlacklist.delete(hash);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🔵 Garbage collection: rimossi ${cleanedCount} token scaduti dalla memoria`); // INFO DEV - rimuovere in produzione
      }
    }, 5 * 60 * 1000); // Ogni 5 minuti
  }
  
  /**
   * 🔄 Inizializzazione
   */
  static async initialize() {
    try {
      console.log('🟢 Inizializzazione TokenBlacklist...'); // INFO - rimuovere in produzione
      
      // Avvia pulizia memoria
      this.startMemoryCleanup();
      
      // Test Redis se disponibile
      if (redisClient.isHealthy()) {
        const testKey = 'blacklist:test';
        const success = await redisClient.setEx(testKey, 1, 'test');
        if (success) {
          await redisClient.del(testKey);
          console.log('🟢 TokenBlacklist Redis test passed'); // INFO - rimuovere in produzione
        }
      } else {
        console.log('🟡 TokenBlacklist: modalità memoria attiva'); // WARNING - rimuovere in produzione
      }
      
      return true;
      
    } catch (error) {
      console.log('🔴 Errore inizializzazione TokenBlacklist:', error.message); // ERROR - mantenere essenziali
      return false;
    }
  }
}

module.exports = TokenBlacklist;