// client/src/components/performance/ColumnMappingStep.jsx
// 🎯 VERSIONE COMPLETA — Mapping leggibile con layout migliorato

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  User,
  Calendar,
  Ruler,
  Zap,
  Heart,
  Clock,
  Target,
  Lightbulb,
  Info,
  ChevronDown,
  Activity,
  Edit3,
  X
} from 'lucide-react';

// ✅ Preselezioni desiderate per header CSV specifici (a livello di modulo)
const DEFAULT_MAPPING_BY_HEADER = {
  playerId: 'playerId',          // Giocatore (Obbligatorio)
  session_date: 'session_date',  // Data Sessione (Obbligatorio)
  duration_minutes: 'none'       // -- Non mappare --
};

// 🎯 SET MINIMO DI DATI OBBLIGATORI
const MINIMUM_REQUIRED_FIELDS = [
  'playerId',           // Giocatore
  'session_date',       // Data Sessione  
  'duration_minutes',   // Durata (minuti)
  'total_distance_m'    // Distanza Totale
];

// Etichette statiche per i campi minimi (evita riferimenti non inizializzati)
const MINIMUM_FIELD_LABELS = {
  playerId: 'Giocatore',
  session_date: 'Data Sessione',
  duration_minutes: 'Durata Sessione',
  total_distance_m: 'Distanza Totale'
};

