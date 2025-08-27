// server/src/utils/columnMapper.js
// 🤖 Smart Column Mapping Engine per Performance Import - SoccerXpro V2 (FULL AUTO)

const crypto = require('crypto');
const { getPrismaClient } = require('../config/database');
const redisClient = require('../config/redis');

console.log('🟢 Inizializzazione Smart Column Mapper (full auto)…');

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
    console.log('🔵 Inizializzazione pattern riconoscimento…');

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

    console.log('🟢 Pattern riconoscimento inizializzati');
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
      console.log('🔵 Generazione smart mapping per', csvHeaders.length, 'headers');
      const suggestions = {};
      const confidence = {};
      const warnings = [];

      for (const header of csvHeaders) {
        const suggestion = await this.analyzeHeader(header, teamId);
        if (suggestion.dbField) {
          suggestions[header] = suggestion;
          confidence[header] = suggestion.confidence;
          console.log(`🟢 Mapping: "${header}" → ${suggestion.dbField} (${suggestion.confidence}%)`);
        } else {
          console.log(`🟡 Header non riconosciuto: "${header}"`);
          warnings.push(`Header "${header}" non riconosciuto automaticamente`);
        }
      }

      // Required
      const requiredFields = ['playerId', 'session_date'];
      const mappedFields = Object.values(suggestions).map(s => s.dbField);
      for (const required of requiredFields) {
        if (!mappedFields.includes(required)) {
          console.log(`🟡 Campo obbligatorio mancante: ${required}`);
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
      console.log('🔵 Salvataggio template mapping:', templateName);
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
        console.log('🟢 Template salvato in Redis cache');
      }

      return true;
    } catch (error) {
      console.log('🔴 Errore salvataggio template:', error.message);
      return false;
    }
  }

  async loadTemplates(teamId) {
    try {
      console.log('🔵 Caricamento template per team:', teamId);
      // (Qui potresti listare chiavi Redis se mantieni un indice separato dei "template:*")
      const templates = [];
      console.log('🟢 Template caricati:', templates.length);
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
      console.log('🔵 Applicazione mapping a', csvData.length, 'righe');

      const transformedData = [];
      const errors = [];
      const warnings = [];
      const playersNotFound = new Set();
      const datesInvalid = new Set();

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const transformedRow = {};
        const rowErrors = [];

        console.log('🔵 Processing riga', i + 1, '/', csvData.length);

        transformedRow.extras = {};

        for (const [csvHeader, mappingConfig] of Object.entries(mapping)) {
          console.log('🔍 DEBUG MAPPING:', csvHeader, '→', JSON.stringify(mappingConfig, null, 2));
          if (!mappingConfig?.dbField) continue;

          const rawValue = row[csvHeader];

          // custom.*
          if (isCustomField(mappingConfig.dbField)) {
            const key = mappingConfig.dbField.replace('custom.', '');
            transformedRow.extras[key] = rawValue;
            console.log('🟢 Custom field in extras:', key, '=', rawValue);
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
            console.log(`🟡 Errore trasformazione riga ${i + 1}, campo "${csvHeader}":`, transformError.message);

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
          transformedData.push(normalized);
          console.log('🟢 Riga', i + 1, 'trasformata con successo');
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

      console.log('🟢 Mapping applicato:', {
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
    console.log('🔵 Transform:', transformType, 'value:', stringValue);

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
          } else if (this.isNumericField(context.dbField)) {
            return this.convertToAppropriateType(stringValue, context.dbField);
          } else {
            return stringValue;
          }

        case 'smartDateParser':
          return this.parseSmartDate(stringValue);

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
          console.log(`🟡 Trasformazione sconosciuta: ${transformType}`);
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
      console.log('🟢 Template auto-salvato:', saved.fingerprint);
      return true;
    }
    console.log('🟡 Import non sufficientemente pulito per auto-salvataggio');
    return false;
  }

  // =========================
  // DB LOOKUPS & PARSERS
  // =========================
  async resolvePlayer(playerString, teamId) {
    try {
      console.log('🔵 Player lookup:', playerString, 'team:', teamId);

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
          console.log('🟢 Player found by shirt number:', playerByShirt.shirtNumber);
          return playerByShirt.id;
        }
      }

      if (players.length === 1) {
        console.log('🟢 Player found:', players[0].firstName, players[0].lastName);
        return players[0].id;
      } else if (players.length > 1) {
        const fullNameMatch = players.find(
          p =>
            playerString.toLowerCase().includes(p.firstName.toLowerCase()) &&
            playerString.toLowerCase().includes(p.lastName.toLowerCase())
        );
        if (fullNameMatch) {
          console.log('🟢 Best match found:', fullNameMatch.firstName, fullNameMatch.lastName);
          return fullNameMatch.id;
        }
        console.log('🟡 Multiple players found, taking first:', players[0].firstName, players[0].lastName);
        return players[0].id;
      }

      throw new Error(`Player not found: "${playerString}"`);
    } catch (error) {
      console.log('🔴 Player lookup error:', error.message);
      throw new Error(`Player lookup failed: ${error.message}`);
    }
  }

  parseSmartDate(dateString) {
    console.log('🔵 Smart date parse:', dateString);

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(`${dateString}T00:00:00.000Z`);
      if (!isNaN(date.getTime())) {
        console.log('🟢 ISO date parsed:', date);
        return date;
      }
    }

    // DD/MM/YYYY o DD-MM-YYYY
    const italianMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (italianMatch) {
      const [, day, month, year] = italianMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
        console.log('🟢 Italian date parsed:', date);
        return date;
      }
    }

    // MM/DD/YYYY o MM-DD-YYYY
    const americanMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (americanMatch) {
      const [, month, day, year] = americanMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
        console.log('🟢 American date parsed:', date);
        return date;
      }
    }

    // Timestamp (sec/ms)
    const timestamp = parseInt(dateString, 10);
    if (!isNaN(timestamp) && timestamp > 1000000000) {
      const date = new Date(timestamp * (timestamp < 1000000000000 ? 1000 : 1));
      if (!isNaN(date.getTime())) {
        console.log('🟢 Timestamp parsed:', date);
        return date;
      }
    }

    // Fallback nativo
    const nativeDate = new Date(dateString);
    if (!isNaN(nativeDate.getTime())) {
      console.log('🟢 Native date parsed:', nativeDate);
      return nativeDate;
    }

    throw new Error(`Invalid date format: "${dateString}"`);
  }

  parseFloatValue(value) {
    const normalizedValue = String(value).replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    if (isNaN(parsed)) throw new Error(`Invalid float value: "${value}"`);
    if (parsed < 0 || parsed > 100000) console.log('🟡 Unusual float value:', parsed);
    return parsed;
  }

  parseIntValue(value) {
    const parsed = parseInt(String(value), 10);
    if (isNaN(parsed)) throw new Error(`Invalid integer value: "${value}"`);
    if (parsed < 0 || parsed > 1000000) console.log('🟡 Unusual integer value:', parsed);
    return parsed;
  }

  parseDurationToMinutes(durationString) {
    console.log('🔵 Duration parse:', durationString);

    // solo cifre (minuti)
    if (/^\d+$/.test(durationString)) return parseInt(durationString, 10);

    // HH:MM:SS
    const hhmmssMatch = durationString.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hhmmssMatch) {
      const [, hours, minutes, seconds] = hhmmssMatch.map(Number);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      console.log('🟢 HH:MM:SS → minuti:', totalMinutes);
      return Math.round(totalMinutes * 100) / 100;
    }

    // HH:MM
    const hhmmMatch = durationString.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const [, hours, minutes] = hhmmMatch.map(Number);
      const totalMinutes = hours * 60 + minutes;
      console.log('🟢 HH:MM → minuti:', totalMinutes);
      return totalMinutes;
    }

    // "1h 30m" / "1h" / "90m"
    const textMatch = durationString.match(/(\d+)h\s*(\d+)?m?/i);
    if (textMatch) {
      const hours = parseInt(textMatch[1], 10);
      const minutes = parseInt(textMatch[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      console.log('🟢 Testo → minuti:', totalMinutes);
      return totalMinutes;
    }

    const minutesMatch = durationString.match(/(\d+)m/i);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1], 10);
      console.log('🟢 Minuti soli:', minutes);
      return minutes;
    }

    throw new Error(`Invalid duration format: "${durationString}"`);
  }
}

// Export singleton
const smartColumnMapper = new SmartColumnMapper();
console.log('🟢 Smart Column Mapper inizializzato e pronto');

module.exports = smartColumnMapper;
