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

  // 📊 DATA PROCESSING per confronti tra giocatori
  const comparisonData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    console.log('🟡 Processing comparison data...'); // WARNING - rimuovere in produzione
    
    // Raggruppa per giocatore e calcola KPI
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId;
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        playerMap.set(playerId, {
          playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`,
          position: player?.position || 'Unknown',
          sessions: []
        });
      }
      playerMap.get(playerId).sessions.push(session);
    });
    
    const result = Array.from(playerMap.values()).map(player => {
      const sessions = player.sessions;
      const totalDistance = sessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalLoad = sessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
      const maxSpeed = Math.max(...sessions.map(s => s.top_speed_kmh || 0));
      const avgMetPower = sessions.reduce((sum, s) => sum + (s.avg_metabolic_power_wkg || 0), 0) / sessions.length;
      const totalHSR = sessions.reduce((sum, s) => sum + (s.distance_15_20_kmh_m || 0) + (s.distance_20_25_kmh_m || 0) + (s.distance_over_25_kmh_m || 0), 0);
      const totalAcc = sessions.reduce((sum, s) => sum + (s.num_acc_over_3_ms2 || 0), 0);
      
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
        distancePerMin: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        loadPerMin: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        hsrPerMin: totalMinutes > 0 ? (totalHSR / totalMinutes) : 0,
        accPerMin: totalMinutes > 0 ? (totalAcc / totalMinutes) : 0
      };
    }).sort((a, b) => b.totalLoad - a.totalLoad);
    
    console.log('🟢 Comparison data processed:', result.length, 'players'); // INFO - rimuovere in produzione
    return result;
  }, [data, players]);

  // Dati per analisi per ruolo
  const roleAnalysisData = useMemo(() => {
    if (!comparisonData.length) return [];
    
    const roleMap = new Map();
    
    comparisonData.forEach(player => {
      if (!roleMap.has(player.position)) {
        roleMap.set(player.position, []);
      }
      roleMap.get(player.position).push(player);
    });
    
    return Array.from(roleMap.entries()).map(([role, players]) => {
      const avgDistance = players.reduce((sum, p) => sum + p.distancePerMin, 0) / players.length;
      const avgLoad = players.reduce((sum, p) => sum + p.loadPerMin, 0) / players.length;
      const avgSpeed = players.reduce((sum, p) => sum + p.maxSpeed, 0) / players.length;
      const avgHSR = players.reduce((sum, p) => sum + p.hsrPerMin, 0) / players.length;
      const avgAcc = players.reduce((sum, p) => sum + p.accPerMin, 0) / players.length;
      
      return {
        role,
        playersCount: players.length,
        avgDistance: avgDistance.toFixed(2),
        avgLoad: avgLoad.toFixed(2),
        avgSpeed: avgSpeed.toFixed(2),
        avgHSR: avgHSR.toFixed(2),
        avgAcc: avgAcc.toFixed(2)
      };
    });
  }, [comparisonData]);

  // Dati per trend temporali
  const trendData = useMemo(() => {
    if (!data?.length) return [];
    
    // Raggruppa per settimana e calcola medie
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return;
      const date = new Date(dateStr);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey).push(session);
    });
    
    return Array.from(weekMap.entries()).map(([week, weekSessions]) => {
      const totalDistance = weekSessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
      const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalLoad = weekSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
      
      return {
        week,
        weekFormatted: `Set. ${week.split('-W')[1]}/${week.split('-W')[0].slice(2)}`,
        avgDistance: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        avgLoad: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        sessionsCount: weekSessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <p className="tooltip-label" style={{ marginBottom: '8px', fontWeight: '600' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessions_count && (
            <p style={{ fontSize: '12px', color: '#ccc', marginTop: '8px', borderTop: '1px solid #555', paddingTop: '4px' }}>
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
          <GitCompare size={24} />
          Comparazioni
        </h2>
        <p>Confronti tra giocatori, ruoli e periodi</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Confronto Giocatori per KPI */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Users size={20} />
              <h3>Confronto Giocatori per KPI</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(comparisonData, 'comparazioni', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="loadPerMin" 
                    fill="#3B82F6"
                    name="Load/Min"
                  />
                  <Bar 
                    dataKey="distancePerMin" 
                    fill="#10B981"
                    name="Dist/Min (m)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Users size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di confronto per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Analisi per Ruolo */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={20} />
              <h3>Analisi per Ruolo</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(comparisonData, 'comparazioni', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {roleAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={roleAnalysisData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="role" />
                  <PolarRadiusAxis />
                  <Radar 
                    name="Avg Distance" 
                    dataKey="avgDistance" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3} 
                  />
                  <Radar 
                    name="Avg Load" 
                    dataKey="avgLoad" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3} 
                  />
                  <Radar 
                    name="Avg Speed" 
                    dataKey="avgSpeed" 
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Target size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di analisi per ruolo per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Trend Temporali */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Trend Temporali</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(comparisonData, 'comparazioni', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekFormatted" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgDistance" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Avg Distance (m/min)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgLoad" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Avg Load (au/min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di trend temporali per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Benchmark Squadra */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <GitCompare size={20} />
              <h3>Benchmark Squadra</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(comparisonData, 'comparazioni', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="maxSpeed" 
                    fill="#EF4444"
                    name="Max Speed (km/h)"
                  />
                  <Bar 
                    dataKey="avgMetPower" 
                    fill="#8B5CF6"
                    name="Avg Met Power (W/kg)"
                  />
                  <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="5 5" label="Elite Speed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <GitCompare size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di benchmark per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Confronto Periodi */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Confronto Periodi</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(comparisonData, 'comparazioni', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekFormatted" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="sessionsCount" 
                    fill="#06B6D4"
                    name="Sessions Count"
                  />
                  <Bar 
                    dataKey="avgLoad" 
                    fill="#F59E0B"
                    name="Avg Load"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di confronto periodi per il periodo selezionato</p>
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

export default Comparazioni;