const ColumnMappingStep = ({
  csvHeaders,
  onMappingComplete,
  onBack,
  teamId,
  fileId,
  loading: externalLoading = false
}) => {
  // =========================
  // STATE
  // =========================
  const [mapping, setMapping] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [confidence, setConfidence] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
     const [warnings, setWarnings] = useState([]);
   const [showAdvanced, setShowAdvanced] = useState(false);
   const [customFields, setCustomFields] = useState([]);
     const [autoMappedFields, setAutoMappedFields] = useState(new Set());
  const [pendingSuggestions, setPendingSuggestions] = useState({});
  const [minimumDataValidation, setMinimumDataValidation] = useState(null);
  
  // Conserva headers rifiutati/gestiti per non re-iniettarli su nuove fetch
  const dismissedHeadersRef = useRef(new Set());
  
  // Persistenza per file (se torni al file precedente, ricordi i dismissed di quel file)
  const dismissedByFileRef = useRef(new Map());
  
  // Funzione per normalizzare gli header (usata sia per match che per dismiss)
  const normalizeHeader = useCallback((header) => {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  }, []);
  
  // Reset automatico quando cambia file o struttura headers
  const headersKey = useMemo(() => JSON.stringify([...csvHeaders].sort()), [csvHeaders]);
  useEffect(() => {
    console.log('🔄 Reset dismissed headers per nuovo file:', fileId, 'o nuova struttura headers');
    
    // Salva i dismissed del file corrente
    if (fileId) {
      dismissedByFileRef.current.set(fileId, new Set(dismissedHeadersRef.current));
    }
    
    // Carica i dismissed del nuovo file (se esistono)
    const newFileId = fileId || headersKey;
    const savedDismissed = dismissedByFileRef.current.get(newFileId);
    dismissedHeadersRef.current = new Set(savedDismissed || []);
    
    console.log('🔄 Dismissed salvati per file:', Array.from(dismissedHeadersRef.current));
  }, [fileId, headersKey]);

  // =========================
  // VALIDAZIONE SET MINIMO
  // =========================
  const validateMinimumData = useCallback((currentMapping) => {
    const missingFields = [];
    
    MINIMUM_REQUIRED_FIELDS.forEach(field => {
      // Cerca se questo campo del database è mappato a qualche colonna CSV
      const isMapped = Object.values(currentMapping).includes(field);
      if (!isMapped) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length === 0) {
      return {
        isValid: true,
        message: 'Set minimo di dati Validato',
        missingFields: []
      };
    } else {
      const fieldLabels = missingFields.map(field => MINIMUM_FIELD_LABELS[field] || field);
      
      return {
        isValid: false,
        message: 'Set minimo di dati Non Validato',
        missingFields: fieldLabels
      };
    }
  }, []);

  // =========================
  // DEFINIZIONI CAMPI (etichette umane)
  // =========================
  const fieldDefinitions = useMemo(() => ({
    playerId: {
      label: 'Giocatore',
      icon: User,
      description: 'Nome completo, cognome o numero maglia',
      example: 'Mario Rossi, Rossi, #10',
      required: true,
      color: '#3B82F6',
      category: 'Identificazione'
    },
    session_date: {
      label: 'Data Sessione',
      icon: Calendar,
      description: "Data dell'allenamento o partita",
      example: '2024-08-25, 25/08/2024',
      required: true,
      color: '#10B981',
      category: 'Temporale'
    },
    total_distance_m: {
      label: 'Distanza Totale',
      icon: Ruler,
      description: 'Distanza totale percorsa',
      example: '8500m, 8.5km',
      required: false,
      color: '#F59E0B',
      category: 'Performance'
    },
    sprint_distance_m: {
      label: 'Distanza Sprint',
      icon: Zap,
      description: 'Distanza percorsa ad alta intensità',
      example: '450m, 0.45km',
      required: false,
      color: '#EF4444',
      category: 'Performance'
    },
    avg_heart_rate: {
      label: 'Frequenza Cardiaca Media',
      icon: Heart,
      description: 'Battiti cardiaci medi durante sessione',
      example: '145, 155 bpm',
      required: false,
      color: '#EC4899',
      category: 'Fisiologico'
    },
    max_heart_rate: {
      label: 'Frequenza Cardiaca Max',
      icon: Heart,
      description: 'Massima frequenza cardiaca raggiunta',
      example: '180, 185 bpm',
      required: false,
      color: '#DC2626',
      category: 'Fisiologico'
    },
    duration_minutes: {
      label: 'Durata Sessione',
      icon: Clock,
      description: "Durata dell'allenamento in minuti",
      example: '90, 120',
      required: false,
      color: '#7C3AED',
      category: 'Temporale'
    },
    top_speed_kmh: {
      label: 'Velocità Massima',
      icon: Target,
      description: 'Velocità di picco raggiunta',
      example: '28.5, 31.2 km/h',
      required: false,
      color: '#059669',
      category: 'Performance'
    },

  avg_speed_kmh: {
    label: 'Velocità Media',
    icon: Target,
    description: 'Velocità media durante la sessione',
    example: '7.8',
    required: false,
    color: '#3B82F6',
    category: 'Performance'
  },
  player_load: {
    label: 'Player Load',
    icon: Zap,
    description: 'Indice di carico complessivo della sessione',
    example: '350',
    required: false,
    color: '#F59E0B',
    category: 'Performance'
  },
  high_intensity_runs: {
    label: 'Corse Alta Intensità',
    icon: Activity,
    description: 'Numero corse ad alta intensità',
    example: '24',
    required: false,
    color: '#EF4444',
    category: 'Performance'
  },
  
  // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
  equivalent_distance_m: {
    label: 'Distanza Equivalente',
    icon: Ruler,
    description: 'Distanza equivalente considerando intensità',
    example: '9200m',
    required: false,
    color: '#8B5CF6',
    category: 'Performance Avanzata'
  },
  equivalent_distance_pct: {
    label: '% Distanza Equivalente',
    icon: Target,
    description: 'Percentuale distanza equivalente',
    example: '108.2%',
    required: false,
    color: '#8B5CF6',
    category: 'Performance Avanzata'
  },
  distance_per_min: {
    label: 'Distanza per Minuto',
    icon: Clock,
    description: 'Distanza percorsa per minuto',
    example: '94.4 m/min',
    required: false,
    color: '#10B981',
    category: 'Performance Avanzata'
  },
  distance_over_15_kmh_m: {
    label: 'Distanza > 15 km/h',
    icon: Zap,
    description: 'Distanza percorsa sopra 15 km/h',
    example: '1200m',
    required: false,
    color: '#F59E0B',
    category: 'Zone Velocità'
  },
  distance_15_20_kmh_m: {
    label: 'Distanza 15-20 km/h',
    icon: Zap,
    description: 'Distanza percorsa tra 15-20 km/h',
    example: '800m',
    required: false,
    color: '#F59E0B',
    category: 'Zone Velocità'
  },
  distance_20_25_kmh_m: {
    label: 'Distanza 20-25 km/h',
    icon: Zap,
    description: 'Distanza percorsa tra 20-25 km/h',
    example: '400m',
    required: false,
    color: '#EF4444',
    category: 'Zone Velocità'
  },
  distance_over_25_kmh_m: {
    label: 'Distanza > 25 km/h',
    icon: Zap,
    description: 'Distanza percorsa sopra 25 km/h',
    example: '200m',
    required: false,
    color: '#DC2626',
    category: 'Zone Velocità'
  },
  distance_over_20_kmh_m: {
    label: 'Distanza > 20 km/h',
    icon: Zap,
    description: 'Distanza percorsa sopra 20 km/h',
    example: '600m',
    required: false,
    color: '#EF4444',
    category: 'Zone Velocità'
  },
  
  // ================= NUOVI CAMPI - POTENZA METABOLICA =================
  avg_metabolic_power_wkg: {
    label: 'Potenza Metabolica Media',
    icon: Activity,
    description: 'Potenza metabolica media in W/kg',
    example: '12.5 W/kg',
    required: false,
    color: '#059669',
    category: 'Potenza Metabolica'
  },
  distance_over_20wkg_m: {
    label: 'Distanza > 20 W/kg',
    icon: Activity,
    description: 'Distanza percorsa sopra 20 W/kg',
    example: '300m',
    required: false,
    color: '#10B981',
    category: 'Potenza Metabolica'
  },
  distance_over_35wkg_m: {
    label: 'Distanza > 35 W/kg',
    icon: Activity,
    description: 'Distanza percorsa sopra 35 W/kg',
    example: '100m',
    required: false,
    color: '#EF4444',
    category: 'Potenza Metabolica'
  },
  max_power_5s_wkg: {
    label: 'Max Potenza 5s',
    icon: Activity,
    description: 'Potenza massima su 5 secondi',
    example: '25.3 W/kg',
    required: false,
    color: '#DC2626',
    category: 'Potenza Metabolica'
  },
  
  // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
  distance_acc_over_2_ms2_m: {
    label: 'Distanza Acc > 2m/s²',
    icon: Zap,
    description: 'Distanza percorsa accelerando > 2m/s²',
    example: '150m',
    required: false,
    color: '#10B981',
    category: 'Accelerazioni'
  },
  distance_dec_over_minus2_ms2_m: {
    label: 'Distanza Dec > -2m/s²',
    icon: Zap,
    description: 'Distanza percorsa decelerando > -2m/s²',
    example: '120m',
    required: false,
    color: '#EF4444',
    category: 'Decelerazioni'
  },
  pct_distance_acc_over_2_ms2: {
    label: '% Dist Acc > 2m/s²',
    icon: Target,
    description: 'Percentuale distanza in accelerazione > 2m/s²',
    example: '1.8%',
    required: false,
    color: '#10B981',
    category: 'Accelerazioni'
  },
  pct_distance_dec_over_minus2_ms2: {
    label: '% Dist Dec > -2m/s²',
    icon: Target,
    description: 'Percentuale distanza in decelerazione > -2m/s²',
    example: '1.4%',
    required: false,
    color: '#EF4444',
    category: 'Decelerazioni'
  },
  distance_acc_over_3_ms2_m: {
    label: 'Distanza Acc > 3m/s²',
    icon: Zap,
    description: 'Distanza percorsa accelerando > 3m/s²',
    example: '80m',
    required: false,
    color: '#059669',
    category: 'Accelerazioni'
  },
  distance_dec_over_minus3_ms2_m: {
    label: 'Distanza Dec < -3m/s²',
    icon: Zap,
    description: 'Distanza percorsa decelerando < -3m/s²',
    example: '60m',
    required: false,
    color: '#DC2626',
    category: 'Decelerazioni'
  },
  num_acc_over_3_ms2: {
    label: 'Num Acc > 3m/s²',
    icon: Activity,
    description: 'Numero accelerazioni > 3m/s²',
    example: '15',
    required: false,
    color: '#059669',
    category: 'Accelerazioni'
  },
  num_dec_over_minus3_ms2: {
    label: 'Num Dec < -3m/s²',
    icon: Activity,
    description: 'Numero decelerazioni < -3m/s²',
    example: '12',
    required: false,
    color: '#DC2626',
    category: 'Decelerazioni'
  },
  acc_events_per_min_over_2_ms2: {
    label: 'Eventi Acc/min > 2m/s²',
    icon: Clock,
    description: 'Eventi accelerazione per minuto > 2m/s²',
    example: '0.18',
    required: false,
    color: '#10B981',
    category: 'Accelerazioni'
  },
  dec_events_per_min_over_minus2_ms2: {
    label: 'Eventi Dec/min > -2m/s²',
    icon: Clock,
    description: 'Eventi decelerazione per minuto > -2m/s²',
    example: '0.14',
    required: false,
    color: '#EF4444',
    category: 'Decelerazioni'
  },
  
  // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
  time_under_5wkg_min: {
    label: 'Tempo < 5 W/kg',
    icon: Clock,
    description: 'Tempo trascorso sotto 5 W/kg',
    example: '45 min',
    required: false,
    color: '#6B7280',
    category: 'Zone Intensità'
  },
  time_5_10_wkg_min: {
    label: 'Tempo 5-10 W/kg',
    icon: Clock,
    description: 'Tempo trascorso tra 5-10 W/kg',
    example: '35 min',
    required: false,
    color: '#F59E0B',
    category: 'Zone Intensità'
  },
  
  // ================= NUOVI CAMPI - INDICI E PROFILI =================
  rvp_index: {
    label: 'Indice RVP',
    icon: Target,
    description: 'Indice di profilo di corsa',
    example: '0.85',
    required: false,
    color: '#8B5CF6',
    category: 'Indici Sintetici'
  },
  training_load: {
    label: 'Training Load',
    icon: Activity,
    description: 'Carico di allenamento',
    example: '350',
    required: false,
    color: '#F59E0B',
    category: 'Indici Sintetici'
  },
  
  // ================= NUOVI CAMPI - INFORMAZIONI AGGIUNTIVE =================
  session_day: {
    label: 'Giorno Sessione',
    icon: Calendar,
    description: 'Giorno della settimana',
    example: 'Lunedì, Mon',
    required: false,
    color: '#6B7280',
    category: 'Informazioni'
  },
  is_match: {
    label: 'È Partita',
    icon: Target,
    description: 'Indica se è una partita (true/false)',
    example: 'true, false, 1, 0',
    required: false,
    color: '#10B981',
    category: 'Informazioni'
  },
  drill_name: {
    label: 'Nome Esercizio',
    icon: Lightbulb,
    description: 'Nome specifico dell\'esercizio o drill',
    example: 'Possesso palla, Tiri in porta',
    required: false,
    color: '#3B82F6',
    category: 'Informazioni'
  },
  session_type: {
    label: 'Tipo Sessione',
    icon: Calendar,
    description: 'Allenamento o partita',
    example: 'Training, Match',
    required: false,
    color: '#10B981',
    category: 'Temporale'
  },
  session_name: {
    label: 'Nome Sessione',
    icon: Calendar,
    description: 'Nome specifico della sessione',
    example: 'Allenamento tecnico mattutino, Partita contro Juventus',
    required: false,
    color: '#8B5CF6',
    category: 'Temporale'
  },
  source_device: {
    label: 'Dispositivo Sorgente',
    icon: Info,
    description: 'Tracker o sistema che ha generato i dati',
    example: 'Catapult, STATSports',
    required: false,
    color: '#6B7280',
    category: 'Meta'
  },
  notes: {
    label: 'Note',
    icon: Lightbulb,
    description: 'Annotazioni aggiuntive',
    example: 'Buona prestazione, recupero attivo',
    required: false,
    color: '#EAB308',
    category: 'Meta'
  }
  }), []);

     // Applica preselezioni e auto-mapping intelligente una volta che abbiamo gli header
   useEffect(() => {
     if (!csvHeaders || csvHeaders.length === 0) return;

     setMapping(prev => {
       const next = { ...prev };
       
       // 1. Applica preselezioni predefinite
       for (const h of csvHeaders) {
         if (next[h] === undefined && DEFAULT_MAPPING_BY_HEADER[h] !== undefined) {
           next[h] = DEFAULT_MAPPING_BY_HEADER[h] === 'none' ? undefined : DEFAULT_MAPPING_BY_HEADER[h];
         }
       }

       // 2. Auto-mapping intelligente per corrispondenze esatte e simili
       for (const csvHeader of csvHeaders) {
         // Se questa colonna CSV non è già mappata
         if (!Object.values(next).includes(csvHeader)) {
           const csvHeaderLower = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
           
           // Cerca corrispondenza esatta con i campi del database
           const exactMatch = Object.keys(fieldDefinitions).find(dbField => 
             dbField.toLowerCase() === csvHeader.toLowerCase()
           );
           
           if (exactMatch) {
             // Mappa automaticamente
             next[csvHeader] = exactMatch;
             console.log(`🔵 Auto-mapping: ${csvHeader} → ${exactMatch} (corrispondenza esatta)`);
             setAutoMappedFields(prev => new Set([...prev, exactMatch]));
             continue;
           }
           
           // Cerca corrispondenze simili (senza spazi, underscore, trattini)
           const similarMatch = Object.keys(fieldDefinitions).find(dbField => {
             const dbFieldClean = dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
             return dbFieldClean === csvHeaderLower;
           });
           
           if (similarMatch) {
             // Mappa automaticamente
             next[csvHeader] = similarMatch;
             console.log(`🔵 Auto-mapping: ${csvHeader} → ${similarMatch} (corrispondenza simile)`);
             setAutoMappedFields(prev => new Set([...prev, similarMatch]));
             continue;
           }
           
           // Cerca corrispondenze parziali per campi comuni
           const partialMatches = {
             'player': 'playerId',
             'playerid': 'playerId',
             'player_id': 'playerId',
             'date': 'session_date',
             'sessiondate': 'session_date',
             'session_date': 'session_date',
             'duration': 'duration_minutes',
             'durationminutes': 'duration_minutes',
             'duration_minutes': 'duration_minutes',
             'distance': 'total_distance_m',
             'totaldistance': 'total_distance_m',
             'total_distance': 'total_distance_m',
             'sprint': 'sprint_distance_m',
             'sprintdistance': 'sprint_distance_m',
             'sprint_distance': 'sprint_distance_m',
             'speed': 'avg_speed_kmh',
             'avgspeed': 'avg_speed_kmh',
             'avg_speed': 'avg_speed_kmh',
             'topspeed': 'top_speed_kmh',
             'top_speed': 'top_speed_kmh',
             'heartrate': 'avg_heart_rate',
             'heart_rate': 'avg_heart_rate',
             'avgheartrate': 'avg_heart_rate',
             'maxheartrate': 'max_heart_rate',
             'max_heart_rate': 'max_heart_rate',
             'load': 'player_load',
             'playerload': 'player_load',
             'player_load': 'player_load',
             'runs': 'high_intensity_runs',
             'highintensityruns': 'high_intensity_runs',
             'high_intensity_runs': 'high_intensity_runs'
           };
           
           const partialMatch = partialMatches[csvHeaderLower];
           if (partialMatch) {
             next[csvHeader] = partialMatch;
             console.log(`🔵 Auto-mapping: ${csvHeader} → ${partialMatch} (corrispondenza parziale)`);
             setAutoMappedFields(prev => new Set([...prev, partialMatch]));
           }
         }
       }

       // 🔍 Validazione immediata del set minimo dopo auto-mapping
       const validation = validateMinimumData(next);
       setMinimumDataValidation(validation);

       return next;
     });
   }, [csvHeaders, fieldDefinitions, validateMinimumData]);

     // =========================
  // SUGGERIMENTI INTELLIGENTI MIGLIORATI
  // =========================
  const generateIntelligentSuggestions = useCallback(() => {
    console.log('🧠 GENERAZIONE SUGGERIMENTI INTELLIGENTI');
    console.log('🧠 CSV Headers:', csvHeaders);
    console.log('🧠 Mapping attuale:', mapping);
    
    if (!csvHeaders || csvHeaders.length === 0) {
      console.log('🧠 Nessun CSV header, uscita');
      return;
    }

    const newSuggestions = {};
    const newPendingSuggestions = {};

              csvHeaders.forEach(csvHeader => {
            // Se è già mappato, salta
            if (Object.values(mapping).includes(csvHeader)) {
              console.log('🧠 Salto', csvHeader, '- già mappato');
              return;
            }
            
            // Se è già stato processato (accettato/rifiutato), salta
            if (mapping[csvHeader] !== undefined) {
              console.log('🧠 Salto', csvHeader, '- già processato');
              return;
            }
            
            // Se è già stato rifiutato/gestito, salta
            if (dismissedHeadersRef.current.has(normalizeHeader(csvHeader))) {
              console.log('🧠 Salto', csvHeader, '- già rifiutato/gestito');
              return;
            }

      let bestMatch = null;
      let confidence = 0;
      let reason = '';
      let explanation = '';
      let example = '';
      let category = '';
      let alternatives = [];

      // 1. Corrispondenza esatta
      const exactMatch = Object.keys(fieldDefinitions).find(dbField => 
        dbField.toLowerCase() === csvHeader.toLowerCase()
      );
      if (exactMatch) {
        bestMatch = exactMatch;
        confidence = 95;
        reason = 'Corrispondenza esatta';
        explanation = `Il campo "${csvHeader}" corrisponde esattamente al nostro campo "${fieldDefinitions[exactMatch].label}"`;
        example = `${csvHeader} → ${fieldDefinitions[exactMatch].label}`;
        category = fieldDefinitions[exactMatch].category;
      }

      // 2. Corrispondenza simile (senza caratteri speciali)
      if (!bestMatch) {
        const similarMatch = Object.keys(fieldDefinitions).find(dbField => {
          const dbFieldClean = dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
          const csvHeaderClean = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
          return dbFieldClean === csvHeaderClean;
        });
        if (similarMatch) {
          bestMatch = similarMatch;
          confidence = 85;
          reason = 'Corrispondenza simile';
          explanation = `Il campo "${csvHeader}" è molto simile al nostro campo "${fieldDefinitions[similarMatch].label}"`;
          example = `${csvHeader} → ${fieldDefinitions[similarMatch].label}`;
          category = fieldDefinitions[similarMatch].category;
        }
      }

      // 3. Pattern matching intelligente migliorato
      if (!bestMatch) {
        const patterns = [
          

          

          

          

          
          // Pattern per RPE
          { 
            pattern: /rpe|rate.*perceived.*exertion|sforzo.*percepito/i, 
            field: 'custom.rpe', 
            conf: 90, 
            reason: 'RPE → Campo personalizzato',
            explanation: 'RPE (Rate of Perceived Exertion) è un campo specifico che creeremo come personalizzato',
            example: 'rpe → RPE (campo personalizzato)',
            category: 'Campi Personalizzati'
          },
          
          // Pattern per session RPE
          { 
            pattern: /session.*rpe|rpe.*sessione/i, 
            field: 'custom.session_rpe', 
            conf: 90, 
            reason: 'Session RPE → Campo personalizzato',
            explanation: 'RPE della sessione, campo specifico da creare come personalizzato',
            example: 'session_rpe → Session RPE (campo personalizzato)',
            category: 'Campi Personalizzati'
          },
          
          // Pattern per impacts
          { 
            pattern: /impacts.*count|conteggio.*impatto|impatti/i, 
            field: 'custom.impacts_count', 
            conf: 95, 
            reason: 'Conteggio impatti → Campo personalizzato',
            explanation: 'Il campo conta gli impatti, creeremo un campo personalizzato',
            example: 'impacts_count → Conteggio Impatti (campo personalizzato)',
            category: 'Campi Personalizzati'
          },
          
          // Pattern per steps
          { 
            pattern: /steps.*count|conteggio.*passi|passi/i, 
            field: 'custom.steps_count', 
            conf: 95, 
            reason: 'Conteggio passi → Campo personalizzato',
            explanation: 'Il campo conta i passi, creeremo un campo personalizzato',
            example: 'steps_count → Conteggio Passi (campo personalizzato)',
            category: 'Campi Personalizzati'
          },
          
          // Pattern per load rating
          { 
            pattern: /load.*rating|rating.*load|valutazione.*carico/i, 
            field: 'custom.player_load_rating', 
            conf: 95, 
            reason: 'Rating carico → Campo personalizzato',
            explanation: 'Il campo valuta il carico, creeremo un campo personalizzato',
            example: 'player_load_rating → Rating Carico (campo personalizzato)',
            category: 'Campi Personalizzati'
          }
        ];

        for (const { pattern, field, conf, reason: patternReason, explanation: patternExplanation, example: patternExample, category: patternCategory, alternatives: patternAlternatives } of patterns) {
          if (pattern.test(csvHeader)) {
            bestMatch = field;
            confidence = conf;
            reason = patternReason;
            explanation = patternExplanation;
            example = patternExample;
            category = patternCategory;
            alternatives = patternAlternatives || [];
            break;
          }
        }
      }

      // 4. Analisi del contenuto (se disponibile)
      if (!bestMatch && confidence < 70) {
        confidence = 50;
        reason = 'Analisi limitata';
        explanation = 'Non riusciamo a determinare automaticamente il tipo di campo';
        category = 'Non Riconosciuto';
      }

      if (bestMatch && confidence >= 60) {
        const suggestion = {
          csvHeader,
          suggestedField: bestMatch,
          confidence,
          reason,
          explanation,
          example,
          category,
          alternatives
        };
        
        newSuggestions[csvHeader] = suggestion;
        
        // Se la confidenza è alta, aggiungi ai pending per approvazione
        if (confidence >= 75) {
          newPendingSuggestions[csvHeader] = suggestion;
        }
      }
    });

    console.log('🧠 SUGGERIMENTI GENERATI:', newSuggestions);
    console.log('🧠 PENDING SUGGERIMENTI:', newPendingSuggestions);
    console.log('🧠 NUMERO SUGGERIMENTI:', Object.keys(newSuggestions).length);
    console.log('🧠 NUMERO PENDING:', Object.keys(newPendingSuggestions).length);
    
    setSuggestions(newSuggestions);
    setPendingSuggestions(newPendingSuggestions);
  }, [csvHeaders, mapping, fieldDefinitions]);

   // Funzione helper per trovare alternative
   const getAlternativeSuggestions = (csvHeader, currentSuggestion) => {
     const alternatives = [];
     const csvHeaderLower = csvHeader.toLowerCase();
     
     // Trova campi simili basati su pattern
     Object.keys(fieldDefinitions).forEach(field => {
       if (field !== currentSuggestion) {
         const fieldLower = field.toLowerCase();
         
         // Se il campo contiene parole simili
         if (fieldLower.includes('distance') && csvHeaderLower.includes('distance')) {
           alternatives.push({ field, confidence: 70, reason: 'Campo distanza simile' });
         }
         if (fieldLower.includes('speed') && csvHeaderLower.includes('speed')) {
           alternatives.push({ field, confidence: 70, reason: 'Campo velocità simile' });
         }
         if (fieldLower.includes('heart') && csvHeaderLower.includes('heart')) {
           alternatives.push({ field, confidence: 70, reason: 'Campo frequenza cardiaca simile' });
         }
       }
     });
     
     return alternatives.slice(0, 3); // Massimo 3 alternative
   };

  // =========================
  // SUGGERIMENTI INTELLIGENTI (opzionali)
  // =========================
  const loadSmartSuggestions = useCallback(async () => {
    if (!csvHeaders || csvHeaders.length === 0 || !teamId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/performance/map-columns', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: csvHeaders, teamId })
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filtra le risposte del backend per evitare reiniezione di suggerimenti rifiutati
      const filteredSuggestions = {};
      Object.entries(data.suggestions || {}).forEach(([header, suggestion]) => {
        if (!dismissedHeadersRef.current.has(normalizeHeader(header))) {
          filteredSuggestions[header] = suggestion;
        } else {
          console.log('🧠 Salto suggerimento backend per', header, '- già rifiutato/gestito');
        }
      });
      
      setSuggestions(filteredSuggestions);
      setConfidence(data.confidence?.individual || {});
      setWarnings(data.warnings || []);

      // Auto-apply solo alta confidence, ma NON sovrascrivere le preselezioni richieste
      const auto = {};
      Object.entries(filteredSuggestions).forEach(([header, s]) => {
        if (s?.confidence >= 85) {
          // se avevamo default "none" lasciamo non mappato
          if (DEFAULT_MAPPING_BY_HEADER[header] === 'none') return;
          auto[header] = s.dbField;
        }
      });

      setMapping(prev => ({ ...auto, ...prev }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [csvHeaders, teamId]);

     useEffect(() => {
     if (csvHeaders?.length && teamId) loadSmartSuggestions();
   }, [csvHeaders, teamId, loadSmartSuggestions]);

     // Debounce della generazione suggerimenti (evita lavoro ripetuto in rapidi cambi)
  const generateRef = useRef();
  const debouncedGenerate = useCallback(() => {
    clearTimeout(generateRef.current);
    generateRef.current = setTimeout(() => {
      if (csvHeaders?.length) {
        generateIntelligentSuggestions();
      }
    }, 120);
  }, [generateIntelligentSuggestions, csvHeaders]);
  
  // Genera suggerimenti intelligenti quando cambiano gli header
  useEffect(() => {
    debouncedGenerate();
  }, [debouncedGenerate, csvHeaders, mapping]);

  // =========================
  // HANDLERS
  // =========================
  const handleMappingChange = useCallback((csvHeader, dbField) => {
    const newMapping = {
      ...mapping,
      [csvHeader]: dbField === 'none' ? undefined : dbField
    };
    
    setMapping(newMapping);
    
    // Se l'utente cancella manualmente un mapping, riabilita il suggerimento
    if (dbField === 'none' || dbField === undefined) {
      console.log('🔄 Riabilito suggerimento per:', csvHeader);
      dismissedHeadersRef.current.delete(normalizeHeader(csvHeader));
    }
    
    // 🔍 Validazione immediata del set minimo
    const validation = validateMinimumData(newMapping);
    setMinimumDataValidation(validation);
  }, [mapping, validateMinimumData, normalizeHeader]);

  const validateMapping = useMemo(() => {
    const requiredFields = Object.entries(fieldDefinitions)
      .filter(([, cfg]) => cfg.required)
      .map(([k]) => k);

    const mappedFields = Object.values(mapping).filter(Boolean);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      totalMapped: mappedFields.length,
      totalHeaders: csvHeaders?.length || 0
    };
  }, [mapping, fieldDefinitions, csvHeaders]);

  const handleComplete = useCallback(() => {
    if (!validateMapping.isValid) {
      setError(`Campi obbligatori mancanti: ${validateMapping.missingRequired.join(', ')}`);
      return;
    }

    const mappingResult = {
      mapping: Object.fromEntries(
        Object.entries(mapping)
          .filter(([, dbField]) => dbField)
          .map(([csvHeader, dbField]) => [
            csvHeader,
            { dbField, ...suggestions[csvHeader], csvHeader }
          ])
      ),
      statistics: {
        totalHeaders: csvHeaders.length,
        mappedHeaders: Object.keys(mapping).filter(k => mapping[k]).length,
        requiredFieldsMapped: validateMapping.totalMapped,
        averageConfidence: Math.round(
          Object.values(confidence).reduce((sum, c) => sum + c, 0) /
          Math.max(Object.values(confidence).length, 1)
        )
      },
      warnings
    };

    // 🔵 DEBUG - Log dettagliato mapping
    console.log('🔵 === DEBUG MAPPING COMPLETO ===');
    console.log('🔵 CSV Headers originali:', csvHeaders);
    console.log('🔵 Mapping stato:', mapping);
    console.log('🔵 Mapping finale inviato:', mappingResult.mapping);
    console.log('🔵 Campi mappati totali:', Object.keys(mappingResult.mapping).length);
    
    // Debug specifico per ogni campo mappato
    Object.entries(mappingResult.mapping).forEach(([csvHeader, fieldInfo]) => {
      console.log(`🔵 ${csvHeader} → ${fieldInfo.dbField} (${fieldInfo.dbField.startsWith('custom.') ? 'CUSTOM' : 'PREDEFINITO'})`);
    });
    
    console.log('🔵 ================================');
    onMappingComplete(mappingResult);
  }, [validateMapping, mapping, suggestions, csvHeaders, confidence, warnings, onMappingComplete]);

  // =========================
  // HELPERS UI
  // =========================
  const getConfidenceStyle = (conf) => {
    if (conf >= 90) return { color: '#10B981', bg: '#ECFDF5', label: 'Ottima' };
    if (conf >= 75) return { color: '#F59E0B', bg: '#FFFBEB', label: 'Buona' };
    if (conf >= 60) return { color: '#EF4444', bg: '#FEF2F2', label: 'Media' };
    return { color: '#6B7280', bg: '#F3F4F6', label: 'Bassa' };
  };

     // 👇 funzione per aggiungere un campo custom
     const addCustomField = (label) => {
    const slug = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const newField = {
      value: `custom.${slug}`,
      label: `${label} (custom)`
    };
    setCustomFields(prev => [...prev, newField]);
    return newField.value;
  };
  
  // Helper per verificare se un campo ha suggerimenti disponibili
  const hasSuggestionForField = useCallback((dbField) => {
    return Object.values(suggestions).some(suggestion => 
      suggestion.suggestedField === dbField && 
      !dismissedHeadersRef.current.has(normalizeHeader(suggestion.csvHeader))
    );
  }, [suggestions, normalizeHeader]);

     // =========================
  // GESTIONE SUGGERIMENTI MIGLIORATA
  // =========================
  const acceptSuggestion = useCallback((suggestion) => {
    console.log('🔵 CLICK ACCETTA - Inizio funzione acceptSuggestion');
    console.log('🔵 Suggerimento ricevuto:', suggestion);
    console.log('🔵 Mapping attuale:', mapping);
    
    // Unicità del target (evita che due header finiscano sullo stesso campo DB)
    const isTargetAlreadyUsed = Object.values(mapping).includes(suggestion.suggestedField);
    if (isTargetAlreadyUsed) {
      const conflictingHeader = Object.keys(mapping).find(key => mapping[key] === suggestion.suggestedField);
      console.log('⚠️ Target già utilizzato:', suggestion.suggestedField, 'da', conflictingHeader);
      
      // Se c'è un conflitto, mostra errore e non procedere
      console.log('⚠️ Target già utilizzato:', suggestion.suggestedField, 'da', conflictingHeader);
      setError(`Il campo "${suggestion.suggestedField}" è già mappato da "${conflictingHeader}". Rimuovi prima il mapping esistente o usa un campo diverso.`);
      return;
    }
    
        // Se non c'è conflitto, procedi normalmente
    const newMapping = {
      ...mapping,
      [suggestion.csvHeader]: suggestion.suggestedField
    };
    
    console.log('🔵 Nuovo mapping:', newMapping);
    
    setMapping(newMapping);
    
    // Rimuovi dai pending E dai suggestions
    setPendingSuggestions(prev => {
      console.log('🔵 PendingSuggestions prima:', prev);
      const newPending = { ...prev };
      delete newPending[suggestion.csvHeader];
      console.log('🔵 PendingSuggestions dopo:', newPending);
      return newPending;
    });
    
    setSuggestions(prev => {
      console.log('🔵 Suggestions prima:', prev);
      const newSuggestions = { ...prev };
      delete newSuggestions[suggestion.csvHeader];
      console.log('🔵 Suggestions dopo:', newSuggestions);
      return newSuggestions;
    });
    
    // Aggiungi al set dei rifiutati per evitare reiniezione
    dismissedHeadersRef.current.add(normalizeHeader(suggestion.csvHeader));
    
    // 🔍 Validazione immediata del set minimo
    const validation = validateMinimumData(newMapping);
    setMinimumDataValidation(validation);
    
    console.log(`✅ Suggerimento accettato: ${suggestion.csvHeader} → ${suggestion.suggestedField}`);
    console.log('🔵 CLICK ACCETTA - Fine funzione acceptSuggestion');
  }, [mapping, validateMinimumData]);

  const handleAlternative = useCallback((suggestion) => {
    // Per ora, rifiuta il suggerimento corrente (l'utente può poi mappare manualmente)
    console.log(`🔍 Alternative per: ${suggestion.csvHeader}`, suggestion.alternatives);
    
    // Rimuovi dai pending E dai suggestions
    setPendingSuggestions(prev => {
      const newPending = { ...prev };
      delete newPending[suggestion.csvHeader];
      return newPending;
    });
    
    setSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[suggestion.csvHeader];
      return newSuggestions;
    });
    
         // Aggiungi al set dei rifiutati per evitare reiniezione
     dismissedHeadersRef.current.add(normalizeHeader(suggestion.csvHeader));
     
     console.log(`🔄 Suggerimento rifiutato per alternative: ${suggestion.csvHeader}`);
  }, []);

  const rejectSuggestion = useCallback((suggestion) => {
    console.log('🔴 CLICK RIFIUTA - Inizio funzione rejectSuggestion');
    console.log('🔴 Suggerimento ricevuto:', suggestion);
    console.log('🔴 PendingSuggestions attuali:', pendingSuggestions);
    console.log('🔴 Suggestions attuali:', suggestions);
    
    // Rimuovi dai pending E dai suggestions senza mappare
    setPendingSuggestions(prev => {
      console.log('🔴 PendingSuggestions prima:', prev);
      const newPending = { ...prev };
      delete newPending[suggestion.csvHeader];
      console.log('🔴 PendingSuggestions dopo:', newPending);
      return newPending;
    });
    
    setSuggestions(prev => {
      console.log('🔴 Suggestions prima:', prev);
      const newSuggestions = { ...prev };
      delete newSuggestions[suggestion.csvHeader];
      console.log('🔴 Suggestions dopo:', newSuggestions);
      return newSuggestions;
    });
    
         // Aggiungi al set dei rifiutati per evitare reiniezione
     dismissedHeadersRef.current.add(normalizeHeader(suggestion.csvHeader));
     
     console.log(`❌ Suggerimento rifiutato: ${suggestion.csvHeader}`);
    console.log('🔴 CLICK RIFIUTA - Fine funzione rejectSuggestion');
  }, [pendingSuggestions, suggestions]);



   const applyAllSuggestions = useCallback(() => {
     Object.entries(pendingSuggestions).forEach(([csvHeader, suggestion]) => {
       setMapping(prev => ({
         ...prev,
         [csvHeader]: suggestion.suggestedField
       }));
     });
     
     setPendingSuggestions({});
     console.log(`✅ Applicati tutti i suggerimenti (${Object.keys(pendingSuggestions).length})`);
   }, [pendingSuggestions]);

   const rejectAllSuggestions = useCallback(() => {
     setPendingSuggestions({});
     console.log(`❌ Rifiutati tutti i suggerimenti`);
   }, []);

  // =========================
  // COMPONENTI UI MIGLIORATI
  // =========================
  
  // Helper per raggruppare suggerimenti per categoria
  const groupSuggestionsByCategory = useCallback((suggestions) => {
    const grouped = {};
    Object.values(suggestions).forEach(suggestion => {
      const category = suggestion.category || 'Altri';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(suggestion);
    });
    return grouped;
  }, []);

  // Helper per ottenere icona categoria
  const getCategoryIcon = useCallback((category) => {
    const icons = {
      'Performance': '🏃‍♂️',
      'Fisiologico': '💓',
      'Temporale': '⏱️',
      'Identificazione': '👤',
      'Accelerazioni': '⚡',
      'Decelerazioni': '🔄',
      'Informazioni': '📋',
      'Campi Personalizzati': '📝',
      'Non Riconosciuto': '❓'
    };
    return icons[category] || '📊';
  }, []);

  // Helper per ottenere colore categoria
  const getCategoryColor = useCallback((category) => {
    const colors = {
      'Performance': '#3B82F6',
      'Fisiologico': '#EF4444',
      'Temporale': '#10B981',
      'Identificazione': '#8B5CF6',
      'Accelerazioni': '#F59E0B',
      'Decelerazioni': '#DC2626',
      'Informazioni': '#6B7280',
      'Campi Personalizzati': '#059669',
      'Non Riconosciuto': '#9CA3AF'
    };
    return colors[category] || '#6B7280';
  }, []);

  // Componente per singolo suggerimento migliorato
  const ImprovedSuggestionCard = ({ suggestion, onAccept, onAlternative, onReject }) => {
    console.log('🎯 RENDERING ImprovedSuggestionCard per:', suggestion.csvHeader);
    console.log('🎯 Props ricevute:', { onAccept: !!onAccept, onAlternative: !!onAlternative, onReject: !!onReject });
    console.log('🎯 Timestamp render:', new Date().toISOString());
    
    const categoryColor = getCategoryColor(suggestion.category);
    const confidenceStyle = getConfidenceStyle(suggestion.confidence);
    
    return (
      <div className="improved-suggestion-card">
        <div className="suggestion-header">
          <div className="csv-column">
            <span className="csv-name">{suggestion.csvHeader}</span>
            <span className="csv-category" style={{ color: categoryColor }}>
              {getCategoryIcon(suggestion.category)} {suggestion.category}
            </span>
          </div>
          <ArrowRight size={20} color="#9CA3AF" />
          <div className="suggested-field">
            <span className="field-name">
              {suggestion.suggestedField.startsWith('custom.') 
                ? suggestion.suggestedField.replace('custom.', '') 
                : fieldDefinitions[suggestion.suggestedField]?.label || suggestion.suggestedField
              }
            </span>
            <span className="field-db">{suggestion.suggestedField}</span>
          </div>
        </div>
        
        <div className="suggestion-details">
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ 
                width: `${suggestion.confidence}%`, 
                backgroundColor: confidenceStyle.color 
              }} 
            />
            <span className="confidence-text" style={{ color: confidenceStyle.color }}>
              {suggestion.confidence}% confidenza
            </span>
          </div>
          
          <div className="suggestion-explanation">
            <p className="explanation-text">{suggestion.explanation}</p>
            <p className="example-text">
              <strong>Esempio:</strong> {suggestion.example}
            </p>
          </div>
        </div>
        
        <div className="suggestion-actions">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🟢 CLICK PULSANTE ACCETTA - Suggerimento:', suggestion);
              console.log('🟢 Event object:', e);
              onAccept(suggestion);
            }}
            className="btn btn-success btn-sm"
            title="Accetta questo suggerimento"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <CheckCircle size={14} /> Accetta
          </button>
          

          
          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <button 
              onClick={() => onAlternative(suggestion)}
              className="btn btn-outline btn-sm"
              title="Vedi alternative"
            >
              <Info size={14} /> Alternative
            </button>
          )}
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🟡 CLICK PULSANTE RIFIUTA - Suggerimento:', suggestion);
              console.log('🟡 Event object:', e);
              onReject(suggestion);
            }}
            className="btn btn-danger btn-sm"
            title="Rifiuta questo suggerimento"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <X size={14} /> Rifiuta
          </button>
        </div>
      </div>
    );
  };

  // Componente per sezione suggerimenti migliorata
  const ImprovedSuggestionsSection = ({ suggestions, onAccept, onAlternative, onReject }) => {
    console.log('📋 RENDERING ImprovedSuggestionsSection');
    console.log('📋 Suggerimenti ricevuti:', Object.keys(suggestions));
    console.log('📋 Callbacks ricevuti:', { onAccept: !!onAccept, onAlternative: !!onAlternative, onReject: !!onReject });
    
    const groupedSuggestions = groupSuggestionsByCategory(suggestions);
    
    return (
      <div className="improved-suggestions-section">
        <div className="suggestions-header">
          <h3>🧠 Suggerimenti Intelligenti</h3>
          <p>Abbiamo analizzato le tue colonne e trovato {Object.keys(suggestions).length} possibili corrispondenze</p>
          <div className="suggestions-summary">
            <span className="summary-item">
              <CheckCircle size={16} color="#10B981" />
              {Object.values(suggestions).filter(s => s.confidence >= 85).length} alta confidenza
            </span>
            <span className="summary-item">
              <AlertTriangle size={16} color="#F59E0B" />
              {Object.values(suggestions).filter(s => s.confidence >= 75 && s.confidence < 85).length} media confidenza
            </span>
            <span className="summary-item">
              <Edit3 size={16} color="#3B82F6" />
              {Object.values(suggestions).filter(s => s.suggestedField.startsWith('custom.')).length} campi personalizzati
            </span>
          </div>
        </div>
        
        <div className="suggestions-categories">
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
            <div key={category} className="suggestion-category">
              <div className="category-header" style={{ borderLeftColor: getCategoryColor(category) }}>
                <h4>
                  {getCategoryIcon(category)} {category} 
                  <span className="category-count">({categorySuggestions.length})</span>
                </h4>
                <p className="category-description">
                  {category === 'Performance' && 'Metriche di prestazione fisica'}
                  {category === 'Fisiologico' && 'Dati cardiovascolari e fisiologici'}
                  {category === 'Temporale' && 'Informazioni su durata e date'}
                  {category === 'Identificazione' && 'Dati di identificazione giocatore'}
                  {category === 'Accelerazioni' && 'Metriche di accelerazione'}
                  {category === 'Decelerazioni' && 'Metriche di decelerazione'}
                  {category === 'Informazioni' && 'Informazioni aggiuntive sessione'}
                  {category === 'Campi Personalizzati' && 'Campi specifici da creare'}
                  {category === 'Non Riconosciuto' && 'Campi non riconosciuti automaticamente'}
                </p>
              </div>
              
              <div className="category-suggestions">
                {categorySuggestions.map(suggestion => (
                  <ImprovedSuggestionCard
                    key={suggestion.csvHeader}
                    suggestion={suggestion}
                    onAccept={onAccept}
                    onAlternative={onAlternative}
                    onReject={onReject}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================
  // STATES: LOADING / ERROR
  // =========================
  if (loading || externalLoading) {
    return (
      <div className="statistics-container">
        <div className="mapping-step-container loading">
          <div className="loading-content">
            <RefreshCw size={48} className="animate-spin" style={{ color: '#3B82F6' }} />
            <h3>🧠 Analisi Intelligente CSV</h3>
            <p>Sto analizzando le colonne e generando suggerimenti automatici...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !csvHeaders?.length) {
    return (
      <div className="statistics-container">
        <div className="mapping-step-container error">
          <div className="error-content">
            <XCircle size={48} color="#EF4444" />
            <h3>Errore Caricamento</h3>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={onBack} className="btn btn-secondary">Torna Indietro</button>
              <button onClick={loadSmartSuggestions} className="btn btn-primary">
                <RefreshCw size={16} /> Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="statistics-container">
      <div className="mapping-step-container">
        {/* Header */}
        <div className="mapping-step-header">
          <div className="header-main">
            <div className="header-title">
              <Lightbulb size={32} style={{ color: '#F59E0B' }} />
              <div>
                <h2>🎯 Mapping Colonne CSV</h2>
                <p>Associa ogni colonna del tuo file ai campi del database</p>
              </div>
            </div>

            <div className="progress-indicator">
              <div className="step completed">1</div>
              <div className="step-line" />
              <div className="step active">2</div>
              <div className="step-line" />
              <div className="step">3</div>
              <div className="step-labels">
                <span>Upload</span>
                <span>Mapping</span>
                <span>Anteprima</span>
              </div>
            </div>
          </div>

                     <div className="mapping-stats">
             <div className="stat-card">
               <div className="stat-value">{csvHeaders?.length || 0}</div>
               <div className="stat-label">Colonne CSV</div>
             </div>
             <div className="stat-card">
               <div className="stat-value">{Object.keys(fieldDefinitions).length}</div>
               <div className="stat-label">Campi DB</div>
             </div>
             <div className="stat-card success">
               <div className="stat-value">{validateMapping.totalMapped}</div>
               <div className="stat-label">Mappate</div>
             </div>
             <div className="stat-card">
               <div className="stat-value">
                 {Math.round(
                   Object.values(confidence).reduce((s, c) => s + c, 0) /
                   Math.max(Object.values(confidence).length, 1)
                 ) || 0}%
               </div>
               <div className="stat-label">Confidence</div>
             </div>
           </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mapping-warnings">
            <AlertTriangle size={20} color="#F59E0B" />
            <div className="warnings-content">
              <h4>⚠️ Attenzioni Rilevate</h4>
              <ul>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* 🔍 Validazione Set Minimo */}
        {minimumDataValidation && (
          <div className={`minimum-data-validation ${minimumDataValidation.isValid ? 'valid' : 'invalid'}`}>
            {minimumDataValidation.isValid ? (
              <CheckCircle size={20} color="#10B981" />
            ) : (
              <XCircle size={20} color="#EF4444" />
            )}
            <div className="validation-content">
              <h4>{minimumDataValidation.message}</h4>
              {!minimumDataValidation.isValid && minimumDataValidation.missingFields.length > 0 && (
                <div className="missing-fields">
                  <p>Colonne mancanti per il set minimo:</p>
                  <ul>
                    {minimumDataValidation.missingFields.map((field, index) => (
                      <li key={index}>
                        <strong>{field}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

                 {/* Suggerimenti Intelligenti */}
         {(() => {
           console.log('🔍 CONTROLLO CONDIZIONE SUGGERIMENTI');
           console.log('🔍 pendingSuggestions:', pendingSuggestions);
           console.log('🔍 Object.keys(pendingSuggestions):', Object.keys(pendingSuggestions));
           console.log('🔍 Object.keys(pendingSuggestions).length:', Object.keys(pendingSuggestions).length);
           console.log('🔍 Condizione è vera?', Object.keys(pendingSuggestions).length > 0);
           return Object.keys(pendingSuggestions).length > 0;
         })() && (
                       <ImprovedSuggestionsSection
              suggestions={pendingSuggestions}
              onAccept={acceptSuggestion}
              onAlternative={handleAlternative}
              onReject={rejectSuggestion}
            />
         )}

         {/* Obbligatori */}
         <div className="required-fields-status">
           <h3>📋 Campi Obbligatori</h3>
           <div className="required-grid">
             {MINIMUM_REQUIRED_FIELDS.map((field) => {
               const isMapped = Object.values(mapping).includes(field);
               const def = fieldDefinitions[field] || {};
               const Icon = def.icon || Info;
               const label = def.label || MINIMUM_FIELD_LABELS[field] || field;
               const color = def.color || '#3B82F6';
               return (
                 <div key={field} className={`required-field ${isMapped ? 'mapped' : 'missing'}`}>
                   <Icon size={16} color={color} />
                   <span>{label}</span>
                   {isMapped
                     ? <CheckCircle size={14} color="#10B981" />
                     : <XCircle size={14} color="#EF4444" />}
                 </div>
               );
             })}
           </div>
         </div>

        {/* 🎯 NUOVO LAYOUT MIGLIORATO - Mapping più leggibile */}
                 <div className="mapping-section">
           <div className="section-header">
             <h3>🔗 Associa Colonne</h3>
             <p>Per ogni campo del database, scegli la colonna CSV corrispondente (se presente)</p>
             {autoMappedFields.size > 0 && (
               <div className="auto-mapping-info">
                 <CheckCircle size={16} color="#10B981" />
                 <span>
                   {autoMappedFields.size} campo{autoMappedFields.size > 1 ? 'i' : ''} mappato{autoMappedFields.size > 1 ? 'i' : ''} automaticamente
                 </span>
               </div>
             )}
           </div>

                     <div className="mapping-grid-improved">
             {/* Mostra TUTTE le colonne del database, non solo quelle del CSV */}
             {Object.entries(fieldDefinitions).map(([fieldKey, fieldDef], idx) => {
               const Icon = fieldDef.icon;
               
               // Trova se questo campo è mappato a qualche colonna CSV
               const mappedFromCsv = Object.entries(mapping).find(([csvHeader, dbField]) => dbField === fieldKey);
               const csvHeader = mappedFromCsv ? mappedFromCsv[0] : null;
               const suggestion = csvHeader ? suggestions[csvHeader] : null;
               const conf = csvHeader ? (confidence[csvHeader] || 0) : 0;
               const confStyle = getConfidenceStyle(conf);

               // valore da mostrare nella select
               const currentValue = csvHeader || 'none';

               return (
                 <div key={`${fieldKey}-${idx}`} className="mapping-row-improved">
                   {/* Colonna CSV con confidence */}
                   <div className="csv-column-info">
                     <div className="csv-header-name">
                       {csvHeader ? (
                         <>
                           {csvHeader}
                           {(suggestion && conf >= 85) || autoMappedFields.has(fieldKey) ? (
                             <div className="auto-suggestion-badge">
                               <CheckCircle size={12} color="#10B981" />
                               <span>Auto</span>
                             </div>
                           ) : null}
                         </>
                       ) : (
                         <span className="no-csv-mapping">-- Nessuna colonna CSV --</span>
                       )}
                     </div>
                     {conf > 0 && (
                       <div className="confidence-indicator" style={{ backgroundColor: confStyle.bg }}>
                         <div
                           className="confidence-fill"
                           style={{ width: `${conf}%`, backgroundColor: confStyle.color }}
                         />
                         <span className="confidence-text" style={{ color: confStyle.color }}>
                           {conf}%
                         </span>
                       </div>
                     )}
                   </div>

                   {/* Freccia */}
                   <div className="mapping-arrow">
                     <ArrowRight size={20} color="#9CA3AF" />
                   </div>

                   {/* Campo DB con info inline - LAYOUT MIGLIORATO */}
                   <div className="db-field-container">
                     <div className="field-selector-row">
                       {/* Info campo selezionato ACCANTO alla select */}
                       <div className="field-info-inline">
                         <div className="field-selected-info">
                           <div className="field-main-info">
                             <Icon size={16} color={fieldDef.color} />
                             <span className="field-label-bold">{fieldDef.label}</span>
                             {fieldDef.required && <span className="required-star">*</span>}
                           </div>
                           <div className="field-description-inline">
                             {fieldDef.description}
                           </div>
                         </div>
                       </div>

                       {/* Select per scegliere la colonna CSV */}
                       <select
                         value={currentValue}
                         onChange={(e) => {
                           if (e.target.value === "none") {
                             // Rimuovi il mapping se esisteva
                             if (csvHeader) {
                               handleMappingChange(csvHeader, undefined);
                             }
                           } else {
                             // Aggiungi nuovo mapping o aggiorna esistente
                             if (csvHeader) {
                               // Rimuovi il mapping precedente
                               handleMappingChange(csvHeader, undefined);
                             }
                             // Aggiungi il nuovo mapping
                             handleMappingChange(e.target.value, fieldKey);
                           }
                         }}
                         className={`field-select-compact ${(currentValue === 'none') ? 'is-nomap' : ''}`}
                       >
                         <option value="none">-- Non mappare --</option>
                         
                         {/* Mostra tutte le colonne CSV disponibili */}
                         {csvHeaders?.map((header) => {
                           const hasSuggestion = suggestions[header] && 
                             !dismissedHeadersRef.current.has(normalizeHeader(header));
                           return (
                             <option key={header} value={header}>
                               {header} {hasSuggestion ? '💡' : ''}
                             </option>
                           );
                         })}
                       </select>
                     </div>

                     {/* Esempio sempre visibile */}
                     <div className="field-example-row">
                       <span className="example-label">Esempio:</span>
                       <span className="example-value">{fieldDef.example}</span>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Avanzate */}
        <div className="advanced-section">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
          >
            <Info size={16} />
            <span>Opzioni Avanzate</span>
            <ChevronDown
              size={16}
              style={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {showAdvanced && (
            <div className="advanced-content">
              <div className="field-reference">
                <h4>📚 Riferimento Campi</h4>
                <div className="field-grid">
                  {Object.entries(fieldDefinitions).map(([field, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={field} className="field-ref">
                        <div className="field-ref-header">
                          <Icon size={16} color={cfg.color} />
                          <span className="field-ref-name">{cfg.label}</span>
                          {cfg.required && <span className="required-mark">*</span>}
                          {hasSuggestionForField(field) && (
                            <span style={{ 
                              background: '#F59E0B', 
                              color: 'white', 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              marginLeft: '8px'
                            }}>
                              💡 Suggerito
                            </span>
                          )}
                        </div>
                        <div className="field-ref-description">{cfg.description}</div>
                        <div className="field-ref-example">Esempio: {cfg.example}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="mapping-actions">
                     <div className="actions-left">
             <button onClick={onBack} className="btn btn-secondary">← Indietro</button>
             <button onClick={loadSmartSuggestions} className="btn btn-outline">
               <RefreshCw size={16} /> Rianalizza
             </button>
             <button onClick={generateIntelligentSuggestions} className="btn btn-outline">
               <Lightbulb size={16} /> Rigenera Suggerimenti
             </button>
           </div>

          <div className="actions-right">
            <div className="validation-status">
              {validateMapping.isValid ? (
                <div className="status-valid">
                  <CheckCircle size={16} color="#10B981" />
                  <span>✅ Pronto per l'anteprima</span>
                </div>
              ) : (
                <div className="status-invalid">
                  <XCircle size={16} color="#EF4444" />
                  <span>❌ Mancano: {validateMapping.missingRequired.join(', ')}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              disabled={!validateMapping.isValid}
              className="btn btn-primary"
              title={!validateMapping.isValid ? 'Completa il mapping dei campi obbligatori' : "Procedi all'anteprima"}
            >
              Anteprima Dati
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingStep;