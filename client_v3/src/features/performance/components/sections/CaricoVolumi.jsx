// client/src/components/analytics/sections/CaricoVolumi.jsx
// 🎯 VERSIONE CORRETTA - Carico & Volumi con gestione date robusta

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList
} from 'recharts';
import { 
  BarChart3, 
  Calendar, 
  Target, 
  Users, 
  TrendingUp,
  Activity 
} from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

// =========================
// UTILITY FUNCTIONS
// =========================

// 🔧 FIX: Parsing date robusto con multiple fallback
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // Caso 1: '2025-07-01 00:00:00' (SQL timestamp)
    if (typeof dateStr === 'string' && dateStr.includes(' ')) {
      const dateOnly = dateStr.split(' ')[0];
      const date = new Date(dateOnly);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Caso 2: '2025-07-01' (ISO date)
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Caso 3: Date object già valido
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }
    
    // Caso 4: Timestamp numerico
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Caso 5: Tentativo generico
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
    
  } catch (error) {
    console.warn('⚠️ Errore parsing date:', dateStr, error);
    return null;
  }
};

// 🔧 FIX: Formattazione date sicura
const formatDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return 'Data Invalida';
  
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// 🔧 FIX: Formattazione date per assi (più compatta)
const formatDateAxis = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit'
  });
};

// 🔧 FIX: Chiave giorno per raggruppamento
const dayKey = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 🔧 FIX: Chiave settimana ISO robusta
const isoWeekKey = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return 'invalid-week';
  
  try {
    const year = date.getFullYear();
    const week = getISOWeek(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('⚠️ Errore calcolo settimana ISO:', dateStr, error);
    return 'invalid-week';
  }
};

// Calcola settimana ISO
const getISOWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Formattazione settimana
const formatWeek = (weekStr) => {
  const [year, week] = weekStr.split('-W');
  if (!year || !week) return weekStr;
  return `Set. ${week}/${year.slice(2)}`;
};

// 🔧 FIX: Distingue training_load vs player_load (sono metriche DIVERSE)
const getTrainingLoad = (session) => {
  // Priorità: training_load > (rpe * durata) > fallback su player_load
  if (session.training_load && session.training_load > 0) {
    return session.training_load;
  }
  if (session.rpe && session.duration_minutes) {
    return session.rpe * session.duration_minutes; // Session RPE
  }
  return session.player_load || 0; // Fallback
};

const getPlayerLoad = (session) => {
  // Player Load è sempre biomeccanico
  return session.player_load || 0;
};

// 🔧 FIX: Funzioni per dati aggregati dal backend
const getAggregatedTrainingLoad = (dayData) => {
  // Per dati aggregati, usa il campo già calcolato dal backend
  return dayData.totalTrainingLoad || dayData.playerLoad || 0;
};

const getAggregatedPlayerLoad = (dayData) => {
  // Per dati aggregati, usa il campo già calcolato dal backend
  return dayData.totalPlayerLoad || dayData.playerLoad || 0;
};

// 🔧 Backward compatibility
const effectiveTL = getTrainingLoad;

// Divisione sicura
const safeDiv = (a, b) => (b !== 0 && b != null) ? a / b : 0;

// =========================
// CALCOLO ACWR
// =========================

