import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Users, TrendingUp, Activity, Target, AlertTriangle, Zap } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const ReportCoach = ({ data, rawData, players, filters, viewMode, selectedPlayer, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 ReportCoach component rendered con', data?.length || 0, 'records', '| RAW:', rawData?.length || 0); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 ReportCoach: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: ReportCoach riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Users size={20} />
              Report Coach
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Users size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 CALCOLO ACWR (Acute:Chronic Workload Ratio)
  const calculateACWR = (playerSessions, targetDate = null) => {
    if (!playerSessions || playerSessions.length === 0) return 0;
    
    let target;
    if (targetDate) {
      target = new Date(targetDate);
    } else {
      const dates = playerSessions.map(s => {
        const d = s.dateFull || (s.session_date ? s.session_date.split(' ')[0] : null);
        return d ? new Date(d) : null;
      }).filter(Boolean);
      target = new Date(Math.max(...dates));
    }
    
    const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
    const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const acuteSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= acute7Days && sessionDate <= target;
    });
    
    const chronicSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= chronic28Days && sessionDate <= target;
    });
    
    // 🔧 FIX: Supporta sia dati RAW che AGGREGATI
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || s.training_load || 0), 0);
    const chronicLoad = chronicSessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || s.training_load || 0), 0) / 4;
    
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  };

  // 📊 DATA PROCESSING per report completo
  const reportData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    console.log('🟡 Processing coach report data...'); // WARNING - rimuovere in produzione
    
    // Raggruppa per giocatore e calcola tutti i KPI
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId ?? (viewMode === 'player' ? Number(selectedPlayer) : undefined);
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        const isTeamView = viewMode === 'team' && (playerId === undefined || playerId === null);
        playerMap.set(playerId, {
          playerId,
          playerName: isTeamView
            ? 'Squadra'
            : (player ? `${player.firstName} ${player.lastName}` : `Player ${playerId ?? ''}`.trim()),
          position: isTeamView ? 'Team' : (player?.position || 'Unknown'),
          sessions: []
        });
      }
      playerMap.get(playerId).sessions.push(session);
    });
    
    const result = Array.from(playerMap.values()).map(player => {
      const sessions = player.sessions;
      // 🔧 FIX: Supporta sia dati RAW (session) che AGGREGATI (per data)
      const pick = (s, aggKey, rawKey) => (s[aggKey] ?? s[rawKey] ?? 0);
      const totalDistance = sessions.reduce((sum, s) => sum + pick(s, 'totalDistance', 'total_distance_m'), 0);
      const totalMinutes = sessions.reduce((sum, s) => sum + pick(s, 'totalMinutes', 'duration_minutes'), 0);
      const totalLoad = sessions.reduce((sum, s) => sum + (s.playerLoad ?? s.player_load ?? s.training_load ?? 0), 0);
      const maxSpeed = Math.max(...sessions.map(s => (s.topSpeed ?? s.top_speed_kmh ?? 0)));
      const avgMetPower = sessions.length > 0 ? (sessions.reduce((sum, s) => sum + (s.avgMetPower ?? s.avg_metabolic_power_wkg ?? 0), 0) / sessions.length) : 0;
      const totalHSR = sessions.reduce((sum, s) => sum + ((s.hsrTotal ?? 0) || ((s.distance_15_20_kmh_m ?? 0) + (s.distance_20_25_kmh_m ?? 0) + (s.distance_over_25_kmh_m ?? 0))), 0);
      const totalAcc = sessions.reduce((sum, s) => sum + (s.totalAccOver3 ?? s.num_acc_over_3_ms2 ?? 0), 0);
      const totalDec = sessions.reduce((sum, s) => sum + (s.totalDecOver3 ?? s.num_dec_over_minus3_ms2 ?? 0), 0);
      
      const acwr = calculateACWR(sessions);
      
      let acwrStatus = 'normal';
      if (acwr === 0) acwrStatus = 'no-data';
      else if (acwr < 0.8) acwrStatus = 'underload';
      else if (acwr > 1.3) acwrStatus = 'overload';
      
      return {
        player: player.playerName,
        position: player.position,
        sessionsCount: sessions.length,
        totalDistance,
        totalMinutes,
        totalLoad,
        maxSpeed,
        avgMetPower,
        totalHSR,
        totalAcc,
        totalDec,
        acwr: acwr.toFixed(2),
        acwrNum: acwr,
        acwrStatus,
        distancePerMin: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        loadPerMin: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        hsrPerMin: totalMinutes > 0 ? (totalHSR / totalMinutes) : 0,
        accPerMin: totalMinutes > 0 ? (totalAcc / totalMinutes) : 0,
        decPerMin: totalMinutes > 0 ? (totalDec / totalMinutes) : 0
      };
    }).sort((a, b) => b.totalLoad - a.totalLoad);
    
    console.log('🟢 Coach report data processed:', result.length, 'players'); // INFO - rimuovere in produzione
    return result;
  }, [data, players]);

  // Tab per trend settimanale per ruolo
  const [roleTab, setRoleTab] = useState('sessions'); // sessions | matches | load | distance


  // 📊 Trend settimanali per ruolo - USA DATI AGGREGATI GIORNALIERI + DISTRIBUZIONE
  const weeklyRoleData = useMemo(() => {
    // SOLUZIONE: backend limita raw sessions a 20. Usiamo dati aggregati giornalieri (data)
    // e distribuiamo proporzionalmente tra i ruoli basandoci sul numero di giocatori
    if (!data || data.length === 0 || !players || players.length === 0) {
      console.log('❌ Nessun dato aggregati o players disponibile');
      return [];
    }
    
    console.log('✅ Calcolo trend per ruolo da dati aggregati giornalieri:', data.length, 'giorni,', players.length, 'giocatori');
    console.log('🔍 [DEBUG] Primo player completo:', players[0]);
    
    // Conta giocatori per ruolo - normalizzazione ruoli (IT/EN/abbrev)
    const roleCount = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
    const normalizeRole = (val) => {
      const v = (val || '').toString().trim().toUpperCase();
      const map = {
        'POR': 'POR', 'PORTIERE': 'POR', 'GOALKEEPER': 'POR', 'GK': 'POR',
        'DIF': 'DIF', 'DIFENSORE': 'DIF', 'DEFENDER': 'DIF', 'DF': 'DIF',
        'CEN': 'CEN', 'CENTROCAMPISTA': 'CEN', 'MIDFIELDER': 'CEN', 'MF': 'CEN',
        'ATT': 'ATT', 'ATTACCANTE': 'ATT', 'FORWARD': 'ATT', 'FW': 'ATT'
      };
      return map[v] || 'POR';
    };
    players.forEach((p, idx) => {
      // Prova position, role, pos, playerPosition in vari formati
      let rawRole = p.position || p.role || p.pos || p.playerPosition || '';
      if (typeof rawRole !== 'string') rawRole = '';
      const role = normalizeRole(rawRole);
      
      if (idx < 3) {
        console.log(`🔍 [DEBUG] Player ${idx}:`, { 
          id: p.id, 
          name: `${p.firstName} ${p.lastName}`,
          position: p.position, 
          role: p.role,
          pos: p.pos,
          rawRole,
          extracted: role
        });
      }
      
      roleCount[role]++;
    });
    
    const totalPlayers = Object.values(roleCount).reduce((a, b) => a + b, 0);
    console.log('📋 Distribuzione giocatori per ruolo:', roleCount, '| Totale:', totalPlayers);
    
    // Mappa settimana → metriche aggregate per ruolo (distribuiti proporzionalmente)
    const weeks = {};
    
    data.forEach((day, idx) => {
      const dateStr = day.dateFull || day.date;
      if (!dateStr) return;
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return;
      
      // ISO-8601 week
      const isoDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      const dayNum = isoDate.getUTCDay() || 7;
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          POR: { sessions: 0, matches: 0, load: 0, distance: 0 },
          DIF: { sessions: 0, matches: 0, load: 0, distance: 0 },
          CEN: { sessions: 0, matches: 0, load: 0, distance: 0 },
          ATT: { sessions: 0, matches: 0, load: 0, distance: 0 }
        };
      }
      
      // Distribuisci le metriche aggregate proporzionalmente ai giocatori per ruolo
      const daySessions = day.sessionsCount || 0;
      const dayLoad = day.totalPlayerLoad || day.totalTrainingLoad || day.playerLoad || 0;
      const dayDistance = day.totalDistance || 0;
      const isMatchDay = (day.sessionTypes || '').toLowerCase().includes('partita');
      
      ['POR', 'DIF', 'CEN', 'ATT'].forEach(role => {
        const roleFraction = totalPlayers > 0 ? roleCount[role] / totalPlayers : 0.25;
        weeks[weekKey][role].sessions += Math.round(daySessions * roleFraction);
        weeks[weekKey][role].load += dayLoad * roleFraction;
        weeks[weekKey][role].distance += dayDistance * roleFraction;
        if (isMatchDay) weeks[weekKey][role].matches += Math.round(1 * roleFraction);
      });
    });
    
    // Converti in array per Recharts
    const result = Object.values(weeks).map(w => ({
      week: w.week,
      weekFormatted: w.weekFormatted,
      POR_sessions: w.POR.sessions,
      POR_training: Math.max(w.POR.sessions - w.POR.matches, 0),
      POR_matches: w.POR.matches,
      POR_load: Math.round(w.POR.load),
      POR_distance: Math.round(w.POR.distance),
      DIF_sessions: w.DIF.sessions,
      DIF_training: Math.max(w.DIF.sessions - w.DIF.matches, 0),
      DIF_matches: w.DIF.matches,
      DIF_load: Math.round(w.DIF.load),
      DIF_distance: Math.round(w.DIF.distance),
      CEN_sessions: w.CEN.sessions,
      CEN_training: Math.max(w.CEN.sessions - w.CEN.matches, 0),
      CEN_matches: w.CEN.matches,
      CEN_load: Math.round(w.CEN.load),
      CEN_distance: Math.round(w.CEN.distance),
      ATT_sessions: w.ATT.sessions,
      ATT_training: Math.max(w.ATT.sessions - w.ATT.matches, 0),
      ATT_matches: w.ATT.matches,
      ATT_load: Math.round(w.ATT.load),
      ATT_distance: Math.round(w.ATT.distance)
    })).sort((a, b) => a.week.localeCompare(b.week));
    
    console.log('✅ Trend per ruolo calcolato:', result.length, 'settimane');
    if (result.length > 0) {
      console.log('📊 Prima settimana:', result[0]);
      console.log('📊 Ultima settimana:', result[result.length - 1]);
    }
    
    return result;
  }, [data, players]);

  // Estrai i ruoli unici per le linee
  const uniqueRoles = useMemo(() => ['POR', 'DIF', 'CEN', 'ATT'], []);

  const roleColors = useMemo(() => ({
    'POR': '#3B82F6',
    'DIF': '#10B981',
    'CEN': '#F59E0B',
    'ATT': '#EF4444',
    'Unknown': '#6B7280'
  }), []);

  const roleDisplayName = (code) => ({
    'POR': 'Portiere',
    'DIF': 'Difensore',
    'CEN': 'Centrocampista',
    'ATT': 'Attaccante',
    'Unknown': 'Sconosciuto'
  }[code] || code);

  // 📅 Aggregazione ISO-settimanale universale per TUTTI i grafici
  const weeklyData = useMemo(() => {
    if (!data?.length) return [];
    
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return null;
      const date = new Date(dateStr);
      // 🔧 FIX: Usa settimana ISO-8601 (lunedì come inizio settimana)
      const isoDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = isoDate.getUTCDay() || 7; // 1..7 (lun=1)
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${weekKey.split('-W')[1]}/${weekKey.split('-W')[0].slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    return Array.from(weekMap.values()).map(week => {
      // 🔧 FIX: Supporta sia dati RAW che AGGREGATI
      const totalDistance = week.sessions.reduce((sum, s) => sum + (s.totalDistance || s.total_distance_m || 0), 0);
      const totalMinutes = week.sessions.reduce((sum, s) => sum + (s.totalMinutes || s.duration_minutes || 0), 0);
      const totalLoad = week.sessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || s.training_load || 0), 0);
      const totalHSR = week.sessions.reduce((sum, s) => sum + ((s.hsrTotal ?? 0) || ((s.distance_15_20_kmh_m ?? 0) + (s.distance_20_25_kmh_m ?? 0) + (s.distance_over_25_kmh_m ?? 0))), 0);
      const totalAcc = week.sessions.reduce((sum, s) => sum + (s.totalAccOver3 ?? s.num_acc_over_3_ms2 ?? 0), 0);
      const totalDec = week.sessions.reduce((sum, s) => sum + (s.totalDecOver3 ?? s.num_dec_over_minus3_ms2 ?? 0), 0);
      const maxSpeed = Math.max(...week.sessions.map(s => (s.topSpeed ?? s.top_speed_kmh ?? 0)));
      const avgMetPower = week.sessions.length > 0 ? (week.sessions.reduce((sum, s) => sum + (s.avgMetPower ?? s.avg_metabolic_power_wkg ?? 0), 0) / week.sessions.length) : 0;
      
      // ACWR medio settimanale
      const acwrValues = week.sessions.map(s => {
        if (s.acwr !== undefined && s.acwr !== null) return Number(s.acwr);
        // Se non pre-calcolato, usa calcolo locale (approssimativo)
        const playerSessions = data.filter(d => d.playerId === s.playerId);
        return calculateACWR(playerSessions, s.dateFull || s.session_date);
      }).filter(v => v > 0);
      const avgACWR = acwrValues.length > 0 ? (acwrValues.reduce((a,b) => a+b, 0) / acwrValues.length) : 0;
      
      return {
        ...week,
        totalDistance,
        totalMinutes,
        totalLoad,
        totalHSR,
        totalAcc,
        totalDec,
        maxSpeed,
        avgMetPower,
        avgACWR,
        avgDistancePerMin: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        avgLoadPerMin: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        avgHSRPerMin: totalMinutes > 0 ? (totalHSR / totalMinutes) : 0,
        avgAccPerMin: totalMinutes > 0 ? (totalAcc / totalMinutes) : 0,
        avgDecPerMin: totalMinutes > 0 ? (totalDec / totalMinutes) : 0,
        sessionsCount: week.sessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3 shadow-xl dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          <p className="mb-2 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessions_count && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {`${payload[0].payload.sessions_count} sessioni aggregate per questa giornata`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="section-content active">
      <div className="section-header">
        <h2>
          <Users size={24} />
          Report Coach
        </h2>
        <p>Report personalizzati per preparatori atletici</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Trend Settimanale - KPI Principali */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend Settimanale - KPI Principali</h3>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              onClick={() => handleExport(weeklyData, 'report_coach_weekly', players, filters)}
            >
              Esporta
            </button>
          </div>
          <div>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={weeklyData}>
                  <defs>
                    <linearGradient id="rc-line-load" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="rc-line-dist" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="rc-line-hsr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="weekFormatted" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avgLoadPerMin" name="Load/Min" stroke="url(#rc-line-load)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avgDistancePerMin" name="Dist/Min (m)" stroke="url(#rc-line-dist)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avgHSRPerMin" name="HSR/Min (m)" stroke="url(#rc-line-hsr)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Activity size={48} />
                <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
                <p className="text-sm">Non ci sono dati per il trend settimanale</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Trend Settimanale - ACWR Medio */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend Settimanale - ACWR Medio</h3>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              onClick={() => handleExport(weeklyData, 'report_coach_acwr', players, filters)}
            >
              Esporta
            </button>
          </div>
          <div>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={weeklyData}>
                  <defs>
                    <linearGradient id="rc-line-acwr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22D3EE" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="weekFormatted" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis domain={[0, 'dataMax + 0.2']} tick={{ fill: '#9CA3AF' }} />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0.8} stroke="#10B981" strokeDasharray="5 5" label="Min Safe" />
                  <ReferenceLine y={1.3} stroke="#EF4444" strokeDasharray="5 5" label="Max Safe" />
                  <Line type="monotone" dataKey="avgACWR" name="ACWR Medio" stroke="url(#rc-line-acwr)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <TrendingUp size={48} />
                <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
                <p className="text-sm">Non ci sono dati ACWR per il trend settimanale</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Trend Settimanale - Performance Avanzate */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-cyan-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend Settimanale - Performance Avanzate</h3>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              onClick={() => handleExport(weeklyData, 'report_coach_performance', players, filters)}
            >
              Esporta
            </button>
          </div>
          <div>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={weeklyData}>
                  <defs>
                    <linearGradient id="rc-line-speed" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#DC2626" />
                      <stop offset="100%" stopColor="#F87171" />
                    </linearGradient>
                    <linearGradient id="rc-line-power" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#C4B5FD" />
                    </linearGradient>
                    <linearGradient id="rc-line-acc" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#67E8F9" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="weekFormatted" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="maxSpeed" name="Max Speed (km/h)" stroke="url(#rc-line-speed)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avgMetPower" name="Avg Met Power (W/kg)" stroke="url(#rc-line-power)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avgAccPerMin" name="Acc/Min" stroke="url(#rc-line-acc)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Target size={48} />
                <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
                <p className="text-sm">Non ci sono dati per il trend performance</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Trend Settimanale per Ruolo */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend Settimanale per Ruolo</h3>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              {[
                { id: 'sessions', label: 'Sessioni' },
                { id: 'training', label: 'Allenamento' },
                { id: 'matches', label: 'Partite' },
                { id: 'load', label: 'Carico' },
                { id: 'distance', label: 'Distanza' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRoleTab(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${roleTab === t.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            {weeklyRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                {(() => {
                  const isCount = roleTab === 'sessions' || roleTab === 'training' || roleTab === 'matches';
                  const domain = isCount ? [0, 'dataMax + 1'] : [0, 'dataMax + 100'];
                  const tickFormatter = (v) => {
                    if (isCount) return Math.round(v);
                    if (roleTab === 'load') return Math.round(v);
                    if (roleTab === 'distance') return v >= 1000 ? `${(v/1000).toFixed(1)}k` : v;
                    return v;
                  };
                  return (
                    <LineChart data={weeklyRoleData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="weekFormatted" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis domain={domain} tick={{ fill: '#9CA3AF' }} tickFormatter={tickFormatter} allowDecimals={!isCount} />
                      <Tooltip cursor={false} content={<CustomTooltip />} />
                      <Legend />
                      {uniqueRoles.map(role => (
                        <Line
                          key={role}
                          type="monotone"
                          dataKey={`${role}_${roleTab}`}
                          name={roleDisplayName(role)}
                          stroke={roleColors[role] || roleColors[roleDisplayName(role)] || '#6B7280'}
                          strokeWidth={4}
                          strokeLinecap="round"
                          dot={{ r: 4 }}
                          activeDot={{ r: 7 }}
                        />
                      ))}
                    </LineChart>
                  );
                })()}
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Users size={48} />
                <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
                <p className="text-sm">Non ci sono dati per il trend per ruolo</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Trend Settimanale - Volume Allenamento */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend Settimanale - Volume Allenamento</h3>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              onClick={() => handleExport(weeklyData, 'report_coach_volume', players, filters)}
            >
              Esporta
            </button>
          </div>
          <div>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={weeklyData}>
                  <defs>
                    <linearGradient id="rc-line-vol-dist" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="rc-line-vol-load" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="rc-line-vol-sess" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="weekFormatted" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avgDistancePerMin" name="Avg Distance (m/min)" stroke="url(#rc-line-vol-dist)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avgLoadPerMin" name="Avg Load (au/min)" stroke="url(#rc-line-vol-load)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="sessionsCount" name="Sessions Count" stroke="url(#rc-line-vol-sess)" strokeWidth={4} strokeLinecap="round" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Zap size={48} />
                <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
                <p className="text-sm">Non ci sono dati per il trend volume allenamento</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 6: Alert e Raccomandazioni */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Alert e Raccomandazioni</h3>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              onClick={() => handleExport(reportData, 'report_coach', players, filters)}
            >
              Esporta
            </button>
          </div>
          <div>
            {reportData.length > 0 ? (
              <div className="p-5">
                <h4 className="mb-4 text-red-600 dark:text-red-400 font-semibold">⚠️ Giocatori a Rischio</h4>
                {reportData.filter(p => p.acwrStatus === 'overload').map(player => (
                  <div
                    key={player.playerId}
                    className="mb-2 p-3 rounded border text-red-800 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-900/20 dark:border-red-800"
                  >
                    <strong>{player.player}</strong> - ACWR: {player.acwr} (Sovraccarico)
                  </div>
                ))}

                <h4 className="mt-5 mb-4 text-amber-600 dark:text-amber-400 font-semibold">⚠️ Giocatori Sottocarico</h4>
                {reportData.filter(p => p.acwrStatus === 'underload').map(player => (
                  <div
                    key={player.playerId}
                    className="mb-2 p-3 rounded border text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                  >
                    <strong>{player.player}</strong> - ACWR: {player.acwr} (Sottocarico)
                  </div>
                ))}

                {reportData.filter(p => p.acwrStatus === 'overload' || p.acwrStatus === 'underload').length === 0 && (
                  <div className="p-4 rounded border text-emerald-800 bg-emerald-50 border-emerald-200 text-center dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                    <div className="flex items-center justify-center gap-2">
                      <Target size={20} className="text-green-500" />
                      Tutti i giocatori hanno un carico ottimale
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="chart-no-data">
                <AlertTriangle size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per gli alert</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
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

export default ReportCoach;
