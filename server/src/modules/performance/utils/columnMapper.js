// Percorso: server/src/modules/performance/utils/columnMapper.js
// 🤖 Smart Column Mapping Engine per Performance Import - SoccerXpro V2 (FULL AUTO)

const crypto = require('crypto');
const { getPrismaClient } = require('../../../config/database');
const redisClient = require('../../../config/redis');
const { completeRow } = require('../../../utils/gpsDeriver');

console.log('🟢 [INFO] Inizializzazione Smart Column Mapper (full auto)…');

/**
 * 🔧 Helper: identifica campi custom
 */
function isCustomField(field) {
  return typeof field === 'string' && field.startsWith('custom.');
}

/**
 * 🧠 SMART COLUMN MAPPER
 */
class SmartColumnMapper {
  constructor() {
    this.prisma = getPrismaClient();
    this.initializePatterns();
  }

  // =========================
  // PATTERN ENGINE
  // =========================
  initializePatterns() {
    console.log('🔵 [DEBUG] Inizializzazione pattern riconoscimento…');

    // 👤 PLAYER PATTERNS - Multi-lingua + GPS vendors
    this.playerPatterns = [
      // Italiano
      /^(giocatore|atleta|nome|player|name)$/i,
      /^(nome[\s_]+(giocatore|atleta|completo)?)$/i,
      /^(cognome[\s_]*nome|nome[\s_]*cognome)$/i,

      // English GPS vendors
      /^(athlete[\s_]*name|player[\s_]*name|full[\s_]*name)$/i,
      /^(first[\s_]*name|last[\s_]*name|surname)$/i,

      // GPS specifici
      /^(polar[\s_]*athlete|garmin[\s_]*user|catapult[\s_]*player)$/i,
      /^(user[\s_]*name|participant)$/i,

      // Formati numerici
      /^(numero[\s_]*maglia|shirt[\s_]*number|jersey[\s_]*num)$/i,
      /^(player[\s_]*id|athlete[\s_]*id|#)$/i
    ];

    // 📅 DATE PATTERNS - Multi-formato
    this.datePatterns = [
      // Italiano
      /^(data[\s_]*(allenamento|sessione|training)?|giorno)$/i,
      /^(data[\s_]*partita|match[\s_]*date)$/i,

      // English
      /^(session[\s_]*date|training[\s_]*date|workout[\s_]*date)$/i,
      /^(date|timestamp|time|quando|when)$/i,

      // GPS specifici
      /^(activity[\s_]*date|exercise[\s_]*date|start[\s_]*time)$/i,
      /^(created[\s_]*at|recorded[\s_]*on)$/i
    ];

    // 🏃‍♂️ DISTANCE PATTERNS
    this.distancePatterns = [
      /^(distanza[\s_]*(totale|km|m|metri)?|percorso)$/i,
      /^(chilometri[\s_]*totali|metri[\s_]*totali)$/i,
      /^(total[\s_]*distance|distance[\s_]*(km|m|meters)?|covered)$/i,
      /^(kilometers|kilometres|meters|metres)$/i,
      /^(dist[\s_]*\(?(km|m|meters)\)?|total[\s_]*dist)$/i,
      /^(covered[\s_]*distance|running[\s_]*distance)$/i
    ];

    // ⚡ SPEED PATTERNS
    this.speedPatterns = [
      // max
      /^(velocit[aà][\s_]*(max|massima|picco)?|v\.?max)$/i,
      /^(max[\s_]*speed|maximum[\s_]*speed|top[\s_]*speed|peak[\s_]*speed)$/i,
      /^(speed[\s_]*max|vel[\s_]*max|fastest)$/i,
      // avg
      /^(velocit[aà][\s_]*media|v\.?avg|avg[\s_]*speed|average[\s_]*speed)$/i,
      /^(mean[\s_]*speed|speed[\s_]*avg)$/i,
      // unità
      /^(speed[\s_]*\(?(kmh|km\/h|kph)\)?|velocity)$/i
    ];

    // 💓 HEART RATE PATTERNS
    this.heartRatePatterns = [
      /^(frequenza[\s_]*cardiaca|battito[\s_]*(cardiaco|medio|max)?|fc|bpm)$/i,
      /^(heart[\s_]*rate|hr|cardiac[\s_]*frequency)$/i,
      /^(max[\s_]*hr|hr[\s_]*max|maximum[\s_]*heart[\s_]*rate)$/i,
      /^(avg[\s_]*hr|hr[\s_]*avg|average[\s_]*heart[\s_]*rate|mean[\s_]*hr)$/i,
      /^(heart[\s_]*rate[\s_]*\(?bpm\)?|pulse[\s_]*rate)$/i
    ];

    // ⏱️ DURATION PATTERNS
    this.durationPatterns = [
      /^(durata|tempo[\s_]*(totale|allenamento)?|duration|time)$/i,
      /^(session[\s_]*time|workout[\s_]*duration|training[\s_]*time)$/i,
      /^(elapsed[\s_]*time|total[\s_]*time|active[\s_]*time)$/i,
      /^(minuti|minutes|min|hours|ore)$/i
    ];

    // 🏷️ SESSION TYPE / NAME PATTERNS
    this.sessionTypePatterns = [
      /^(session[\s_]*type|tipo[\s_]*sessione|type)$/i,
      /^(allenamento|training|partita|match)$/i
    ];
    this.sessionNamePatterns = [
      /^(session[\s_]*name|nome[\s_]*sessione|name)$/i
    ];

    // ================= NUOVI PATTERN - DISTANZE E VELOCITÀ =================
    this.equivalentDistancePatterns = [
      /^(distanza[\s_]*equivalente|dist[\s_]*eq|equivalent[\s_]*distance)$/i,
      /^(eq[\s_]*dist|distance[\s_]*equiv|metabolic[\s_]*distance)$/i
    ];

    this.distancePerMinPatterns = [
      /^(distanza[\s_]*per[\s_]*minuto|dist[\s_]*min|distance[\s_]*per[\s_]*min)$/i,
      /^(m\/min|meters[\s_]*per[\s_]*minute|metri[\s_]*al[\s_]*minuto)$/i
    ];

    this.distanceZonePatterns = [
      /^(distanza[\s_]*>[\s_]*15[\s_]*km\/h|d[\s_]*>[\s_]*15|distance[\s_]*over[\s_]*15)$/i,
      /^(distanza[\s_]*15[\s_]*20|d[\s_]*15[\s_]*20|distance[\s_]*15[\s_]*20)$/i,
      /^(distanza[\s_]*20[\s_]*25|d[\s_]*20[\s_]*25|distance[\s_]*20[\s_]*25)$/i,
      /^(distanza[\s_]*>[\s_]*25[\s_]*km\/h|d[\s_]*>[\s_]*25|distance[\s_]*over[\s_]*25)$/i,
      /^(distanza[\s_]*>[\s_]*20[\s_]*km\/h|d[\s_]*>[\s_]*20|distance[\s_]*over[\s_]*20)$/i
    ];

    // ================= NUOVI PATTERN - POTENZA METABOLICA =================
    this.metabolicPowerPatterns = [
      /^(potenza[\s_]*metabolica|pot[\s_]*met|metabolic[\s_]*power)$/i,
      /^(avg[\s_]*metabolic[\s_]*power|potenza[\s_]*media|power[\s_]*wkg)$/i,
      /^(w\/kg|watts[\s_]*per[\s_]*kg|potenza[\s_]*wkg)$/i
    ];

    this.powerZonePatterns = [
      /^(distanza[\s_]*>[\s_]*20[\s_]*w\/kg|d[\s_]*>[\s_]*20w|distance[\s_]*over[\s_]*20w)$/i,
      /^(distanza[\s_]*>[\s_]*35[\s_]*w\/kg|d[\s_]*>[\s_]*35w|distance[\s_]*over[\s_]*35w)$/i,
      /^(max[\s_]*power[\s_]*5s|max[\s_]*pot[\s_]*5s|peak[\s_]*power[\s_]*5s)$/i
    ];

    // ================= NUOVI PATTERN - ACCELERAZIONI/DECELERAZIONI =================
    this.accelerationPatterns = [
      /^(distanza[\s_]*acc[\s_]*>[\s_]*2|d[\s_]*acc[\s_]*>[\s_]*2|distance[\s_]*acc[\s_]*>[\s_]*2)$/i,
      /^(distanza[\s_]*acc[\s_]*>[\s_]*3|d[\s_]*acc[\s_]*>[\s_]*3|distance[\s_]*acc[\s_]*>[\s_]*3)$/i,
      /^(num[\s_]*acc[\s_]*>[\s_]*3|numero[\s_]*acc[\s_]*>[\s_]*3|count[\s_]*acc[\s_]*>[\s_]*3)$/i,
      /^(eventi[\s_]*acc[\s_]*min|acc[\s_]*events[\s_]*min|acceleration[\s_]*events)$/i
    ];

    this.decelerationPatterns = [
      /^(distanza[\s_]*dec[\s_]*>[\s_]*-2|d[\s_]*dec[\s_]*>[\s_]*-2|distance[\s_]*dec[\s_]*>[\s_]*-2)$/i,
      /^(distanza[\s_]*dec[\s_]*<[\s_]*-3|d[\s_]*dec[\s_]*<[\s_]*-3|distance[\s_]*dec[\s_]*<[\s_]*-3)$/i,
      /^(num[\s_]*dec[\s_]*<[\s_]*-3|numero[\s_]*dec[\s_]*<[\s_]*-3|count[\s_]*dec[\s_]*<[\s_]*-3)$/i,
      /^(eventi[\s_]*dec[\s_]*min|dec[\s_]*events[\s_]*min|deceleration[\s_]*events)$/i
    ];

    // ================= NUOVI PATTERN - ZONE DI INTENSITÀ =================
    this.intensityZonePatterns = [
      /^(tempo[\s_]*<[\s_]*5[\s_]*w\/kg|time[\s_]*<[\s_]*5w|duration[\s_]*<[\s_]*5w)$/i,
      /^(tempo[\s_]*5[\s_]*10[\s_]*w\/kg|time[\s_]*5[\s_]*10w|duration[\s_]*5[\s_]*10w)$/i
    ];

    // ================= NUOVI PATTERN - INDICI E PROFILI =================
    this.rvpPatterns = [
      /^(indice[\s_]*rvp|rvp[\s_]*index|running[\s_]*velocity[\s_]*profile)$/i,
      /^(rvp|profile[\s_]*index|velocity[\s_]*profile)$/i
    ];

    this.trainingLoadPatterns = [
      /^(training[\s_]*load|carico[\s_]*allenamento|load[\s_]*training)$/i,
      /^(workload|carico[\s_]*lavoro|session[\s_]*load)$/i
    ];

    // ================= NUOVI PATTERN - INFORMAZIONI AGGIUNTIVE =================
    this.sessionDayPatterns = [
      /^(giorno[\s_]*sessione|day[\s_]*session|session[\s_]*day)$/i,
      /^(weekday|giorno[\s_]*settimana|day[\s_]*of[\s_]*week)$/i
    ];

    this.matchPatterns = [
      /^(è[\s_]*partita|is[\s_]*match|match[\s_]*flag)$/i,
      /^(partita|match|game|competition)$/i,
      /^(true|false|1|0|yes|no)$/i
    ];

    this.drillPatterns = [
      /^(nome[\s_]*esercizio|drill[\s_]*name|exercise[\s_]*name)$/i,
      /^(esercizio|drill|exercise|activity[\s_]*type)$/i,
      /^(possesso[\s_]*palla|tiri[\s_]*in[\s_]*porta|passing[\s_]*drills)$/i
    ];

    console.log('🟢 [INFO] Pattern riconoscimento inizializzati (inclusi 32 nuovi campi)');
  }

  // =========================
  // HEADER NORMALIZATION & TEMPLATES
  // =========================
  normalizeHeader(raw) {
    return String(raw)
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '_') // spazi e simboli → _
      .replace(/^_+|_+$/g, '') // trim _
      .replace(/_+/g, '_'); // compress _
  }