const calculateACWR = (playerSessions, targetDate = null) => {
  if (!playerSessions || playerSessions.length === 0) return 0;
  
  // 🔧 FIX: Filtra sessioni con date valide prima di calcolare ACWR
  const validSessions = playerSessions.filter(session => {
    const date = parseDate(session.session_date);
    return date !== null;
  });
  
  if (validSessions.length === 0) return 0;
  
  // Se non viene specificata una data target, usa la data più recente dai dati
  let target;
  if (targetDate) {
    target = parseDate(targetDate);
  } else {
    // 🔧 FIX: Trova la data più recente dalle sessioni con gestione sicura
    const validDates = validSessions
      .map(s => parseDate(s.session_date))
      .filter(d => d !== null)
      .sort((a, b) => b - a);
    
    target = validDates.length > 0 ? validDates[0] : new Date();
  }
  
  if (!target) return 0;
  
  const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
  const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  // 🔧 FIX: Sessioni ultimi 7 giorni (Acute) con date sicure
  const acuteSessions = validSessions.filter(session => {
    const sessionDate = parseDate(session.session_date);
    if (!sessionDate) return false;
    return sessionDate >= acute7Days && sessionDate <= target;
  });
  
  // 🔧 FIX: Sessioni ultimi 28 giorni (Chronic) con date sicure
  const chronicSessions = validSessions.filter(session => {
    const sessionDate = parseDate(session.session_date);
    if (!sessionDate) return false;
    return sessionDate >= chronic28Days && sessionDate <= target;
  });
  
  // 🔧 FIX: ACWR CORRETTO - SOMMA per acute, MEDIA SETTIMANALE per chronic
  const acuteLoad = acuteSessions.reduce((sum, s) => sum + getTrainingLoad(s), 0);
  const chronicLoad = chronicSessions.reduce((sum, s) => sum + getTrainingLoad(s), 0) / 4; // Media settimanale
  
  return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
};

// =========================
// DATA BUILDERS
// =========================

// 🔧 FIX: 1.a Trend Distanza nel Tempo con dati aggregati dal backend (vista standard)
function buildDistanceTrend(aggregatedData) {
  console.log('🟢 buildDistanceTrend: ricevuti dati già aggregati dal backend'); // INFO - rimuovere in produzione
  console.log('🔍 DEBUG buildDistanceTrend - Input completo:', {
    isArray: Array.isArray(aggregatedData),
    length: aggregatedData?.length,
    firstRecord: aggregatedData?.[0],
    sampleKeys: aggregatedData?.[0] ? Object.keys(aggregatedData[0]) : 'N/A'
  });
  
  if (!Array.isArray(aggregatedData)) {
    console.error('🔴 buildDistanceTrend: input non è array:', typeof aggregatedData);
    return [];
  }
  
  // 🔧 FIX: I dati sono GIÀ aggregati per data dal backend
  // Mappali solo al formato richiesto dal grafico
  const filtered = aggregatedData.filter(day => {
    const hasDate = day.dateFull || day.date || day.session_date;
    const hasDistance = (day.totalDistance || 0) > 0 || (day.total_distance_m || 0) > 0;
    
    if (!hasDate) {
      console.warn('⚠️ Giorno scartato per data mancante:', day);
      return false;
    }
    
    console.log('🔍 DEBUG record:', {
      dateFull: day.dateFull,
      date: day.date,
      totalDistance: day.totalDistance,
      total_distance_m: day.total_distance_m,
      hasDistance
    });
    
    return true; // Non filtrare per distanza, lascia che il grafico mostri anche 0
  });
  
  console.log('🟢 buildDistanceTrend: dopo filtro:', filtered.length, 'record');
  
  const sorted = filtered.sort((a, b) => {
    try {
      const dateA = new Date(a.dateFull || a.date || a.session_date);
      const dateB = new Date(b.dateFull || b.date || b.session_date);
      return dateA - dateB;
    } catch (error) {
      console.warn('⚠️ Errore ordinamento date:', error);
      return 0;
    }
  });
  
  const result = sorted.map(day => {
    const dateKey = day.dateFull || day.date || day.session_date;
    const distance = Math.round(day.totalDistance || day.total_distance_m || 0);
    
    return {
      date: dateKey, // Data per ordinamento
      fullDate: dateKey, // Chiave per l'asse X
      dateFormatted: day.dateFormatted || formatDate(dateKey),
      distance_m: distance, // Campo già aggregato dal backend
      sessions_count: day.sessionsCount || day.sessions?.length || 0, // Numero sessioni del giorno
      session_types: day.sessionTypes || 'N/A' // Tipologie sessioni
    };
  });
  
  console.log('🟢 buildDistanceTrend: risultato finale:', result.length, 'record');
  console.log('🔍 DEBUG primo record risultato:', result[0]);
  
  return result;
}

