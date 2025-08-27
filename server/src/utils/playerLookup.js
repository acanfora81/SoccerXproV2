// server/src/utils/playerLookup.js
// 🔍 Fuzzy Player Matching Engine per Performance Import - SoccerXpro V2

const { getPrismaClient } = require('../config/database');
const redisClient = require('../config/redis');

console.log('🟢 Inizializzazione Player Lookup Engine...'); // INFO - rimuovere in produzione

/**
 * 🧠 FUZZY PLAYER LOOKUP CLASS
 * Risolve nomi giocatori da CSV a Player ID con matching intelligente
 */
class FuzzyPlayerLookup {
  
  constructor() {
    this.prisma = getPrismaClient();
    this.playerCache = new Map(); // Cache in-memory per performance
    this.initializeNormalizers();
  }

  /**
   * 🔧 Inizializza normalizzatori testo
   */
  initializeNormalizers() {
    console.log('🔵 Inizializzazione normalizzatori testo...'); // INFO DEV - rimuovere in produzione

    // Mappa caratteri speciali → ASCII
    this.accentMap = {
      'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ą': 'a', 'å': 'a', 'ã': 'a',
      'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'ę': 'e', 'ė': 'e',
      'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i', 'į': 'i',
      'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ø': 'o', 'õ': 'o',
      'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ų': 'u',
      'ç': 'c', 'č': 'c', 'ć': 'c',
      'ñ': 'n', 'ń': 'n',
      'š': 's', 'ś': 's',
      'ž': 'z', 'ź': 'z', 'ż': 'z',
      'ł': 'l', 'ľ': 'l',
      'ř': 'r', 'ŕ': 'r',
      'ť': 't',
      'ý': 'y', 'ÿ': 'y',
      'đ': 'd', 'ď': 'd'
    };

    // Pattern per riconoscere formati nome
    this.namePatterns = {
      // "Mario Rossi"
      fullName: /^([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+)\s+([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+)$/,
      
      // "Rossi, Mario" o "Rossi,Mario"
      lastFirst: /^([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+),\s*([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+)$/,
      
      // "Mario R." o "M. Rossi"
      firstInitial: /^([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď]+)[\s]*([A-Z])\.?$/,
      initialLast: /^([A-Z])\.?\s*([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+)$/,
      
      // "#10", "10", "Player_10"
      shirtNumber: /^(?:#|player[_\s]*)?(\d{1,2})$/i,
      
      // "mario.rossi", "m.rossi@email.com"
      emailFormat: /^([a-zA-Z]+)[\._]([a-zA-Z]+)(?:@.*)?$/,
      
      // Solo cognome "Rossi"
      singleName: /^([a-zA-Zàáäâāąåãèéëêēęėìíïîīįòóöôōøõùúüûūųçčćñńšśžźżłľřŕťýÿđď\s'-]+)$/
    };

    console.log('🟢 Normalizzatori inizializzati con successo'); // INFO - rimuovere in produzione
  }

  /**
   * 🎯 MAIN METHOD: Risolve stringa player a Player ID
   * @param {String} playerString - Stringa da CSV (nome, numero, etc.)
   * @param {String} teamId - ID team per scope ricerca
   * @returns {Object} - Result con player ID o disambiguation options
   */
  async resolvePlayer(playerString, teamId) {
    try {
      if (!playerString || !teamId) {
        throw new Error('Player string e team ID richiesti');
      }

      console.log('🔵 Risoluzione player:', playerString, 'per team:', teamId); // INFO DEV - rimuovere in produzione

      // 🚀 Step 1: Cache lookup
      const cacheKey = `${teamId}:${this.normalizeString(playerString)}`;
      if (this.playerCache.has(cacheKey)) {
        const cached = this.playerCache.get(cacheKey);
        console.log('🟢 Player trovato in cache:', cached); // INFO - rimuovere in produzione
        return cached;
      }

      // 📋 Step 2: Load team players se non in cache
      const teamPlayers = await this.getTeamPlayers(teamId);
      
      // 🔍 Step 3: Try exact matches first
      const exactMatch = await this.findExactMatch(playerString, teamPlayers);
      if (exactMatch.success) {
        this.cacheResult(cacheKey, exactMatch);
        return exactMatch;
      }

      // 🎯 Step 4: Try fuzzy matching
      const fuzzyMatches = await this.findFuzzyMatches(playerString, teamPlayers);
      
      if (fuzzyMatches.length === 1) {
        // Single fuzzy match - auto-resolve
        const result = {
          success: true,
          playerId: fuzzyMatches[0].id,
          player: fuzzyMatches[0],
          confidence: fuzzyMatches[0].confidence,
          matchType: 'fuzzy_single',
          originalString: playerString
        };
        
        this.cacheResult(cacheKey, result);
        console.log('🟢 Single fuzzy match trovato:', fuzzyMatches[0].firstName, fuzzyMatches[0].lastName, `(${fuzzyMatches[0].confidence}%)`); // INFO - rimuovere in produzione
        return result;
        
      } else if (fuzzyMatches.length > 1) {
        // Multiple matches - need disambiguation
        console.log('🟡 Multiple fuzzy matches trovati:', fuzzyMatches.length, 'opzioni'); // WARNING - rimuovere in produzione
        
        return {
          success: false,
          needsDisambiguation: true,
          originalString: playerString,
          options: fuzzyMatches.map(p => ({
            playerId: p.id,
            displayName: `${p.firstName} ${p.lastName}`,
            position: p.position,
            shirtNumber: p.shirtNumber,
            confidence: p.confidence,
            matchReason: p.matchReason
          }))
        };
        
      } else {
        // No matches found
        console.log('🔴 Nessun match trovato per:', playerString); // ERROR - mantenere essenziali
        
        return {
          success: false,
          error: 'PLAYER_NOT_FOUND',
          message: `Giocatore "${playerString}" non trovato nel team`,
          originalString: playerString,
          suggestions: await this.getSuggestions(playerString, teamPlayers)
        };
      }

    } catch (error) {
      console.log('🔴 Errore risoluzione player:', error.message); // ERROR - mantenere essenziali
      return {
        success: false,
        error: 'LOOKUP_ERROR',
        message: error.message,
        originalString: playerString
      };
    }
  }

  /**
   * 📋 Carica giocatori del team (con cache Redis)
   * @param {String} teamId - ID team
   * @returns {Array} - Lista giocatori team
   */
  async getTeamPlayers(teamId) {
    try {
      // 🚀 Try Redis cache first
      const cacheKey = `team_players:${teamId}`;
      
      if (redisClient.isHealthy()) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const players = JSON.parse(cached);
          console.log('🟢 Team players caricati da Redis cache:', players.length); // INFO - rimuovere in produzione
          return players;
        }
      }

      // 💾 Load from database
      console.log('🔵 Caricamento team players da database...'); // INFO DEV - rimuovere in produzione
      
      const players = await this.prisma.player.findMany({
        where: { 
          teamId,
          isActive: true // Solo giocatori attivi
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          shirtNumber: true,
          nationality: true,
          dateOfBirth: true
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      });

      console.log('🟢 Team players caricati da DB:', players.length); // INFO - rimuovere in produzione

      // 🚀 Cache in Redis per 10 minuti
      if (redisClient.isHealthy()) {
        await redisClient.setEx(cacheKey, 10 * 60, JSON.stringify(players));
      }

      return players;

    } catch (error) {
      console.log('🔴 Errore caricamento team players:', error.message); // ERROR - mantenere essenziali
      return [];
    }
  }

  /**
   * ✅ Trova match esatti
   * @param {String} playerString - Stringa input
   * @param {Array} teamPlayers - Lista giocatori team
   * @returns {Object} - Result con match esatto
   */
  async findExactMatch(playerString, teamPlayers) {
    const normalized = this.normalizeString(playerString);
    
    console.log('🔵 Ricerca exact match per:', normalized); // INFO DEV - rimuovere in produzione

    for (const player of teamPlayers) {
      // 🎯 Full name exact match
      const fullName = this.normalizeString(`${player.firstName} ${player.lastName}`);
      if (normalized === fullName) {
        console.log('🟢 Exact full name match:', player.firstName, player.lastName); // INFO - rimuovere in produzione
        return {
          success: true,
          playerId: player.id,
          player: player,
          confidence: 100,
          matchType: 'exact_full_name',
          originalString: playerString
        };
      }

      // 🎯 Shirt number exact match
      const shirtMatch = playerString.match(this.namePatterns.shirtNumber);
      if (shirtMatch && player.shirtNumber && player.shirtNumber === parseInt(shirtMatch[1], 10)) {
        console.log('🟢 Exact shirt number match:', player.shirtNumber); // INFO - rimuovere in produzione
        return {
          success: true,
          playerId: player.id,
          player: player,
          confidence: 100,
          matchType: 'exact_shirt_number',
          originalString: playerString
        };
      }

      // 🎯 Reversed name exact match "Rossi, Mario"
      const reversedName = this.normalizeString(`${player.lastName}, ${player.firstName}`);
      if (normalized === reversedName || normalized === this.normalizeString(`${player.lastName} ${player.firstName}`)) {
        console.log('🟢 Exact reversed name match:', player.lastName, player.firstName); // INFO - rimuovere in produzione
        return {
          success: true,
          playerId: player.id,
          player: player,
          confidence: 100,
          matchType: 'exact_reversed_name',
          originalString: playerString
        };
      }
    }

    return { success: false };
  }

  /**
   * 🎯 Trova fuzzy matches con scoring
   * @param {String} playerString - Stringa input
   * @param {Array} teamPlayers - Lista giocatori team
   * @returns {Array} - Lista match ordinati per confidence
   */
  async findFuzzyMatches(playerString, teamPlayers) {
    const matches = [];
    const normalized = this.normalizeString(playerString);
    
    console.log('🔵 Ricerca fuzzy matches per:', normalized); // INFO DEV - rimuovere in produzione

    // 🔍 Analizza formato input per strategie specifiche
    const inputFormat = this.detectInputFormat(playerString);
    console.log('🔵 Formato input rilevato:', inputFormat.type); // INFO DEV - rimuovere in produzione

    for (const player of teamPlayers) {
      const playerMatches = [];

      // 🎯 Strategy 1: Full name fuzzy
      const fullNameScore = this.calculateLevenshteinSimilarity(
        normalized,
        this.normalizeString(`${player.firstName} ${player.lastName}`)
      );
      
      if (fullNameScore >= 70) { // Soglia 70% per full name
        playerMatches.push({
          ...player,
          confidence: Math.round(fullNameScore),
          matchReason: 'fuzzy_full_name',
          matchDetails: `Nome completo simile (${Math.round(fullNameScore)}%)`
        });
      }

      // 🎯 Strategy 2: First initial + Last name "Mario R." vs "Mario Rossi"
      if (inputFormat.type === 'firstInitial') {
        const firstMatch = this.normalizeString(player.firstName).startsWith(this.normalizeString(inputFormat.first));
        const lastSimilarity = this.calculateLevenshteinSimilarity(
          this.normalizeString(inputFormat.last),
          this.normalizeString(player.lastName)
        );

        if (firstMatch && lastSimilarity >= 80) {
          playerMatches.push({
            ...player,
            confidence: Math.round(lastSimilarity * 0.9), // Penalizza leggermente
            matchReason: 'fuzzy_first_initial',
            matchDetails: `Prima iniziale + cognome simile (${Math.round(lastSimilarity)}%)`
          });
        }
      }

      // 🎯 Strategy 3: Last name + First initial "M. Rossi" vs "Mario Rossi"
      if (inputFormat.type === 'initialLast') {
        const lastSimilarity = this.calculateLevenshteinSimilarity(
          this.normalizeString(inputFormat.last),
          this.normalizeString(player.lastName)
        );
        const firstMatch = this.normalizeString(player.firstName).startsWith(this.normalizeString(inputFormat.first));

        if (firstMatch && lastSimilarity >= 80) {
          playerMatches.push({
            ...player,
            confidence: Math.round(lastSimilarity * 0.9),
            matchReason: 'fuzzy_initial_last',
            matchDetails: `Iniziale + cognome simile (${Math.round(lastSimilarity)}%)`
          });
        }
      }

      // 🎯 Strategy 4: Email format "mario.rossi" vs "Mario Rossi"
      if (inputFormat.type === 'emailFormat') {
        const firstSimilarity = this.calculateLevenshteinSimilarity(
          this.normalizeString(inputFormat.first),
          this.normalizeString(player.firstName)
        );
        const lastSimilarity = this.calculateLevenshteinSimilarity(
          this.normalizeString(inputFormat.last),
          this.normalizeString(player.lastName)
        );

        const avgSimilarity = (firstSimilarity + lastSimilarity) / 2;
        if (avgSimilarity >= 75) {
          playerMatches.push({
            ...player,
            confidence: Math.round(avgSimilarity * 0.95),
            matchReason: 'fuzzy_email_format',
            matchDetails: `Formato email simile (${Math.round(avgSimilarity)}%)`
          });
        }
      }

      // 🎯 Strategy 5: Single name (solo cognome o solo nome)
      if (inputFormat.type === 'singleName') {
        const firstNameSimilarity = this.calculateLevenshteinSimilarity(
          normalized,
          this.normalizeString(player.firstName)
        );
        const lastNameSimilarity = this.calculateLevenshteinSimilarity(
          normalized,
          this.normalizeString(player.lastName)
        );

        if (firstNameSimilarity >= 85) {
          playerMatches.push({
            ...player,
            confidence: Math.round(firstNameSimilarity * 0.8), // Penalizza match parziale
            matchReason: 'fuzzy_first_name_only',
            matchDetails: `Solo nome simile (${Math.round(firstNameSimilarity)}%)`
          });
        }

        if (lastNameSimilarity >= 85) {
          playerMatches.push({
            ...player,
            confidence: Math.round(lastNameSimilarity * 0.8),
            matchReason: 'fuzzy_last_name_only',
            matchDetails: `Solo cognome simile (${Math.round(lastNameSimilarity)}%)`
          });
        }
      }

      // Prendi il miglior match per questo player (se ce ne sono)
      if (playerMatches.length > 0) {
        const bestMatch = playerMatches.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        matches.push(bestMatch);
      }
    }

    // 📊 Ordina per confidence e filtra soglia minima
    const filteredMatches = matches
      .filter(match => match.confidence >= 60) // Soglia minima 60%
      .sort((a, b) => b.confidence - a.confidence);

    console.log('🟢 Fuzzy matches trovati:', filteredMatches.length); // INFO - rimuovere in produzione
    filteredMatches.forEach(match => {
      console.log(`  - ${match.firstName} ${match.lastName} (${match.confidence}%) - ${match.matchReason}`); // INFO - rimuovere in produzione
    });

    return filteredMatches;
  }

  /**
   * 🔍 Rileva formato della stringa input
   * @param {String} playerString - Stringa input
   * @returns {Object} - Tipo formato e componenti estratti
   */
  detectInputFormat(playerString) {
    const trimmed = playerString.trim();

    // Test shirt number
    const shirtMatch = trimmed.match(this.namePatterns.shirtNumber);
    if (shirtMatch) {
      return { type: 'shirtNumber', number: parseInt(shirtMatch[1], 10) };
    }

    // Test email format
    const emailMatch = trimmed.match(this.namePatterns.emailFormat);
    if (emailMatch) {
      return { type: 'emailFormat', first: emailMatch[1], last: emailMatch[2] };
    }

    // Test "Last, First"
    const lastFirstMatch = trimmed.match(this.namePatterns.lastFirst);
    if (lastFirstMatch) {
      return { type: 'lastFirst', last: lastFirstMatch[1], first: lastFirstMatch[2] };
    }

    // Test "First I."
    const firstInitialMatch = trimmed.match(this.namePatterns.firstInitial);
    if (firstInitialMatch) {
      return { type: 'firstInitial', first: firstInitialMatch[1], last: firstInitialMatch[2] };
    }

    // Test "I. Last"
    const initialLastMatch = trimmed.match(this.namePatterns.initialLast);
    if (initialLastMatch) {
      return { type: 'initialLast', first: initialLastMatch[1], last: initialLastMatch[2] };
    }

    // Test "First Last"
    const fullNameMatch = trimmed.match(this.namePatterns.fullName);
    if (fullNameMatch) {
      return { type: 'fullName', first: fullNameMatch[1], last: fullNameMatch[2] };
    }

    // Default: single name
    return { type: 'singleName', name: trimmed };
  }

  /**
   * 📏 Calcola similarità Levenshtein (0-100%)
   * @param {String} str1 - Prima stringa
   * @param {String} str2 - Seconda stringa
   * @returns {Number} - Percentuale similarità
   */
  calculateLevenshteinSimilarity(str1, str2) {
    if (str1 === str2) return 100;
    if (str1.length === 0) return str2.length === 0 ? 100 : 0;
    if (str2.length === 0) return 0;

    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.max(0, similarity);
  }

  /**
   * 🧹 Normalizza stringa per comparison
   * @param {String} str - Stringa da normalizzare
   * @returns {String} - Stringa normalizzata
   */
  normalizeString(str) {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .trim()
      // Rimuovi caratteri extra
      .replace(/[^\w\s]/g, ' ')
      // Sostituisci accenti
      .split('')
      .map(char => this.accentMap[char] || char)
      .join('')
      // Normalizza spazi
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 💡 Genera suggestions per player non trovati
   * @param {String} playerString - Stringa originale
   * @param {Array} teamPlayers - Lista giocatori team
   * @returns {Array} - Suggestions con similarità
   */
  async getSuggestions(playerString, teamPlayers) {
    const suggestions = [];
    const normalized = this.normalizeString(playerString);

    // Trova i 3 nomi più simili (anche sotto soglia)
    for (const player of teamPlayers) {
      const fullNameScore = this.calculateLevenshteinSimilarity(
        normalized,
        this.normalizeString(`${player.firstName} ${player.lastName}`)
      );

      if (fullNameScore >= 30) { // Soglia molto bassa per suggestions
        suggestions.push({
          playerId: player.id,
          displayName: `${player.firstName} ${player.lastName}`,
          position: player.position,
          shirtNumber: player.shirtNumber,
          similarity: Math.round(fullNameScore)
        });
      }
    }

    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // Top 3 suggestions
  }

  /**
   * 💾 Cache result per performance
   * @param {String} cacheKey - Chiave cache
   * @param {Object} result - Risultato da cachare
   */
  cacheResult(cacheKey, result) {
    this.playerCache.set(cacheKey, result);
    
    // Limit cache size (LRU-style)
    if (this.playerCache.size > 1000) {
      const firstKey = this.playerCache.keys().next().value;
      this.playerCache.delete(firstKey);
    }
  }

  /**
   * 🧹 Clear cache (per testing o refresh)
   * @param {String} teamId - Optional team ID to clear specific team
   */
  clearCache(teamId = null) {
    if (teamId) {
      // Clear cache per team specifico
      for (const [key] of this.playerCache.entries()) {
        if (key.startsWith(`${teamId}:`)) {
          this.playerCache.delete(key);
        }
      }
      console.log('🟡 Cache cleared per team:', teamId); // WARNING - rimuovere in produzione
    } else {
      // Clear tutto
      this.playerCache.clear();
      console.log('🟡 Cache completamente cleared'); // WARNING - rimuovere in produzione
    }

    // Clear Redis cache
    if (redisClient.isHealthy() && teamId) {
      const cacheKey = `team_players:${teamId}`;
      redisClient.del(cacheKey);
    }
  }

  /**
   * 📊 Statistics cache e performance
   * @returns {Object} - Stats sistema
   */
  getCacheStats() {
    return {
      cacheSize: this.playerCache.size,
      redisHealthy: redisClient.isHealthy(),
      patternsLoaded: Object.keys(this.namePatterns).length,
      accentMappings: Object.keys(this.accentMap).length
    };
  }
}

// Export singleton instance
const fuzzyPlayerLookup = new FuzzyPlayerLookup();

console.log('🟢 Fuzzy Player Lookup inizializzato e pronto'); // INFO - rimuovere in produzione

module.exports = fuzzyPlayerLookup;