  headersFingerprint(headers) {
    const norm = headers.map(h => this.normalizeHeader(h)).sort();
    const joined = norm.join('|');
    return crypto.createHash('sha1').update(joined).digest('hex');
  }

  async getTemplateByFingerprint(teamId, headers) {
    const fp = this.headersFingerprint(headers);
    const key = `perfmap:${teamId}:fp:${fp}`;
    if (redisClient?.isHealthy?.()) {
      const raw = await redisClient.get(key);
      if (raw) return JSON.parse(raw);
    }
    return null;
  }

  async saveTemplateForFingerprint(teamId, headers, mapping, meta = {}) {
    const fp = this.headersFingerprint(headers);
    const key = `perfmap:${teamId}:fp:${fp}`;
    const payload = {
      version: '1.0',
      teamId,
      fingerprint: fp,
      savedAt: new Date().toISOString(),
      headersNormalized: headers.map(h => this.normalizeHeader(h)).sort(),
      mapping,
      meta // es: { vendor:'Catapult', source:'CSV Import' }
    };
    if (redisClient?.isHealthy?.()) {
      await redisClient.setEx(key, 365 * 24 * 60 * 60, JSON.stringify(payload));
    }
    return payload;
  }

  async indexTemplateFingerprint(teamId, headers) {
    if (!redisClient?.isHealthy?.()) return;
    const fp = this.headersFingerprint(headers);
    const indexKey = `perfmap:${teamId}:index`;
    const currRaw = await redisClient.get(indexKey);
    const curr = currRaw ? JSON.parse(currRaw) : [];
    if (!curr.includes(fp)) {
      curr.push(fp);
      await redisClient.setEx(indexKey, 365 * 24 * 60 * 60, JSON.stringify(curr));
    }
  }