// 🔧 FIX: 1.b Trend Distanza nel Tempo in modalità COMPARE (multi-giocatore con sessioni RAW)
function buildDistanceTrendCompare(sessions, players, comparePlayerIds) {
  if (!Array.isArray(sessions) || sessions.length === 0 || !Array.isArray(comparePlayerIds) || comparePlayerIds.length === 0) {
    return [];
  }
  const dateMap = new Map();
  const idSet = new Set(comparePlayerIds.map(id => Number(id)));

  sessions.forEach(s => {
    const pid = Number(s.playerId);
    if (!idSet.has(pid)) return;
    const dateStr = s.session_date ? String(s.session_date).split(' ')[0] : null;
    if (!dateStr) return;

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, fullDate: dateStr });
    }
    const entry = dateMap.get(dateStr);
    const key = `player_${pid}`;
    entry[`${key}_distance_m`] = (entry[`${key}_distance_m`] || 0) + (Number(s.total_distance_m) || 0);
    const p = players?.find(p => p.id === pid);
    entry[`${key}_name`] = p ? `${p.firstName} ${p.lastName}` : `Player ${pid}`;
  });

  return Array.from(dateMap.values()).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
}

// 🔧 FIX: 2. Distanza Equivalente vs Reale con dati aggregati dal backend
function buildEqVsReal(aggregatedData) {
  console.log('🟢 buildEqVsReal: ricevuti dati già aggregati dal backend'); // INFO - rimuovere in produzione
  
  if (!Array.isArray(aggregatedData)) {
    console.error('🔴 buildEqVsReal: input non è array:', typeof aggregatedData);
    return [];
  }
  
  return aggregatedData
    .filter(day => day.dateFull && (day.totalDistance || day.equivalentDistance))
    .sort((a, b) => new Date(a.dateFull) - new Date(b.dateFull))
    .map(day => {
      const real = day.totalDistance || 0;
      const equivalent = day.equivalentDistance || 0;
      const eq_pct = real > 0 ? (equivalent / real) * 100 : 0;
      
      return {
        date: day.dateFull,
        fullDate: day.dateFull,
        dateFormatted: day.dateFormatted || formatDate(day.dateFull),
        real_m: Math.round(real),
        equivalent_m: Math.round(equivalent),
        eq_pct: eq_pct.toFixed(1),
        sessions_count: day.sessionsCount || 0
      };
    });
}

// 🔧 FIX: 3. Training Load Settimanale con dati aggregati (day-level)
function buildWeeklyLoad(aggregatedData, isCompareMode = false, players = []) {
  if (!Array.isArray(aggregatedData)) {
    console.error('🔴 buildWeeklyLoad: input non è array:', typeof aggregatedData);
    return [];
  }

  const byWeek = new Map();

  console.log('🟢 buildWeeklyLoad: calcolo TL settimanale da dati aggregati, modalità compare:', isCompareMode);

  aggregatedData.forEach(day => {
    const dateStr = day.dateFull || day.date || null;
    const weekKey = isoWeekKey(dateStr);
    if (weekKey === 'invalid-week') return;

    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, { week: weekKey, weekFormatted: formatWeek(weekKey), load_sum: 0 });
    }

    const weekData = byWeek.get(weekKey);
    const load = Number(day.playerLoad ?? day.totalPlayerLoad ?? day.totalTrainingLoad ?? 0) || 0;
    weekData.load_sum += load;
  });

  const result = Array.from(byWeek.values()).sort((a, b) => a.week.localeCompare(b.week));

  return result.map(week => ({
    week: week.week,
    weekFormatted: week.weekFormatted,
    load_sum: Math.round(week.load_sum || 0)
  }));
}

