import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Zap, TrendingUp, Target, Activity } from 'lucide-react';
import { useExport } from '../../../hooks/useExport';
import ExportModal from '../../common/ExportModal';

const AltaVelocita = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 AltaVelocita component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 AltaVelocita: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: AltaVelocita riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Zap size={20} />
              Alta Velocità & Sprint
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Zap size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 DATA PROCESSING con supporto a dati aggregati e modalità compare (RAW)
  const speedData = useMemo(() => {
    if (!data?.length) return [];
    
    console.log('🟡 Processing high speed data...'); // WARNING - rimuovere in produzione
    
    // Modalità compare: costruisci serie per data e giocatore da sessioni RAW
    if (isCompareMode && Array.isArray(comparePlayerIds) && comparePlayerIds.length > 0) {
      const idSet = new Set(comparePlayerIds.map(id => Number(id)));
      const dateMap = new Map();
      data.forEach(s => {
        const pid = Number(s.playerId);
        if (!idSet.has(pid)) return;
        const dateKey = s.session_date ? String(s.session_date).split(' ')[0] : (s.dateFull || null);
        if (!dateKey) return;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: new Date(dateKey).toLocaleDateString('it-IT'), fullDate: dateKey });
        }
        const entry = dateMap.get(dateKey);
        const playerKey = `player_${pid}`;
        // Metriche per serie giocatore
        entry[`${playerKey}_maxTopSpeed`] = Math.max(entry[`${playerKey}_maxTopSpeed`] || 0, Number(s.top_speed_kmh) || 0);
        entry[`${playerKey}_totalSprintDistance`] = (entry[`${playerKey}_totalSprintDistance`] || 0) + (Number(s.sprint_distance_m) || 0);
        entry[`${playerKey}_totalHighIntensityRuns`] = (entry[`${playerKey}_totalHighIntensityRuns`] || 0) + (Number(s.high_intensity_runs) || 0);
      });
      return Array.from(dateMap.values()).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }

    // 🔧 FIX: I dati sono GIÀ aggregati dal backend - mappali al formato grafico (vista standard)
    const result = data
      .filter(day => day.dateFull || day.session_date)
      .sort((a, b) => {
        const dateA = new Date(a.dateFull || a.session_date);
        const dateB = new Date(b.dateFull || b.session_date);
        return dateA - dateB;
      })
      .map(day => ({
        date: day.dateFormatted || new Date(day.dateFull || day.session_date).toLocaleDateString('it-IT'),
        fullDate: day.dateFull || day.session_date,
        totalSprintDistance: day.sprintDistance || 0,
        totalHighIntensityRuns: day.highIntensityRuns || 0,
        maxTopSpeed: day.topSpeed || 0,
        avgTopSpeed: day.topSpeed || 0,
        sprintDistancePerMin: day.totalMinutes > 0 ? (day.sprintDistance || 0) / day.totalMinutes : 0,
        sessions_count: day.sessionsCount || day.sessions?.length || undefined
      }));
    
    console.log('🟢 High speed data processed:', result.length, 'data points'); // INFO - rimuovere in produzione
    return result;
  }, [data, isCompareMode, comparePlayerIds]);

  // Dati per giocatore (top speed per giocatore nel tempo)
  const playerSpeedData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId;
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        playerMap.set(playerId, {
          playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`,
          sessions: []
        });
      }
      
      playerMap.get(playerId).sessions.push(session);
    });
    
    return Array.from(playerMap.values()).map(player => {
      const topSpeed = Math.max(...player.sessions.map(s => s.top_speed_kmh || 0));
      const avgSprintDistance = player.sessions.reduce((sum, s) => sum + (s.sprint_distance_m || 0), 0) / player.sessions.length;
      
      return {
        player: player.playerName,
        topSpeed,
        avgSprintDistance,
        sessionsCount: player.sessions.length
      };
    }).sort((a, b) => b.topSpeed - a.topSpeed);
  }, [data, players]);

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
          <Zap size={24} />
          Alta Velocità & Sprint
        </h2>
        <p>Analisi di sprint, HSR e velocità massime</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Top Speed nel Tempo */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Top Speed nel Tempo</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(speedData, 'top_speed_nel_tempo', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {speedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {isCompareMode && comparePlayerIds.length > 0 ? (
                    comparePlayerIds.map((pid, index) => {
                      const key = `player_${pid}_maxTopSpeed`;
                      const p = players.find(pl => pl.id === pid);
                      const name = p ? `${p.firstName} ${p.lastName}` : `Player ${pid}`;
                      const palette = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#22C55E'];
                      const stroke = palette[index % palette.length];
                      return (
                        <Line key={key} type="monotone" dataKey={key} stroke={stroke} strokeWidth={2} name={name} />
                      );
                    })
                  ) : (
                    <>
                      <Line type="monotone" dataKey="maxTopSpeed" stroke="#EF4444" strokeWidth={2} name="Max Speed (km/h)" />
                      <Line type="monotone" dataKey="avgTopSpeed" stroke="#F59E0B" strokeWidth={2} name="Avg Speed (km/h)" />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di velocità per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Distanza Sprint */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Zap size={20} />
              <h3>Distanza Sprint per Sessione</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(speedData, 'distanza_sprint_per_sessione', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {speedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {isCompareMode && comparePlayerIds.length > 0 ? (
                    comparePlayerIds.map((pid, index) => {
                      const key = `player_${pid}_totalSprintDistance`;
                      const p = players.find(pl => pl.id === pid);
                      const name = p ? `${p.firstName} ${p.lastName}` : `Player ${pid}`;
                      const palette = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#22C55E'];
                      const fill = palette[index % palette.length];
                      return (
                        <Bar key={key} dataKey={key} fill={fill} name={name} />
                      );
                    })
                  ) : (
                    <Bar dataKey="totalSprintDistance" fill="#10B981" name="Sprint Distance (m)" />
                  )}
                  <ReferenceLine y={200} stroke="#F59E0B" strokeDasharray="5 5" label="Soglia Alta" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Zap size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di sprint per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: High Intensity Runs */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>High Intensity Runs</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(speedData, 'high_intensity_runs', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {speedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {isCompareMode && comparePlayerIds.length > 0 ? (
                    comparePlayerIds.map((pid, index) => {
                      const key = `player_${pid}_totalHighIntensityRuns`;
                      const p = players.find(pl => pl.id === pid);
                      const name = p ? `${p.firstName} ${p.lastName}` : `Player ${pid}`;
                      const palette = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#EC4899', '#22C55E'];
                      const fill = palette[index % palette.length];
                      return (
                        <Bar key={key} dataKey={key} fill={fill} name={name} />
                      );
                    })
                  ) : (
                    <Bar dataKey="totalHighIntensityRuns" fill="#8B5CF6" name="High Intensity Runs" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di high intensity runs per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Top Speed per Giocatore */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={20} />
              <h3>Top Speed per Giocatore</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(playerSpeedData, 'top_speed_per_giocatore', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {playerSpeedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerSpeedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="topSpeed" 
                    fill="#06B6D4"
                    name="Top Speed (km/h)"
                  />
                  <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Elite" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Target size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di velocità per giocatore per il periodo selezionato</p>
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

export default AltaVelocita;
