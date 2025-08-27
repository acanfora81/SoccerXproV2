// server/src/utils/dateParser.js
// 📅 Smart Date Parser per Performance Import - SoccerXpro V2

console.log('🟢 Inizializzazione Smart Date Parser...'); // INFO - rimuovere in produzione

/**
 * 🧠 SMART DATE PARSER CLASS
 * Auto-detect e parse date da qualsiasi formato CSV internazionale
 */
class SmartDateParser {
  
  constructor() {
    this.initializeDatePatterns();
    this.parseCache = new Map(); // Cache per performance
  }

  /**
   * 🎯 Inizializza pattern riconoscimento date
   */
  initializeDatePatterns() {
    console.log('🔵 Inizializzazione pattern date...'); // INFO DEV - rimuovere in produzione

    // 📅 DATE PATTERNS - Ordinati per specificità
    this.datePatterns = [
      // ISO Format con timestamp
      {
        name: 'iso_datetime',
        pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\.(\d{3}))?(?:Z|[+-]\d{2}:?\d{2})?$/,
        confidence: 95,
        parse: (match) => ({
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          day: parseInt(match[3], 10),
          hour: parseInt(match[4], 10),
          minute: parseInt(match[5], 10),
          second: parseInt(match[6] || '0', 10),
          format: 'YYYY-MM-DD HH:mm:ss'
        })
      },

      // ISO Format solo data
      {
        name: 'iso_date',
        pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        confidence: 95,
        parse: (match) => ({
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          day: parseInt(match[3], 10),
          format: 'YYYY-MM-DD'
        })
      },

      // European DD/MM/YYYY con timestamp
      {
        name: 'european_datetime',
        pattern: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
        confidence: 90,
        parse: (match) => ({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          hour: parseInt(match[4], 10),
          minute: parseInt(match[5], 10),
          second: parseInt(match[6] || '0', 10),
          format: 'DD/MM/YYYY HH:mm:ss'
        })
      },

      // European DD/MM/YYYY
      {
        name: 'european_date',
        pattern: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
        confidence: 85,
        parse: (match) => ({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          format: 'DD/MM/YYYY'
        })
      },

      // US MM/DD/YYYY con timestamp  
      {
        name: 'us_datetime',
        pattern: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
        confidence: 75, // Più bassa perché ambiguo con European
        parse: (match) => ({
          month: parseInt(match[1], 10),
          day: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          hour: parseInt(match[4], 10),
          minute: parseInt(match[5], 10),
          second: parseInt(match[6] || '0', 10),
          format: 'MM/DD/YYYY HH:mm:ss',
          ambiguous: true
        })
      },

      // US MM/DD/YYYY
      {
        name: 'us_date',
        pattern: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
        confidence: 70, // Ambiguo con European
        parse: (match) => ({
          month: parseInt(match[1], 10),
          day: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          format: 'MM/DD/YYYY',
          ambiguous: true
        })
      },

      // Short year formats DD/MM/YY
      {
        name: 'european_short',
        pattern: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/,
        confidence: 70,
        parse: (match) => ({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: this.expandShortYear(parseInt(match[3], 10)),
          format: 'DD/MM/YY'
        })
      },

      // Time only HH:mm:ss (assume today)
      {
        name: 'time_only',
        pattern: /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
        confidence: 60,
        parse: (match) => {
          const today = new Date();
          return {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate(),
            hour: parseInt(match[1], 10),
            minute: parseInt(match[2], 10),
            second: parseInt(match[3] || '0', 10),
            format: 'HH:mm:ss (today)'
          };
        }
      },

      // Timestamp Unix (seconds)
      {
        name: 'unix_timestamp',
        pattern: /^(\d{10})$/,
        confidence: 90,
        parse: (match) => {
          const date = new Date(parseInt(match[1], 10) * 1000);
          return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            format: 'Unix timestamp (seconds)'
          };
        }
      },