// 🔧 FIX: 4. ACWR per Giocatore con validazione e supporto dati backend
function buildACWRByPlayer(data, players) {
  if (!Array.isArray(data) || !Array.isArray(players)) {
    console.error('🔴 buildACWRByPlayer: input non validi:', { data: typeof data, players: typeof players });
    return [];
  }

  // 🔧 FIX: Controlla se i dati sono già ACWR calcolati dal backend
  if (data.length > 0) {
    const first = data[0];
    if (first.acwr !== undefined && first.playerId !== undefined && first.date !== undefined) {
      console.log('🟢 buildACWRByPlayer: ricevuti dati ACWR pre-calcolati dal backend');
      
      // Raggruppa per giocatore e prendi l'ACWR più recente
      const playerMap = new Map();
      
      data.forEach(item => {
        const playerId = Number(item.playerId);
        if (!playerMap.has(playerId) || new Date(item.date) > new Date(playerMap.get(playerId).date)) {
          playerMap.set(playerId, item);
        }
      });
      
      // Mappa ai giocatori
      const result = Array.from(playerMap.values()).map(item => {
        const player = players.find(p => p.id === item.playerId);
        const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${item.playerId}`;
        
        const acwr = item.acwr || 0;
        
        let status = 'normal';
        if (acwr === 0 || acwr === null) status = 'no-data';
        else if (acwr < 0.8) status = 'underload';
        else if (acwr > 1.3) status = 'overload';
        
        return {
          player: playerName,
          playerId: item.playerId,
          acwr: acwr ? acwr.toFixed(2) : '0.00',
          acwrNum: acwr || 0,
          status,
          date: item.date
        };
      });
      
      console.log('🟢 buildACWRByPlayer: processati', result.length, 'giocatori da dati backend');
      return result;
    }
  }

  // Fallback: calcolo client-side per dati legacy
  // Guard: se i dati sono aggregati per giorno, non abbiamo dettaglio per giocatore
  if (data.length > 0) {
    const first = data[0];
    const looksAggregated = !!first.dateFull || !('session_date' in first);
    if (looksAggregated) {
      console.warn('⚠️ buildACWRByPlayer: ricevuti dati aggregati (day-level). ACWR per giocatore richiede sessioni individuali.');
      return [];
    }
  }

  const playerMap = new Map();
  
  // 🔧 FIX: Filtra sessioni con date valide
  const validSessions = data.filter(s => {
    const date = parseDate(s.session_date);
    if (!date) {
      console.warn('⚠️ Sessione scartata per data invalida in ACWR:', s.session_date);
      return false;
    }
    return true;
  });
  
  console.log(`🟢 buildACWRByPlayer: ${validSessions.length}/${data.length} sessioni valide per ACWR`);
  
  // Raggruppa per giocatore
  validSessions.forEach(s => {
    const playerIdNum = parseInt(s.playerId, 10);
    if (!playerMap.has(playerIdNum)) {
      playerMap.set(playerIdNum, []);
    }
    playerMap.get(playerIdNum).push(s);
  });
  
  // Calcola ACWR per ogni giocatore
  const result = Array.from(playerMap.entries()).map(([playerId, playerSessions]) => {
    const player = players.find(p => p.id === playerId);
    const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`;
    
    const acwr = calculateACWR(playerSessions);
    
    let status = 'normal';
    if (acwr === 0) status = 'no-data';
    else if (acwr < 0.8) status = 'underload';
    else if (acwr > 1.3) status = 'overload';
    
    return {
      player: playerName,
      playerId,
      acwr: acwr.toFixed(2),
      acwrNum: acwr,
      status
    };
  });
  
  return result;
}

// 5. Distribuzione Carico per Tipologia (dati aggregati)
function buildLoadByTypology(aggregatedData) {
  if (!Array.isArray(aggregatedData)) {
    console.error('🔴 buildLoadByTypology: input non è array:', typeof aggregatedData);
    return [];
  }

  const typeMap = new Map();

  aggregatedData.forEach(day => {
    const rawTypes = typeof day.sessionTypes === 'string' && day.sessionTypes
      ? day.sessionTypes.split(',').map(t => t.trim()).filter(Boolean)
      : ['Altro'];
    const load = Number(day.playerLoad ?? day.totalPlayerLoad ?? day.totalTrainingLoad ?? 0) || 0;
    const perType = rawTypes.length > 0 ? load / rawTypes.length : load;

    rawTypes.forEach(type => {
      const current = typeMap.get(type) || 0;
      typeMap.set(type, current + perType);
    });
  });

  const total = Array.from(typeMap.values()).reduce((sum, v) => sum + v, 0);

  return Array.from(typeMap.entries())
    .map(([typology, load_sum]) => ({
      typology,
      load_sum: Math.round(load_sum),
      pct: total > 0 ? (load_sum / total) * 100 : 0
    }))
    .sort((a, b) => b.load_sum - a.load_sum);
}

// =========================
// COMPONENT
// =========================

const CaricoVolumi = ({ data, players, filters, viewMode = 'charts', ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 CaricoVolumi - Props ricevute:', { 
    dataLength: data?.length || 0, 
    dataType: typeof data, 
    isArray: Array.isArray(data), 
    playersLength: players?.length || 0, 
    firstDataRecord: data?.[0] || 'N/A', 
    sampleData: Array.isArray(data) ? data.slice(0, 2) : 'N/A' 
  });

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = viewMode === 'compare' || props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🟡 CaricoVolumi: modalità', isCompareMode ? 'COMPARE' : 'STANDARD', 'con', comparePlayerIds.length, 'giocatori evidenziati');

  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e'
  };

  // Rileva se i dati sono aggregati (day-level)
  const isAggregatedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return !!first?.dateFull || !('session_date' in first);
  }, [data]);

  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: CaricoVolumi riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <BarChart3 size={20} />
              Carico & Volumi
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <BarChart3 size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // =========================
  // DATA PROCESSING
  // =========================

  const distanceTrendData = useMemo(() => {
    console.log('🟡 Calculating distanceTrendData...');
    if (!data?.length) return [];
    // Modalità compare: costruisci serie per giocatore da sessioni RAW
    if (props.mode === 'compare' && Array.isArray(props.comparePlayerIds) && props.comparePlayerIds.length > 0) {
      const result = buildDistanceTrendCompare(data, players, props.comparePlayerIds);
      console.log('🟢 distanceTrendData (compare) calculated:', result.length, 'records');
      return result;
    }
    const result = buildDistanceTrend(data);
    console.log('🟢 distanceTrendData calculated:', result.length, 'records');
    return result;
  }, [data, props.mode, props.comparePlayerIds, players]);

  const equivalentDistanceData = useMemo(() => {
    console.log('🟡 Calculating equivalentDistanceData...');
    if (!data?.length) return [];
    const result = buildEqVsReal(data);
    console.log('🟢 equivalentDistanceData calculated:', result.length, 'records');
    return result;
  }, [data]);

  const weeklyLoadData = useMemo(() => {
    console.log('🟡 Calculating weeklyLoadData...');
    if (!data?.length) return [];
    const result = buildWeeklyLoad(data, isCompareMode, players);
    console.log('🟢 weeklyLoadData calculated:', result.length, 'records');
    return result;
  }, [data, isCompareMode, players]);

  const acwrData = useMemo(() => {
    console.log('🟡 ACWR temporaneamente disabilitato - grafico in costruzione');
    return [];
  }, []);

  const loadDistributionData = useMemo(() => {
    console.log('🟡 Calculating loadDistributionData...');
    if (!data?.length) return [];
    const result = buildLoadByTypology(data);
    console.log('🟢 loadDistributionData calculated:', result.length, 'records');
    return result;
  }, [data]);

  // 🔧 FIX: Player count dopo il filtro (coerenza con le medie)
  const { uniquePlayersFiltered, playerCount, sessionCount, sessionTypes } = useMemo(() => {
    if (!data?.length) return { uniquePlayersFiltered: new Set(), playerCount: 0, sessionCount: 0, sessionTypes: '' };
    
    const filteredSessions = data; // I dati sono già filtrati dall'API
    const uniquePlayersFiltered = new Set(filteredSessions.map(s => s.playerId ?? s.player_id));
    const playerCount = uniquePlayersFiltered.size;
    const sessionCount = filteredSessions.length;
    const sessionTypes = [...new Set(filteredSessions.map(s => s.session_type).filter(Boolean))].join(', ');
    
    return { uniquePlayersFiltered, playerCount, sessionCount, sessionTypes };
  }, [data]);

  // =========================
  // CUSTOM COMPONENTS
  // =========================

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <p className="tooltip-label" style={{ 
            margin: '0 0 8px 0', 
            fontWeight: '600',
            borderBottom: '1px solid #555',
            paddingBottom: '4px'
          }}>
            {formatDate(label) || label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '4px 0',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: '600' }}>{entry.value}</span>
            </p>
          ))}
          {payload[0]?.payload?.sessions_count && (
            <p style={{ 
              fontSize: '12px', 
              color: '#ccc', 
              marginTop: '8px',
              borderTop: '1px solid #555',
              paddingTop: '4px'
            }}>
              {`${payload[0].payload.sessions_count} sessioni aggregate per questa giornata`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================
  // RENDER CHARTS
  // =========================

  const renderDistanceTrendChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp size={20} />
          <h3>Trend Distanza nel Tempo</h3>
        </div>
        <div className="chart-actions">
          <button 
            className="btn-secondary"
            onClick={() => handleExport(distanceTrendData, 'trend_distanza', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
      </div>
      <div className="chart-content">
        {distanceTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={distanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fullDate"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={formatDateAxis}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={formatDate}
                content={<CustomTooltip />} 
              />
              <Legend />
              {props.mode === 'compare' && Array.isArray(props.comparePlayerIds) && props.comparePlayerIds.length > 0 ? (
                props.comparePlayerIds.map((pid, index) => {
                  const key = `player_${pid}_distance_m`;
                  const p = players.find(pl => pl.id === pid);
                  const name = p ? `${p.firstName} ${p.lastName}` : `Player ${pid}`;
                  const colorPalette = [colors.primary, colors.secondary, colors.warning, colors.danger, colors.success, '#8B5CF6', '#06B6D4', '#EC4899'];
                  const stroke = colorPalette[index % colorPalette.length];
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={stroke}
                      strokeWidth={2}
                      dot={{ r: 3, fill: stroke }}
                      name={name}
                    />
                  );
                })
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="distance_m" 
                  stroke={colors.primary} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Distanza (m)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <TrendingUp size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distanza per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEquivalentDistanceChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <BarChart3 size={20} />
          <h3>Distanza Equivalente vs Reale</h3>
        </div>
        <div className="chart-actions">
          <button 
            className="btn-secondary"
            onClick={() => handleExport(equivalentDistanceData, 'distanza_equivalente_vs_reale', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
      </div>
      <div className="chart-content">
        {equivalentDistanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={equivalentDistanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fullDate"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={formatDateAxis}
              />
              <YAxis yAxisId="distance" />
              <Tooltip 
                labelFormatter={formatDate}
                content={<CustomTooltip />} 
              />
              <Legend />
              <Bar yAxisId="distance" dataKey="real_m" fill={colors.primary} name="Reale (m)" />
              <Bar yAxisId="distance" dataKey="equivalent_m" fill={colors.secondary} name="Equivalente (m)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <BarChart3 size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distanza equivalente per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWeeklyLoadChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Calendar size={20} />
          <h3>Training Load Settimanale</h3>
        </div>
        <div className="chart-actions">
          <button 
            className="btn-secondary"
            onClick={() => handleExport(weeklyLoadData, 'training_load_settimanale', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
      </div>
      <div className="chart-content">
        {weeklyLoadData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyLoadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="weekFormatted" 
                stroke="var(--text-secondary)"
                fontSize={11}
              />
              <YAxis stroke="var(--text-secondary)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              
              {/* Modalità Standard: Una linea totale */}
              {!isCompareMode && (
                <Line 
                  type="monotone" 
                  dataKey="load_sum" 
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={{ r: 4, fill: colors.primary }}
                  name="Training Load Totale"
                />
              )}
              
              {/* Modalità Compare: Una linea per ogni giocatore */}
              {isCompareMode && players && players.map((player, index) => {
                const playerKey = `player_${player.id}`;
                const playerColor = [colors.primary, colors.secondary, colors.warning, colors.danger, colors.success, '#8B5CF6', '#EC4899', '#6366F1'][index % 8];
                
                return (
                  <Line
                    key={playerKey}
                    type="monotone"
                    dataKey={playerKey}
                    stroke={playerColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: playerColor }}
                    name={`${player.firstName} ${player.lastName}`}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Calendar size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di training load per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderACWRChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Target size={20} />
          <h3>ACWR per Giocatore</h3>
        </div>
        <div className="chart-actions">
          <button 
            className="btn-secondary"
            onClick={() => handleExport(acwrData, 'acwr_per_giocatore', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
      </div>
      <div className="chart-content">
        {acwrData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={acwrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="player" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0.8} stroke={colors.warning} strokeDasharray="5 5" label="Min" />
              <ReferenceLine y={1.3} stroke={colors.danger} strokeDasharray="5 5" label="Max" />
              <Bar 
                dataKey="acwrNum" 
                name="ACWR"
              >
                {acwrData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.status === 'overload' ? colors.danger :
                      entry.status === 'underload' ? colors.warning :
                      entry.status === 'no-data' ? '#9ca3af' :
                      colors.success
                    }
                  />
                ))}
                <LabelList 
                  dataKey="acwrNum" 
                  position="top" 
                  formatter={(value) => value.toFixed(2)}
                  style={{ fontSize: '12px', fontWeight: '600', fill: '#333' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Target size={48} />
            <h3>Grafico in costruzione</h3>
            <p>Stiamo lavorando per migliorare questo grafico. Sarà disponibile presto!</p>
          </div>
        )}
      </div>
      <div className="chart-legend" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="legend-color" style={{ 
            backgroundColor: colors.success, 
            width: '16px', 
            height: '16px', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Normale (0.8-1.3)</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="legend-color" style={{ 
            backgroundColor: colors.warning, 
            width: '16px', 
            height: '16px', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Sottocarico (&lt;0.8)</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="legend-color" style={{ 
            backgroundColor: colors.danger, 
            width: '16px', 
            height: '16px', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Sovraccarico (&gt;1.3)</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="legend-color" style={{ 
            backgroundColor: '#9ca3af', 
            width: '16px', 
            height: '16px', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Dati insufficienti</span>
        </div>
      </div>
    </div>
  );

  const renderLoadDistributionChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Users size={20} />
          <h3>Distribuzione Carico per Tipologia</h3>
        </div>
        <div className="chart-actions">
          <button 
            className="btn-secondary"
            onClick={() => handleExport(loadDistributionData, 'distribuzione_carico_tipologia', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
      </div>
      <div className="chart-content">
        {loadDistributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loadDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="load_sum"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {loadDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Users size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distribuzione carico per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  // =========================
  // RENDER VIEWS
  // =========================

  const renderCompactView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi - Vista Compatta</h2>
        <p>KPI principali e statistiche essenziali</p>
      </div>

      <div className="compact-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{data?.length || 0}</div>
          <div className="kpi-label">Sessioni Totali</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + (Number(s.total_distance_m) || 0), 0) / 1000) : 0} km
          </div>
          <div className="kpi-label">Distanza Totale</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0)) : 0} min
          </div>
          <div className="kpi-label">Tempo Totale</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + (Number(s.training_load || s.player_load) || 0), 0)) : 0}
          </div>
          <div className="kpi-label">Training Load Totale</div>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi - Vista Tabellare</h2>
        <p>Dati grezzi in formato tabella</p>
      </div>

      <div className="table-container">
        <table className="table data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Giocatore</th>
              <th>Tipo</th>
              <th>Distanza (m)</th>
              <th>Durata (min)</th>
              <th>Training Load</th>
              <th>Distanza Equiv. (m)</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((session, index) => {
              const player = players?.find(p => p.id === session.playerId);
              return (
                <tr key={index}>
                  <td>{formatDate(session.session_date)}</td>
                  <td>{player ? `${player.firstName} ${player.lastName}` : 'N/A'}</td>
                  <td>{session.session_type || 'N/A'}</td>
                  <td>{Number(session.total_distance_m) || 0}</td>
                  <td>{session.duration_minutes || 0}</td>
                  <td>{Math.round(effectiveTL(session))}</td>
                  <td>{session.equivalent_distance_m || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChartsView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi</h2>
        <p>Analisi del carico di lavoro e dei volumi di allenamento</p>
      </div>

      <div className="charts-grid">
        {renderDistanceTrendChart()}
        {renderEquivalentDistanceChart()}
        {renderWeeklyLoadChart()}
        {renderACWRChart()}
        {renderLoadDistributionChart()}
      </div>
    </div>
  );

  // =========================
  // MAIN RENDER
  // =========================

  return (
    <>
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'charts' && renderChartsView()}
      
      <ExportModal
        show={showExportModal}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onConfirm={handleExportConfirm}
        onCancel={handleExportCancel}
      />
    </>
  );
};

export default CaricoVolumi;