  async getAllTemplatesForTeam(teamId) {
    if (!redisClient?.isHealthy?.()) return [];
    const indexKey = `perfmap:${teamId}:index`;
    const indexRaw = await redisClient.get(indexKey);
    if (!indexRaw) return [];
    const fps = JSON.parse(indexRaw); // array fingerprints
    const results = [];
    for (const fp of fps) {
      const tplRaw = await redisClient.get(`perfmap:${teamId}:fp:${fp}`);
      if (tplRaw) results.push(JSON.parse(tplRaw));
    }
    return results;
  }

  jaccardSimilarity(aArr, bArr) {
    const a = new Set(aArr.map(x => this.normalizeHeader(x)));
    const b = new Set(bArr.map(x => this.normalizeHeader(x)));
    const inter = new Set([...a].filter(x => b.has(x))).size;
    const uni = new Set([...a, ...b]).size;
    return uni === 0 ? 0 : inter / uni;
  }

  async findBestFuzzyTemplate(teamId, headers, { threshold = 0.7 } = {}) {
    const templates = await this.getAllTemplatesForTeam(teamId);
    const inputNorm = headers.map(h => this.normalizeHeader(h));
    let best = null;
    let bestScore = 0;

    for (const t of templates) {
      const score = this.jaccardSimilarity(inputNorm, t.headersNormalized || []);
      if (score > bestScore) {
        best = t;
        bestScore = score;
      }
    }
    if (best && bestScore >= threshold) {
      return { template: best, score: bestScore };
    }
    return { template: null, score: 0 };
  }

  /**
   * 🚦 Auto mapping:
   * 1) exact template (fingerprint)
   * 2) fuzzy template (Jaccard)
   * 3) fallback pattern engine
   */
  async generateAutoMapping(csvHeaders, teamId) {
    // 1) exact
    const exact = await this.getTemplateByFingerprint(teamId, csvHeaders);
    if (exact) {
      return {
        mode: 'exact_template',
        detectedVendor: exact.meta?.vendor || null,
        suggestions: exact.mapping,
        confidence: { average: 100 },
        warnings: []
      };
    }

    // 2) fuzzy
    const fuzzy = await this.findBestFuzzyTemplate(teamId, csvHeaders, { threshold: 0.7 });
    if (fuzzy.template) {
      return {
        mode: 'fuzzy_template',
        detectedVendor: fuzzy.template.meta?.vendor || null,
        suggestions: fuzzy.template.mapping,
        confidence: { average: Math.round(fuzzy.score * 100) },
        warnings: [`Template riconosciuto con similarità ${Math.round(fuzzy.score * 100)}%`]
      };
    }

    // 3) fallback pattern engine
    const fallback = await this.generateSmartMapping(csvHeaders, teamId);
    return {
      mode: 'pattern_fallback',
      detectedVendor: null,
      suggestions: fallback.suggestions,
      confidence: { average: fallback.confidence?.average || 0 },
      warnings: fallback.warnings || []
    };
  }

  // =========================
  // PATTERN FALLBACK MAPPING
  // =========================
  async generateSmartMapping(csvHeaders, teamId) {
    try {
      console.log('🔵 [DEBUG] Generazione smart mapping per', csvHeaders.length, 'headers');
      const suggestions = {};
      const confidence = {};
      const warnings = [];

      for (const header of csvHeaders) {
        const suggestion = await this.analyzeHeader(header, teamId);
        if (suggestion.dbField) {
          suggestions[header] = suggestion;
          confidence[header] = suggestion.confidence;
          console.log(`🟢 [INFO] Mapping: "${header}" → ${suggestion.dbField} (${suggestion.confidence}%)`);
        } else {
          console.log(`🟡 [WARN] Header non riconosciuto: "${header}"`);
          warnings.push(`Header "${header}" non riconosciuto automaticamente`);
        }
      }

      // Required
      const requiredFields = ['playerId', 'session_date'];
      const mappedFields = Object.values(suggestions).map(s => s.dbField);
      for (const required of requiredFields) {
        if (!mappedFields.includes(required)) {
          console.log(`🟡 [WARN] Campo obbligatorio mancante: ${required}`);
          warnings.push(`Campo obbligatorio "${required}" non trovato negli headers`);
        }
      }

      const avgConfidence =
        Object.values(confidence).length > 0
          ? Math.round(Object.values(confidence).reduce((a, b) => a + b, 0) / Object.values(confidence).length)
          : 0;

      return {
        suggestions,
        confidence: {
          individual: confidence,
          average: avgConfidence,
          total: Object.keys(suggestions).length
        },
        warnings,
        statistics: {
          totalHeaders: csvHeaders.length,
          mappedHeaders: Object.keys(suggestions).length,
          unmappedHeaders: csvHeaders.length - Object.keys(suggestions).length,
          requiredFieldsMissing: requiredFields.filter(rf => !mappedFields.includes(rf))
        }
      };
    } catch (error) {
      console.log('🔴 Errore smart mapping:', error.message);
      throw new Error(`Errore generazione mapping: ${error.message}`);
    }
  }