      // Timestamp Unix (milliseconds)
      {
        name: 'unix_timestamp_ms',
        pattern: /^(\d{13})$/,
        confidence: 90,
        parse: (match) => {
          const date = new Date(parseInt(match[1], 10));
          return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            format: 'Unix timestamp (ms)'
          };
        }
      },

      // Excel serial date (giorni dal 1900-01-01)
      {
        name: 'excel_serial',
        pattern: /^(\d{5})(?:\.(\d+))?$/,
        confidence: 60,
        parse: (match) => {
          // Excel considera 1900-01-01 come giorno 1 (erroneamente)
          // ma ha un bug: considera 1900 bisestile quando non lo è
          const serialDate = parseFloat(match[0]);
          const excelEpoch = new Date(1900, 0, 1);
          const date = new Date(excelEpoch.getTime() + (serialDate - 2) * 24 * 60 * 60 * 1000);
          
          return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            format: 'Excel serial date'
          };
        }
      }
    ];

    // 📊 Mesi per parsing testuale
    this.monthNames = {
      it: {
        full: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
              'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
        abbr: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 
               'lug', 'ago', 'set', 'ott', 'nov', 'dic']
      },
      en: {
        full: ['january', 'february', 'march', 'april', 'may', 'june',
               'july', 'august', 'september', 'october', 'november', 'december'],
        abbr: ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
               'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      }
    };

    console.log('🟢 Pattern date inizializzati:', this.datePatterns.length, 'formati supportati'); // INFO - rimuovere in produzione
  }

  /**
   * 🎯 MAIN METHOD: Parse intelligente data da qualsiasi formato
   * @param {String} dateString - Stringa data da CSV
   * @param {Object} options - Opzioni parsing (locale, ambiguity handling)
   * @returns {Object} - Result con Date object e metadata
   */
  parseSmartDate(dateString, options = {}) {
    try {
      if (!dateString) {
        throw new Error('Data string richiesta');
      }

      const normalizedInput = String(dateString).trim();
      
      console.log('🔵 Smart date parsing per:', normalizedInput); // INFO DEV - rimuovere in produzione

      // 🚀 Check cache first
      const cacheKey = `${normalizedInput}:${JSON.stringify(options)}`;
      if (this.parseCache.has(cacheKey)) {
        const cached = this.parseCache.get(cacheKey);
        console.log('🟢 Date trovata in cache:', cached.originalString); // INFO - rimuovere in produzione
        return cached;
      }

      // 🔍 Try patterns in order of confidence
      const attemptResults = [];

      for (const patternConfig of this.datePatterns) {
        const match = normalizedInput.match(patternConfig.pattern);
        
        if (match) {
          try {
            const parsed = patternConfig.parse(match);
            const dateResult = this.buildDateResult(parsed, patternConfig, normalizedInput, options);
            
            if (dateResult.success) {
              attemptResults.push(dateResult);
              console.log(`🟢 Pattern match: ${patternConfig.name} (${patternConfig.confidence}%)`); // INFO - rimuovere in produzione
            }
            
          } catch (parseError) {
            console.log(`🟡 Pattern ${patternConfig.name} fallito:`, parseError.message); // WARNING - rimuovere in produzione
            continue;
          }
        }
      }

      // 🎯 Handle results
      if (attemptResults.length === 0) {
        console.log('🔴 Nessun pattern riconosciuto per:', normalizedInput); // ERROR - mantenere essenziali
        return this.createFailureResult(normalizedInput, 'NO_PATTERN_MATCH');
      }

      // Se una sola interpretazione, return it
      if (attemptResults.length === 1) {
        const result = attemptResults[0];
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Multiple interpretations - handle ambiguity
      return this.handleAmbiguousDate(attemptResults, normalizedInput, options);

    } catch (error) {
      console.log('🔴 Errore smart date parsing:', error.message); // ERROR - mantenere essenziali
      return this.createFailureResult(dateString, 'PARSE_ERROR', error.message);
    }
  }

  /**
   * 🏗️ Costruisce risultato date da parsed components
   * @param {Object} parsed - Componenti parsed (year, month, day, etc.)
   * @param {Object} patternConfig - Config pattern usato
   * @param {String} originalString - Stringa originale
   * @param {Object} options - Opzioni parsing
   * @returns {Object} - Date result con validazione
   */
  buildDateResult(parsed, patternConfig, originalString, options) {
    // 🔍 Validate date components
    const validation = this.validateDateComponents(parsed);
    if (!validation.valid) {
      throw new Error(`Componenti data non validi: ${validation.errors.join(', ')}`);
    }

    // 🗓️ Construct Date object
    let jsDate;
    
    if (parsed.hour !== undefined) {
      // Con timestamp
      jsDate = new Date(
        parsed.year,
        parsed.month - 1, // JS months are 0-based
        parsed.day,
        parsed.hour,
        parsed.minute || 0,
        parsed.second || 0
      );
    } else {
      // Solo data (noon per evitare timezone issues)
      jsDate = new Date(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0);
    }

    // 🔍 Final validation
    if (isNaN(jsDate.getTime())) {
      throw new Error('Data JavaScript non valida generata');
    }

    // 📊 Build result
    const result = {
      success: true,
      date: jsDate,
      originalString,
      components: parsed,
      metadata: {
        pattern: patternConfig.name,
        format: parsed.format,
        confidence: patternConfig.confidence,
        hasTime: parsed.hour !== undefined,
        ambiguous: parsed.ambiguous || false,
        timezone: jsDate.getTimezoneOffset() / -60 // Hours offset
      },
      iso: jsDate.toISOString(),
      formatted: {
        italian: this.formatItalian(jsDate, parsed.hour !== undefined),
        iso: jsDate.toISOString().split('T')[0], // YYYY-MM-DD
        display: this.formatDisplay(jsDate, parsed.hour !== undefined)
      }
    };

    console.log('🟢 Data costruita con successo:', result.formatted.display); // INFO - rimuovere in produzione

    return result;
  }

  /**
   * ✅ Valida componenti data per realismo
   * @param {Object} components - Componenti parsed
   * @returns {Object} - Validation result
   */
  validateDateComponents(components) {
    const errors = [];

    // Year validation
    const currentYear = new Date().getFullYear();
    if (components.year < 1900 || components.year > currentYear + 5) {
      errors.push(`Anno non realistico: ${components.year} (range: 1900-${currentYear + 5})`);
    }

    // Month validation
    if (components.month < 1 || components.month > 12) {
      errors.push(`Mese non valido: ${components.month} (range: 1-12)`);
    }

    // Day validation (basic)
    if (components.day < 1 || components.day > 31) {
      errors.push(`Giorno non valido: ${components.day} (range: 1-31)`);
    }

    // More precise day validation per month
    if (errors.length === 0) {
      const daysInMonth = this.getDaysInMonth(components.month, components.year);
      if (components.day > daysInMonth) {
        errors.push(`Giorno ${components.day} non esiste nel mese ${components.month}/${components.year}`);
      }
    }

    // Time validation (if present)
    if (components.hour !== undefined) {
      if (components.hour < 0 || components.hour > 23) {
        errors.push(`Ora non valida: ${components.hour} (range: 0-23)`);
      }
      if (components.minute < 0 || components.minute > 59) {
        errors.push(`Minuti non validi: ${components.minute} (range: 0-59)`);
      }
      if (components.second < 0 || components.second > 59) {
        errors.push(`Secondi non validi: ${components.second} (range: 0-59)`);
      }
    }

    // Context validation (training dates should be recent-ish)
    const diffYears = currentYear - components.year;
    if (diffYears > 10) {
      errors.push(`Data troppo vecchia per training data: ${components.year} (${diffYears} anni fa)`);
    }

    // Future date warning (not error)
    const parsedDate = new Date(components.year, components.month - 1, components.day);
    if (parsedDate > new Date()) {
      // Warning, not error - potrebbe essere training programmato
      console.log('🟡 Data futura rilevata:', this.formatDisplay(parsedDate, false)); // WARNING - rimuovere in produzione
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 🤔 Gestisce date ambigue (DD/MM vs MM/DD)
   * @param {Array} results - Array di possibili interpretazioni
   * @param {String} originalString - Stringa originale
   * @param {Object} options - Opzioni parsing
   * @returns {Object} - Result con disambiguation
   */
  handleAmbiguousDate(results, originalString, options) {
    console.log('🟡 Data ambigua rilevata, interpretazioni:', results.length); // WARNING - rimuovere in produzione

    // 🎯 Strategy 1: Prefer higher confidence patterns
    const sortedByConfidence = results.sort((a, b) => b.metadata.confidence - a.metadata.confidence);
    const topResult = sortedByConfidence[0];

    // If top result has significantly higher confidence, use it
    if (topResult.metadata.confidence >= 85) {
      console.log('🟢 Auto-risoluzione per alta confidence:', topResult.metadata.confidence + '%'); // INFO - rimuovere in produzione
      this.cacheResult(`${originalString}:${JSON.stringify(options)}`, topResult);
      return topResult;
    }

    // 🎯 Strategy 2: Use locale preference
    const localePreference = options.locale || 'it'; // Default Italian
    
    if (localePreference === 'it' || localePreference === 'eu') {
      // Prefer DD/MM format for Italian/European
      const europeanResult = results.find(r => r.metadata.format.includes('DD/MM'));
      if (europeanResult) {
        console.log('🟢 Auto-risoluzione per locale EU:', europeanResult.metadata.format); // INFO - rimuovere in produzione
        europeanResult.metadata.autoResolved = true;
        europeanResult.metadata.autoResolveReason = 'European locale preference';
        this.cacheResult(`${originalString}:${JSON.stringify(options)}`, europeanResult);
        return europeanResult;
      }
    }

    // 🎯 Strategy 3: Check if one interpretation is invalid
    const validResults = results.filter(r => r.success);
    if (validResults.length === 1) {
      console.log('🟢 Auto-risoluzione per unica interpretazione valida'); // INFO - rimuovere in produzione
      return validResults[0];
    }

    // 🤷‍♂️ Need human disambiguation
    console.log('🟡 Richiesta disambiguazione umana per:', originalString); // WARNING - rimuovere in produzione
    
    return {
      success: false,
      needsDisambiguation: true,
      originalString,
      options: results.map(r => ({
        date: r.date,
        display: r.formatted.display,
        format: r.metadata.format,
        confidence: r.metadata.confidence,
        iso: r.iso
      })),
      error: 'AMBIGUOUS_DATE',
      message: `Data "${originalString}" può essere interpretata in ${results.length} modi diversi`
    };
  }

  /**
   * 📅 Ottieni giorni in mese (handle leap years)
   * @param {Number} month - Mese (1-12)
   * @param {Number} year - Anno
   * @returns {Number} - Giorni nel mese
   */
  getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * 🔢 Espandi anno a due cifre (YY → YYYY)
   * @param {Number} shortYear - Anno a due cifre
   * @returns {Number} - Anno completo
   */
  expandShortYear(shortYear) {
    const currentYear = new Date().getFullYear();
    const currentShortYear = currentYear % 100;
    
    // Se anno è nel futuro prossimo (es. 25 nel 2024), assume 2025
    // Se anno è nel passato (es. 90 nel 2024), assume 1990
    const threshold = currentShortYear + 10;
    
    if (shortYear <= threshold) {
      return 2000 + shortYear;
    } else {
      return 1900 + shortYear;
    }
  }

  /**
   * 🇮🇹 Format data in italiano
   * @param {Date} date - Data JS
   * @param {Boolean} includeTime - Include ora
   * @returns {String} - Data formattata
   */
  formatItalian(date, includeTime = false) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let formatted = `${day}/${month}/${year}`;
    
    if (includeTime) {
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      formatted += ` ${hour}:${minute}`;
    }
    
    return formatted;
  }

  /**
   * 📺 Format per display user-friendly
   * @param {Date} date - Data JS
   * @param {Boolean} includeTime - Include ora
   * @returns {String} - Data display
   */
  formatDisplay(date, includeTime = false) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      locale: 'it-IT'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('it-IT', options);
  }

  /**
   * ❌ Crea failure result
   * @param {String} originalString - Stringa originale
   * @param {String} errorCode - Codice errore
   * @param {String} details - Dettagli errore
   * @returns {Object} - Failure result
   */
  createFailureResult(originalString, errorCode, details = null) {
    return {
      success: false,
      originalString,
      error: errorCode,
      message: this.getErrorMessage(errorCode),
      details,
      suggestions: this.getSuggestions(originalString)
    };
  }

  /**
   * 📝 Ottieni messaggio errore localizzato
   * @param {String} errorCode - Codice errore
   * @returns {String} - Messaggio errore
   */
  getErrorMessage(errorCode) {
    const messages = {
      'NO_PATTERN_MATCH': 'Formato data non riconosciuto',
      'PARSE_ERROR': 'Errore parsing data',
      'INVALID_COMPONENTS': 'Componenti data non validi',
      'AMBIGUOUS_DATE': 'Data ambigua - richiesta disambiguazione'
    };
    
    return messages[errorCode] || 'Errore sconosciuto parsing data';
  }

  /**
   * 💡 Genera suggestions per date non parsabili
   * @param {String} originalString - Stringa originale
   * @returns {Array} - Array suggestions
   */
  getSuggestions(originalString) {
    return [
      'Prova formato: DD/MM/YYYY (es. 25/08/2024)',
      'Prova formato: YYYY-MM-DD (es. 2024-08-25)',
      'Verifica che giorno/mese/anno siano validi',
      'Per timestamp: controlla che sia in formato corretto'
    ];
  }

  /**
   * 💾 Cache result per performance
   * @param {String} cacheKey - Chiave cache
   * @param {Object} result - Risultato da cachare
   */
  cacheResult(cacheKey, result) {
    this.parseCache.set(cacheKey, result);
    
    // Limit cache size (LRU-style)
    if (this.parseCache.size > 500) {
      const firstKey = this.parseCache.keys().next().value;
      this.parseCache.delete(firstKey);
    }
  }

  /**
   * 🧹 Clear cache
   */
  clearCache() {
    this.parseCache.clear();
    console.log('🟡 Date parser cache cleared'); // WARNING - rimuovere in produzione
  }

  /**
   * 📊 Cache statistics
   * @returns {Object} - Stats cache
   */
  getCacheStats() {
    return {
      cacheSize: this.parseCache.size,
      patternsSupported: this.datePatterns.length,
      mostConfidentPattern: this.datePatterns.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      ).name
    };
  }

  /**
   * 🧪 Test date parsing (dev utility)
   * @param {Array} testStrings - Array di stringhe test
   * @returns {Array} - Risultati test
   */
  testParsing(testStrings) {
    console.log('🔵 Test batch parsing...'); // INFO DEV - rimuovere in produzione
    
    const results = testStrings.map(dateStr => {
      const result = this.parseSmartDate(dateStr);
      return {
        input: dateStr,
        success: result.success,
        output: result.success ? result.formatted.display : result.error,
        confidence: result.success ? result.metadata.confidence : 0
      };
    });

    console.log('🟢 Test parsing completato:', results.length, 'casi'); // INFO - rimuovere in produzione
    return results;
  }
}

// Export singleton instance
const smartDateParser = new SmartDateParser();

console.log('🟢 Smart Date Parser inizializzato e pronto'); // INFO - rimuovere in produzione

module.exports = smartDateParser;