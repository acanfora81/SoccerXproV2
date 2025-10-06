import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { GitCompare, TrendingUp, Target, Users } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const Comparazioni = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 Comparazioni component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 Comparazioni: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Comparazioni riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <GitCompare size={20} />
              Comparazioni
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <GitCompare size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 GRAFICO 1: Trend KPI Settimanale (Load/Min, Dist/Min)
  const weeklyKPIData = useMemo(() => {
    if (!data?.length) return [];
    
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return;
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return;
      
      // ISO-8601 week calculation
      const isoDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      const dayNum = isoDate.getUTCDay() || 7;
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    return Array.from(weekMap.values()).map(week => {
      const totalDistance = week.sessions.reduce((sum, s) => sum + (s.totalDistance || s.total_distance_m || 0), 0);
      const totalMinutes = week.sessions.reduce((sum, s) => sum + (s.totalMinutes || s.duration_minutes || 0), 0);
      const totalLoad = week.sessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || s.training_load || 0), 0);
      
      return {
        week: week.week,
        weekFormatted: week.weekFormatted,
        avgLoadPerMin: totalMinutes > 0 ? (totalLoad / totalMinutes).toFixed(2) : 0,
        avgDistancePerMin: totalMinutes > 0 ? (totalDistance / totalMinutes).toFixed(2) : 0,
        sessionsCount: week.sessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  // 📊 GRAFICO 2: Trend Settimanale per Ruolo
  const weeklyRoleData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    // Normalizza ruoli come in ReportCoach
    const normalizeRole = (position) => {
      if (!position) return 'POR';
      const pos = position.toUpperCase();
      if (pos.includes('GOAL') || pos === 'POR' || pos === 'GK') return 'POR';
      if (pos.includes('DEFEN') || pos === 'DIF' || pos === 'DF') return 'DIF';
      if (pos.includes('MID') || pos === 'CEN' || pos === 'MF') return 'CEN';
      if (pos.includes('FORW') || pos.includes('ATT') || pos === 'FW') return 'ATT';
      return 'POR';
    };

    // Mappa playerId -> role
    const playerRoleMap = new Map();
    players.forEach(p => {
      playerRoleMap.set(p.id, normalizeRole(p.position));
    });

    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
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
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          POR: { load: 0, distance: 0, hsr: 0, count: 0 },
          DIF: { load: 0, distance: 0, hsr: 0, count: 0 },
          CEN: { load: 0, distance: 0, hsr: 0, count: 0 },
          ATT: { load: 0, distance: 0, hsr: 0, count: 0 }
        });
      }
      
      const weekData = weekMap.get(weekKey);
      
      // Determina il ruolo dalla sessione aggregata (se disponibile) o dai players
      let role = 'POR';
      if (session.playerId) {
        role = playerRoleMap.get(session.playerId) || 'POR';
      }
      
      const load = session.playerLoad || session.player_load || session.training_load || 0;
      const distance = session.totalDistance || session.total_distance_m || 0;
      const hsr = session.hsrTotal || ((session.distance_15_20_kmh_m || 0) + (session.distance_20_25_kmh_m || 0) + (session.distance_over_25_kmh_m || 0));
      
      weekData[role].load += load;
      weekData[role].distance += distance;
      weekData[role].hsr += hsr;
      weekData[role].count += 1;
    });
    
    return Array.from(weekMap.values()).map(week => ({
      week: week.week,
      weekFormatted: week.weekFormatted,
      POR_Load: week.POR.count > 0 ? (week.POR.load / week.POR.count).toFixed(1) : 0,
      DIF_Load: week.DIF.count > 0 ? (week.DIF.load / week.DIF.count).toFixed(1) : 0,
      CEN_Load: week.CEN.count > 0 ? (week.CEN.load / week.CEN.count).toFixed(1) : 0,
      ATT_Load: week.ATT.count > 0 ? (week.ATT.load / week.ATT.count).toFixed(1) : 0,
      POR_Dist: week.POR.count > 0 ? (week.POR.distance / week.POR.count).toFixed(0) : 0,
      DIF_Dist: week.DIF.count > 0 ? (week.DIF.distance / week.DIF.count).toFixed(0) : 0,
      CEN_Dist: week.CEN.count > 0 ? (week.CEN.distance / week.CEN.count).toFixed(0) : 0,
      ATT_Dist: week.ATT.count > 0 ? (week.ATT.distance / week.ATT.count).toFixed(0) : 0,
      POR_HSR: week.POR.count > 0 ? (week.POR.hsr / week.POR.count).toFixed(0) : 0,
      DIF_HSR: week.DIF.count > 0 ? (week.DIF.hsr / week.DIF.count).toFixed(0) : 0,
      CEN_HSR: week.CEN.count > 0 ? (week.CEN.hsr / week.CEN.count).toFixed(0) : 0,
      ATT_HSR: week.ATT.count > 0 ? (week.ATT.hsr / week.ATT.count).toFixed(0) : 0
    })).sort((a, b) => a.week.localeCompare(b.week));
  }, [data, players]);

  // 📊 GRAFICO 3 & 4: Trend Velocità, Potenza, HSR Settimanale
  const weeklyPerformanceData = useMemo(() => {
    if (!data?.length) return [];
    
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return;
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return;
      
      // ISO-8601 week calculation
      const isoDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      const dayNum = isoDate.getUTCDay() || 7;
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    return Array.from(weekMap.values()).map(week => {
      const totalDistance = week.sessions.reduce((sum, s) => sum + (s.totalDistance || s.total_distance_m || 0), 0);
      const totalMinutes = week.sessions.reduce((sum, s) => sum + (s.totalMinutes || s.duration_minutes || 0), 0);
      const totalLoad = week.sessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || s.training_load || 0), 0);
      const totalHSR = week.sessions.reduce((sum, s) => sum + (s.hsrTotal || ((s.distance_15_20_kmh_m || 0) + (s.distance_20_25_kmh_m || 0) + (s.distance_over_25_kmh_m || 0))), 0);
      const maxSpeed = Math.max(...week.sessions.map(s => s.topSpeed || s.top_speed_kmh || 0));
      const avgMetPower = week.sessions.reduce((sum, s) => sum + (s.avgMetPower || s.avg_metabolic_power_wkg || 0), 0) / week.sessions.length;
      
      return {
        week: week.week,
        weekFormatted: week.weekFormatted,
        totalDistance: Math.round(totalDistance),
        totalMinutes: Math.round(totalMinutes),
        totalLoad: Math.round(totalLoad),
        totalHSR: Math.round(totalHSR),
        maxSpeed: parseFloat(maxSpeed.toFixed(1)),
        avgMetPower: parseFloat(avgMetPower.toFixed(2)),
        avgDistancePerMin: totalMinutes > 0 ? parseFloat((totalDistance / totalMinutes).toFixed(2)) : 0,
        avgLoadPerMin: totalMinutes > 0 ? parseFloat((totalLoad / totalMinutes).toFixed(2)) : 0,
        avgHSRPerMin: totalMinutes > 0 ? parseFloat((totalHSR / totalMinutes).toFixed(2)) : 0,
        sessionsCount: week.sessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 text-white border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessionsCount && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              {payload[0].payload.sessionsCount} sessioni
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comparazioni</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Confronti tra giocatori, ruoli e periodi</p>
          </div>
        </div>
      </div>

      {/* Grafico 1: Trend KPI Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend KPI Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyKPIData, 'trend-kpi', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyKPIData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyKPIData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="avgLoadPerMin" 
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Load/Min"
                />
                <Line 
                  type="monotone"
                  dataKey="avgDistancePerMin" 
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Dist/Min (m)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di confronto per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 2: Trend Carico per Ruolo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Carico per Ruolo</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyRoleData, 'trend-ruolo', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyRoleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyRoleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="POR_Load" 
                  stroke="#EAB308" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Portiere"
                />
                <Line 
                  type="monotone"
                  dataKey="DIF_Load" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Difensore"
                />
                <Line 
                  type="monotone"
                  dataKey="CEN_Load" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Centrocampista"
                />
                <Line 
                  type="monotone"
                  dataKey="ATT_Load" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Attaccante"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Target className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di analisi per ruolo per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 3: Trend HSR Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend HSR Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyPerformanceData, 'trend-hsr', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="avgHSRPerMin" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="HSR/Min (m)"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalHSR" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="HSR Totale (m)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati HSR per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 4: Trend Velocità & Potenza Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Velocità & Potenza Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyPerformanceData, 'trend-velocita-potenza', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="maxSpeed" 
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Velocità Max (km/h)"
                />
                <Line 
                  type="monotone"
                  dataKey="avgMetPower" 
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Potenza Metabolica (W/kg)"
                />
                <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'Elite Speed', fill: '#EF4444', fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <GitCompare className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di velocità e potenza per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 5: Trend Distanza per Ruolo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Distanza per Ruolo</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyRoleData, 'trend-distanza-ruolo', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyRoleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyRoleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="POR_Dist" 
                  stroke="#EAB308" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Portiere"
                />
                <Line 
                  type="monotone"
                  dataKey="DIF_Dist" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Difensore"
                />
                <Line 
                  type="monotone"
                  dataKey="CEN_Dist" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Centrocampista"
                />
                <Line 
                  type="monotone"
                  dataKey="ATT_Dist" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Attaccante"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di distanza per ruolo per il periodo selezionato</p>
            </div>
          )}
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

export default Comparazioni;