  async analyzeHeader(header /*, teamId */) {
    const headerLower = header.toLowerCase().trim();
    // Session Type
    if (this.matchesPatterns(headerLower, this.sessionTypePatterns)) {
      return {
        dbField: 'session_type',
        transform: 'normalizeSessionType',
        required: false,
        confidence: 92,
        type: 'session_type',
        description: 'Tipo sessione (Allenamento/Partita)'
      };
    }

    // Session Name
    if (this.matchesPatterns(headerLower, this.sessionNamePatterns)) {
      return {
        dbField: 'session_name',
        transform: 'string',
        required: false,
        confidence: 85,
        type: 'session_name',
        description: 'Nome sessione (libero)'
      };
    }

    // Player
    if (this.matchesPatterns(headerLower, this.playerPatterns)) {
      return {
        dbField: 'playerId',
        transform: 'playerLookup',
        required: true,
        confidence: 90,
        type: 'player',
        description: 'Nome/ID giocatore (lookup)'
      };
    }

    // Date
    if (this.matchesPatterns(headerLower, this.datePatterns)) {
      return {
        dbField: 'session_date',
        transform: 'smartDateParser',
        required: true,
        confidence: 95,
        type: 'date',
        description: 'Data sessione'
      };
    }

    // Distance
    if (this.matchesPatterns(headerLower, this.distancePatterns)) {
      const unit = this.extractUnit(headerLower, ['km', 'kilometers', 'kilometres', 'm', 'meters', 'metres']);
      return {
        dbField: 'total_distance_m',
        transform: unit === 'km' ? 'kmToMeters' : 'parseFloat',
        required: false,
        confidence: 85,
        type: 'distance',
        description: `Distanza totale (${unit || 'unità?'} → metri)`
      };
    }

    // Speed
    if (this.matchesPatterns(headerLower, this.speedPatterns)) {
      const isMax = /max|maximum|top|peak|massima|picco/i.test(headerLower);
      const isAvg = /avg|average|mean|media/i.test(headerLower);
      if (isMax || (!isAvg && !isMax)) {
        return {
          dbField: 'top_speed_kmh',
          transform: 'parseFloat',
          required: false,
          confidence: 88,
          type: 'speed_max',
          description: 'Velocità massima (km/h)'
        };
      }
      return {
        dbField: 'avg_speed_kmh',
        transform: 'parseFloat',
        required: false,
        confidence: 88,
        type: 'speed_avg',
        description: 'Velocità media (km/h)'
      };
    }

    // Heart Rate
    if (this.matchesPatterns(headerLower, this.heartRatePatterns)) {
      const isMax = /max|maximum|massima/i.test(headerLower);
      const isAvg = /avg|average|mean|media/i.test(headerLower);
      if (isMax) {
        return {
          dbField: 'max_heart_rate',
          transform: 'parseInt',
          required: false,
          confidence: 82,
          type: 'hr_max',
          description: 'FC massima (bpm)'
        };
      }
      return {
        dbField: 'avg_heart_rate',
        transform: 'parseInt',
        required: false,
        confidence: 82,
        type: 'hr_avg',
        description: 'FC media (bpm)'
      };
    }

    // Duration
    if (this.matchesPatterns(headerLower, this.durationPatterns)) {
      return {
        dbField: 'duration_minutes',
        transform: 'durationToMinutes',
        required: false,
        confidence: 80,
        type: 'duration',
        description: 'Durata (minuti)'
      };
    }

    // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
    
    // Distanza Equivalente
    if (this.matchesPatterns(headerLower, this.equivalentDistancePatterns)) {
      const isPct = /pct|percentuale|%/.test(headerLower);
      return {
        dbField: isPct ? 'equivalent_distance_pct' : 'equivalent_distance_m',
        transform: 'parseFloat',
        required: false,
        confidence: 85,
        type: isPct ? 'equivalent_distance_pct' : 'equivalent_distance',
        description: isPct ? 'Percentuale distanza equivalente' : 'Distanza equivalente (metri)'
      };
    }

    // Distanza per Minuto
    if (this.matchesPatterns(headerLower, this.distancePerMinPatterns)) {
      return {
        dbField: 'distance_per_min',
        transform: 'parseFloat',
        required: false,
        confidence: 85,
        type: 'distance_per_min',
        description: 'Distanza per minuto (m/min)'
      };
    }

    // Zone di Velocità
    if (this.matchesPatterns(headerLower, this.distanceZonePatterns)) {
      if (/15[\s_]*20|15-20/.test(headerLower)) {
        return {
          dbField: 'distance_15_20_kmh_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'distance_zone_15_20',
          description: 'Distanza 15-20 km/h (metri)'
        };
      } else if (/20[\s_]*25|20-25/.test(headerLower)) {
        return {
          dbField: 'distance_20_25_kmh_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'distance_zone_20_25',
          description: 'Distanza 20-25 km/h (metri)'
        };
      } else if (/>[\s_]*25|over[\s_]*25/.test(headerLower)) {
        return {
          dbField: 'distance_over_25_kmh_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'distance_zone_over_25',
          description: 'Distanza > 25 km/h (metri)'
        };
      } else if (/>[\s_]*20|over[\s_]*20/.test(headerLower)) {
        return {
          dbField: 'distance_over_20_kmh_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'distance_zone_over_20',
          description: 'Distanza > 20 km/h (metri)'
        };
      } else if (/>[\s_]*15|over[\s_]*15/.test(headerLower)) {
        return {
          dbField: 'distance_over_15_kmh_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'distance_zone_over_15',
          description: 'Distanza > 15 km/h (metri)'
        };
      }
    }

    // ================= NUOVI CAMPI - POTENZA METABOLICA =================
    
    // Potenza Metabolica Media
    if (this.matchesPatterns(headerLower, this.metabolicPowerPatterns)) {
      return {
        dbField: 'avg_metabolic_power_wkg',
        transform: 'parseFloat',
        required: false,
        confidence: 85,
        type: 'metabolic_power_avg',
        description: 'Potenza metabolica media (W/kg)'
      };
    }

    // Zone di Potenza
    if (this.matchesPatterns(headerLower, this.powerZonePatterns)) {
      if (/>[\s_]*35|over[\s_]*35/.test(headerLower)) {
        return {
          dbField: 'distance_over_35wkg_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'power_zone_over_35',
          description: 'Distanza > 35 W/kg (metri)'
        };
      } else if (/>[\s_]*20|over[\s_]*20/.test(headerLower)) {
        return {
          dbField: 'distance_over_20wkg_m',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'power_zone_over_20',
          description: 'Distanza > 20 W/kg (metri)'
        };
      } else if (/5s|5[\s_]*secondi/.test(headerLower)) {
        return {
          dbField: 'max_power_5s_wkg',
          transform: 'parseFloat',
          required: false,
          confidence: 85,
          type: 'max_power_5s',
          description: 'Potenza massima 5s (W/kg)'
        };
      }
    }

    // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
    
    // Accelerazioni
    if (this.matchesPatterns(headerLower, this.accelerationPatterns)) {
      if (/>[\s_]*3|over[\s_]*3/.test(headerLower)) {
        if (/num|numero|count/.test(headerLower)) {
          return {
            dbField: 'num_acc_over_3_ms2',
            transform: 'parseInt',
            required: false,
            confidence: 85,
            type: 'acc_count_over_3',
            description: 'Numero accelerazioni > 3 m/s²'
          };
        } else {
          return {
            dbField: 'distance_acc_over_3_ms2_m',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'acc_distance_over_3',
            description: 'Distanza accelerazione > 3 m/s² (metri)'
          };
        }
      } else if (/>[\s_]*2|over[\s_]*2/.test(headerLower)) {
        if (/pct|percentuale|%/.test(headerLower)) {
          return {
            dbField: 'pct_distance_acc_over_2_ms2',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'acc_pct_over_2',
            description: '% Distanza accelerazione > 2 m/s²'
          };
        } else if (/min|minuto/.test(headerLower)) {
          return {
            dbField: 'acc_events_per_min_over_2_ms2',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'acc_events_per_min_over_2',
            description: 'Eventi accelerazione/min > 2 m/s²'
          };
        } else {
          return {
            dbField: 'distance_acc_over_2_ms2_m',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'acc_distance_over_2',
            description: 'Distanza accelerazione > 2 m/s² (metri)'
          };
        }
      }
    }

    // Decelerazioni
    if (this.matchesPatterns(headerLower, this.decelerationPatterns)) {
      if (/<[\s_]*-3|under[\s_]*-3/.test(headerLower)) {
        if (/num|numero|count/.test(headerLower)) {
          return {
            dbField: 'num_dec_over_minus3_ms2',
            transform: 'parseInt',
            required: false,
            confidence: 85,
            type: 'dec_count_under_minus3',
            description: 'Numero decelerazioni < -3 m/s²'
          };
        } else {
          return {
            dbField: 'distance_dec_over_minus3_ms2_m',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'dec_distance_under_minus3',
            description: 'Distanza decelerazione < -3 m/s² (metri)'
          };
        }
      } else if (/>[\s_]*-2|over[\s_]*-2/.test(headerLower)) {
        if (/pct|percentuale|%/.test(headerLower)) {
          return {
            dbField: 'pct_distance_dec_over_minus2_ms2',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'dec_pct_over_minus2',
            description: '% Distanza decelerazione > -2 m/s²'
          };
        } else if (/min|minuto/.test(headerLower)) {
          return {
            dbField: 'dec_events_per_min_over_minus2_ms2',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'dec_events_per_min_over_minus2',
            description: 'Eventi decelerazione/min > -2 m/s²'
          };
        } else {
          return {
            dbField: 'distance_dec_over_minus2_ms2_m',
            transform: 'parseFloat',
            required: false,
            confidence: 85,
            type: 'dec_distance_over_minus2',
            description: 'Distanza decelerazione > -2 m/s² (metri)'
          };
        }
      }
    }

    // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
    
    // Zone di Intensità
    if (this.matchesPatterns(headerLower, this.intensityZonePatterns)) {
      if (/<[\s_]*5|under[\s_]*5/.test(headerLower)) {
        return {
          dbField: 'time_under_5wkg_min',
          transform: 'parseInt',
          required: false,
          confidence: 85,
          type: 'time_under_5wkg',
          description: 'Tempo < 5 W/kg (minuti)'
        };
      } else if (/5[\s_]*10|5-10/.test(headerLower)) {
        return {
          dbField: 'time_5_10_wkg_min',
          transform: 'parseInt',
          required: false,
          confidence: 85,
          type: 'time_5_10_wkg',
          description: 'Tempo 5-10 W/kg (minuti)'
        };
      }
    }

    // ================= NUOVI CAMPI - INDICI E PROFILI =================
    
    // Indice RVP
    if (this.matchesPatterns(headerLower, this.rvpPatterns)) {
      return {
        dbField: 'rvp_index',
        transform: 'parseFloat',
        required: false,
        confidence: 85,
        type: 'rvp_index',
        description: 'Indice RVP'
      };
    }

    // Training Load
    if (this.matchesPatterns(headerLower, this.trainingLoadPatterns)) {
      return {
        dbField: 'training_load',
        transform: 'parseFloat',
        required: false,
        confidence: 85,
        type: 'training_load',
        description: 'Training Load'
      };
    }

    // ================= NUOVI CAMPI - INFORMAZIONI AGGIUNTIVE =================
    
    // Giorno Sessione
    if (this.matchesPatterns(headerLower, this.sessionDayPatterns)) {
      return {
        dbField: 'session_day',
        transform: 'string',
        required: false,
        confidence: 85,
        type: 'session_day',
        description: 'Giorno della settimana'
      };
    }

    // È Partita
    if (this.matchesPatterns(headerLower, this.matchPatterns)) {
      return {
        dbField: 'is_match',
        transform: 'boolean',
        required: false,
        confidence: 85,
        type: 'is_match',
        description: 'Flag partita (true/false)'
      };
    }

    // Nome Esercizio
    if (this.matchesPatterns(headerLower, this.drillPatterns)) {
      return {
        dbField: 'drill_name',
        transform: 'string',
        required: false,
        confidence: 85,
        type: 'drill_name',
        description: 'Nome esercizio/drill'
      };
    }

    // Unknown
    return {
      dbField: null,
      confidence: 0,
      type: 'unknown',
      description: 'Header non riconosciuto'
    };
  }

  matchesPatterns(header, patterns) {
    return patterns.some(p => p.test(header));
  }

  extractUnit(text, units) {
    for (const unit of units) if (text.includes(unit)) return unit;
    return null;
  }

  // =========================
  // TEMPLATE APIs (manuali)
  // =========================
  async saveTemplate(templateName, mapping, teamId) {
    try {
      console.log('🔵 [DEBUG] Salvataggio template mapping:', templateName);
      const template = {
        name: templateName,
        mapping,
        teamId,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      if (redisClient?.isHealthy?.()) {
        const cacheKey = `template:${teamId}:${templateName}`;
        await redisClient.setEx(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(template));
        console.log('🟢 [INFO] Template salvato in Redis cache');
      }

      return true;
    } catch (error) {
      console.log('🔴 Errore salvataggio template:', error.message);
      return false;
    }
  }

  async loadTemplates(teamId) {
    try {
      console.log('🔵 [DEBUG] Caricamento template per team:', teamId);
      // (Qui potresti listare chiavi Redis se mantieni un indice separato dei "template:*")
      const templates = [];
      console.log('🟢 [INFO] Template caricati:', templates.length);
      return templates;
    } catch (error) {
      console.log('🔴 Errore caricamento template:', error.message);
      return [];
    }
  }

  // =========================
  // APPLY MAPPING + NORMALIZATION
  // =========================
  async applyMapping(csvData, mapping, teamId) {
    try {
      console.log('🔵 [DEBUG] Applicazione mapping a', csvData.length, 'righe');

      const transformedData = [];
      const errors = [];
      const warnings = [];
      const playersNotFound = new Set();
      const datesInvalid = new Set();

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const transformedRow = {};
        const rowErrors = [];

        console.log('🔵 [DEBUG] Processing riga', i + 1, '/', csvData.length);

        transformedRow.extras = {};

        for (const [csvHeader, mappingConfig] of Object.entries(mapping)) {
          console.log('🔍 DEBUG MAPPING:', csvHeader, '→', JSON.stringify(mappingConfig, null, 2));
          if (!mappingConfig?.dbField) continue;

          const rawValue = row[csvHeader];

          // custom.*
          if (isCustomField(mappingConfig.dbField)) {
            const key = mappingConfig.dbField.replace('custom.', '');
            transformedRow.extras[key] = rawValue;
            console.log('🟢 [INFO] Custom field in extras:', key, '=', rawValue);
            continue;
          }

          try {
            const transformedValue = await this.transformValue(
              rawValue,
              mappingConfig.transform || 'passthrough',
              teamId,
              { rowIndex: i, csvHeader, dbField: mappingConfig.dbField }
            );

            if (transformedValue !== null && transformedValue !== undefined) {
              transformedRow[mappingConfig.dbField] = transformedValue;
            } else if (mappingConfig.required) {
              rowErrors.push(`Campo obbligatorio "${csvHeader}" vuoto o non valido`);
            }
          } catch (transformError) {
            console.log(`🟡 [WARN] Errore trasformazione riga ${i + 1}, campo "${csvHeader}":`, transformError.message);

            if (transformError.message.includes('Player not found')) {
              playersNotFound.add(rawValue);
            } else if (transformError.message.includes('Invalid date')) {
              datesInvalid.add(rawValue);
            }

            rowErrors.push(`${csvHeader}: ${transformError.message}`);
          }
        }

        if (Object.keys(transformedRow.extras).length === 0) delete transformedRow.extras;

        // Metadati obbligatori
        transformedRow.teamId = teamId;
        transformedRow.createdById = null;
        transformedRow.created_at = new Date();
        transformedRow.updated_at = new Date();

        const hasPlayerId = Number.isInteger(transformedRow.playerId);
        const hasSessionDate = transformedRow.session_date instanceof Date;

        if (rowErrors.length === 0 && hasPlayerId && hasSessionDate) {
          // Rete di sicurezza cast tipi
          const normalized = this.normalizeRowForDB(transformedRow);

          // 🔧 NUOVO: derivazioni robuste per colmare campi mancanti
          try {
            // Adattiamo l'input per il deriver
            const inputForDeriver = {
              Player: `${normalized.playerId}`,
              Position: normalized.position,
              Day: normalized.session_date,
              Match: normalized.session_type,
              T: normalized.duration_minutes,
              'Distanza (m)': normalized.total_distance_m,
              'Dist/min': normalized.distance_per_min,
              'Pot. met. media': normalized.avg_metabolic_power_wkg,
              'D > 20 W/Kg': normalized.distance_over_20wkg_m,
              'D>35 W': normalized.distance_over_35wkg_m,
              'D 15-20 km/h': normalized.distance_15_20_kmh_m,
              'D 20-25 km/h': normalized.distance_20_25_kmh_m,
              'D > 25 km/h': normalized.distance_over_25_kmh_m,
              'D > 15 Km/h': normalized.distance_over_15_kmh_m,
              'Num Acc > 3 m/s2': normalized.num_acc_over_3_ms2,
              'Num Dec <-3 m/s2': normalized.num_dec_over_minus3_ms2,
              'Training Load': normalized.training_load,
            };
            const { row: derived } = completeRow(inputForDeriver);

            // Merge back su normalized
            const kmh = (derived['Dist/min'] && normalized.duration_minutes)
              ? (normalized.total_distance_m * 60) / (1000 * normalized.duration_minutes)
              : undefined;

            normalized.distance_per_min = Number.isFinite(derived['Dist/min']) ? derived['Dist/min'] : normalized.distance_per_min;
            normalized.avg_speed_kmh = Number.isFinite(kmh) ? Number(kmh.toFixed(2)) : (normalized.avg_speed_kmh || 0);
            normalized.training_load = Number.isFinite(derived['Training Load']) ? derived['Training Load'] : (normalized.training_load || normalized.player_load || 0);
            normalized.distance_over_15_kmh_m = derived['D > 15 Km/h'] ?? normalized.distance_over_15_kmh_m;
            normalized.distance_15_20_kmh_m = derived['D 15-20 km/h'] ?? normalized.distance_15_20_kmh_m;
            normalized.distance_20_25_kmh_m = derived['D 20-25 km/h'] ?? normalized.distance_20_25_kmh_m;
            normalized.distance_over_25_kmh_m = derived['D > 25 km/h'] ?? normalized.distance_over_25_kmh_m;

          } catch (e) {
            console.log('🟡 [WARN] Derivazione GPS non applicata alla riga', i + 1, '-', e.message);
          }

          transformedData.push(normalized);
          console.log('🟢 [INFO] Riga', i + 1, 'trasformata con successo');
        } else {
          if (!hasPlayerId) rowErrors.push('Player ID mancante o non valido');
          if (!hasSessionDate) rowErrors.push('Data sessione mancante o non valida');

          errors.push({ rowIndex: i + 1, rawRow: row, errors: rowErrors });
          console.log('🔴 Riga', i + 1, 'fallita:', rowErrors.join(', '));
        }
      }

      if (playersNotFound.size > 0) {
        warnings.push(
          `${playersNotFound.size} nomi giocatori non riconosciuti: ${Array.from(playersNotFound)
            .slice(0, 3)
            .join(', ')}${playersNotFound.size > 3 ? '...' : ''}`
        );
      }
      if (datesInvalid.size > 0) {
        warnings.push(`${datesInvalid.size} date non valide rilevate. Verifica formato date nel CSV`);
      }

      const totalRows = csvData.length;
      const successRows = transformedData.length;
      const errorRows = errors.length;
      const successRate = totalRows > 0 ? Math.round((successRows / totalRows) * 100) : 0;

      console.log('🟢 [INFO] Mapping applicato:', {
        total: totalRows,
        success: successRows,
        errors: errorRows,
        rate: successRate + '%'
      });

      return {
        success: true,
        data: transformedData,
        errors,
        warnings,
        stats: {
          totalRows,
          successRows,
          errorRows,
          successRate,
          playersNotFound: playersNotFound.size,
          datesInvalid: datesInvalid.size
        }
      };
    } catch (error) {
      console.log('🔴 Errore applicazione mapping:', error.message);
      return {
        success: false,
        data: [],
        errors: [{ general: error.message }],
        warnings: [],
        stats: {
          totalRows: csvData.length,
          successRows: 0,
          errorRows: csvData.length,
          successRate: 0
        }
      };
    }
  }

  // =========================
  // TRANSFORMATIONS
  // =========================
  async transformValue(value, transformType, teamId, context = {}) {
    if (value === null || value === undefined || value === '') return null;

    const stringValue = String(value).trim();
    console.log('🔵 [DEBUG] Transform:', transformType, 'value:', stringValue);

    try {
      switch (transformType) {
        case 'playerLookup':
          return await this.resolvePlayer(stringValue, teamId);

        case 'passthrough':
          // Pass-through intelligente: risolve player, date e cast numerici
          if (context.dbField === 'playerId') {
            return await this.resolvePlayer(stringValue, teamId);
          } else if (context.dbField === 'session_date') {
            return this.parseSmartDate(stringValue);
          } else if (context.dbField === 'session_type') {
            return this.normalizeSessionType(stringValue);
          } else if (this.isNumericField(context.dbField)) {
            return this.convertToAppropriateType(stringValue, context.dbField);
          } else {
            return stringValue;
          }

        case 'smartDateParser':
          return this.parseSmartDate(stringValue);

        case 'normalizeSessionType':
          return this.normalizeSessionType(stringValue);

        case 'kmToMeters': {
          const kmValue = this.parseFloatValue(stringValue);
          return kmValue * 1000;
        }

        case 'parseFloat':
          return this.parseFloatValue(stringValue);

        case 'parseInt':
          return this.parseIntValue(stringValue);

        case 'durationToMinutes':
          return this.parseDurationToMinutes(stringValue);

        default:
          console.log(`🟡 [WARN] Trasformazione sconosciuta: ${transformType}`);
          return stringValue;
      }
    } catch (error) {
      console.log('🔴 Transform error:', error.message);
      throw error;
    }
  }

  // =========================
  // FIELD TYPE HELPERS
  // =========================
  isNumericField(dbField) {
    const intFields = [
      'duration_minutes',
      'total_distance_m',
      'sprint_distance_m',
      'max_heart_rate',
      'avg_heart_rate',
      'high_intensity_runs'
    ];
    const floatFields = ['top_speed_kmh', 'avg_speed_kmh', 'player_load'];
    return intFields.includes(dbField) || floatFields.includes(dbField);
  }

  convertToAppropriateType(value, dbField) {
    const intFields = [
      'duration_minutes',
      'total_distance_m',
      'sprint_distance_m',
      'max_heart_rate',
      'avg_heart_rate',
      'high_intensity_runs'
    ];
    const floatFields = ['top_speed_kmh', 'avg_speed_kmh', 'player_load'];

    if (intFields.includes(dbField)) return this.parseIntValue(value);
    if (floatFields.includes(dbField)) return this.parseFloatValue(value);
    return value;
  }

  normalizeSessionType(input) {
    const v = String(input).trim().toLowerCase();
    if (['allenamento', 'training', 'workout', 'practice'].includes(v)) return 'Allenamento';
    if (['partita', 'match', 'game'].includes(v)) return 'Partita';
    // Capitalize fallback
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  normalizeRowForDB(row) {
    const out = { ...row };

    const intFields = [
      'duration_minutes',
      'total_distance_m',
      'sprint_distance_m',
      'max_heart_rate',
      'avg_heart_rate',
      'high_intensity_runs'
    ];
    const floatFields = ['top_speed_kmh', 'avg_speed_kmh', 'player_load'];

    for (const f of intFields) {
      if (out[f] !== undefined && out[f] !== null && out[f] !== '') {
        out[f] = this.parseIntValue(String(out[f]));
      }
    }
    for (const f of floatFields) {
      if (out[f] !== undefined && out[f] !== null && out[f] !== '') {
        out[f] = this.parseFloatValue(String(out[f]));
      }
    }

    if (out.session_date && !(out.session_date instanceof Date)) {
      out.session_date = this.parseSmartDate(String(out.session_date));
    }

    return out;
  }

  async autoLearnTemplateIfGood(teamId, csvHeaders, mapping, importStats, meta = {}) {
    if (importStats.successRate >= 80) {
      const saved = await this.saveTemplateForFingerprint(teamId, csvHeaders, mapping, meta);
      await this.indexTemplateFingerprint(teamId, csvHeaders);
      console.log('🟢 [INFO] Template auto-salvato:', saved.fingerprint);
      return true;
    }
    console.log('🟡 [WARN] Import non sufficientemente pulito per auto-salvataggio');
    return false;
  }

  // =========================
  // DB LOOKUPS & PARSERS
  // =========================
  async resolvePlayer(playerString, teamId) {
    try {
      console.log('🔵 [DEBUG] Player lookup:', playerString, 'team:', teamId);

      const tokens = playerString.split(/\s+/).filter(Boolean);
      const first = tokens[0] || '';
      const last = tokens.slice(1).join(' ') || '';

      const players = await this.prisma.player.findMany({
        where: {
          teamId,
          isActive: true,
          OR: [
            {
              AND: [
                { firstName: { contains: first, mode: 'insensitive' } },
                { lastName: { contains: last, mode: 'insensitive' } }
              ]
            },
            { firstName: { equals: playerString, mode: 'insensitive' } },
            { lastName: { equals: playerString, mode: 'insensitive' } }
          ]
        },
        select: { id: true, firstName: true, lastName: true, shirtNumber: true }
      });

      console.log('QUERY RESULT - Players found:', players.length);
      players.forEach(p => console.log(`- Player: ${p.firstName} ${p.lastName} (ID: ${p.id})`));

      // Fallback numero maglia
      const shirtNumber = parseInt(playerString.replace(/[^\d]/g, ''), 10);
      if (!isNaN(shirtNumber) && players.length === 0) {
        const playerByShirt = await this.prisma.player.findFirst({
          where: { teamId, shirtNumber, isActive: true },
          select: { id: true, firstName: true, lastName: true, shirtNumber: true }
        });
        if (playerByShirt) {
          console.log('🟢 [INFO] Player found by shirt number:', playerByShirt.shirtNumber);
          return playerByShirt.id;
        }
      }

      if (players.length === 1) {
        console.log('🟢 [INFO] Player found:', players[0].firstName, players[0].lastName);
        return players[0].id;
      } else if (players.length > 1) {
        const fullNameMatch = players.find(
          p =>
            playerString.toLowerCase().includes(p.firstName.toLowerCase()) &&
            playerString.toLowerCase().includes(p.lastName.toLowerCase())
        );
        if (fullNameMatch) {
          console.log('🟢 [INFO] Best match found:', fullNameMatch.firstName, fullNameMatch.lastName);
          return fullNameMatch.id;
        }
        console.log('🟡 [WARN] Multiple players found, taking first:', players[0].firstName, players[0].lastName);
        return players[0].id;
      }

      throw new Error(`Player not found: "${playerString}"`);
    } catch (error) {
      console.log('🔴 Player lookup error:', error.message);
      throw new Error(`Player lookup failed: ${error.message}`);
    }
  }

  parseSmartDate(dateString) {
    console.log('🔵 [DEBUG] Smart date parse:', dateString);

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(`${dateString}T00:00:00.000Z`);
      if (!isNaN(date.getTime())) {
        console.log('🟢 [INFO] ISO date parsed:', date);
        return date;
      }
    }

    // DD/MM/YYYY o DD-MM-YYYY
    const italianMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (italianMatch) {
      const [, day, month, year] = italianMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
        console.log('🟢 [INFO] Italian date parsed:', date);
        return date;
      }
    }

    // MM/DD/YYYY o MM-DD-YYYY
    const americanMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (americanMatch) {
      const [, month, day, year] = americanMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
        console.log('🟢 [INFO] American date parsed:', date);
        return date;
      }
    }

    // Timestamp (sec/ms)
    const timestamp = parseInt(dateString, 10);
    if (!isNaN(timestamp) && timestamp > 1000000000) {
      const date = new Date(timestamp * (timestamp < 1000000000000 ? 1000 : 1));
      if (!isNaN(date.getTime())) {
        console.log('🟢 [INFO] Timestamp parsed:', date);
        return date;
      }
    }

    // Fallback nativo
    const nativeDate = new Date(dateString);
    if (!isNaN(nativeDate.getTime())) {
      console.log('🟢 [INFO] Native date parsed:', nativeDate);
      return nativeDate;
    }

    throw new Error(`Invalid date format: "${dateString}"`);
  }

  parseFloatValue(value) {
    const normalizedValue = String(value).replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    if (isNaN(parsed)) throw new Error(`Invalid float value: "${value}"`);
    if (parsed < 0 || parsed > 100000) console.log('🟡 [WARN] Unusual float value:', parsed);
    return parsed;
  }

  parseIntValue(value) {
    const parsed = parseInt(String(value), 10);
    if (isNaN(parsed)) throw new Error(`Invalid integer value: "${value}"`);
    if (parsed < 0 || parsed > 1000000) console.log('🟡 [WARN] Unusual integer value:', parsed);
    return parsed;
  }

  parseDurationToMinutes(durationString) {
    console.log('🔵 [DEBUG] Duration parse:', durationString);

    // solo cifre (minuti)
    if (/^\d+$/.test(durationString)) return parseInt(durationString, 10);

    // HH:MM:SS
    const hhmmssMatch = durationString.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hhmmssMatch) {
      const [, hours, minutes, seconds] = hhmmssMatch.map(Number);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      console.log('🟢 [INFO] HH:MM:SS → minuti:', totalMinutes);
      return Math.round(totalMinutes * 100) / 100;
    }

    // HH:MM
    const hhmmMatch = durationString.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const [, hours, minutes] = hhmmMatch.map(Number);
      const totalMinutes = hours * 60 + minutes;
      console.log('🟢 [INFO] HH:MM → minuti:', totalMinutes);
      return totalMinutes;
    }

    // "1h 30m" / "1h" / "90m"
    const textMatch = durationString.match(/(\d+)h\s*(\d+)?m?/i);
    if (textMatch) {
      const hours = parseInt(textMatch[1], 10);
      const minutes = parseInt(textMatch[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      console.log('🟢 [INFO] Testo → minuti:', totalMinutes);
      return totalMinutes;
    }

    const minutesMatch = durationString.match(/(\d+)m/i);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1], 10);
      console.log('🟢 [INFO] Minuti soli:', minutes);
      return minutes;
    }

    throw new Error(`Invalid duration format: "${durationString}"`);
  }
}

// Export singleton
const smartColumnMapper = new SmartColumnMapper();
console.log('🟢 [INFO] Smart Column Mapper inizializzato e pronto');

module.exports = smartColumnMapper;
