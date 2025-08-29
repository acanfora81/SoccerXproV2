// client/src/components/analytics/ComparePanel.jsx
// ⚖️ CONFRONTO MULTI-PLAYER AVANZATO - VERSIONE COMPLETA CORRETTA

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, GitCompare, BarChart3, AlertTriangle,
  Download, Share2, Calendar, MinusCircle, Award, MinusCircle as RemoveIcon
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from 'recharts';

import '../../styles/analytics.css';

// 🗣️ Funzione per tradurre le posizioni
const translatePosition = (position) => {
  const translations = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore', 
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return translations[position] || position;
};

// 🎨 Colori giocatori (fino a 8) – fuori dal componente per evitare deps negli hook
const PLAYER_COLORS = [
  '#3B82F6', // Blu
  '#10B981', // Verde
  '#F59E0B', // Arancione
  '#EF4444', // Rosso
  '#8B5CF6', // Viola
  '#06B6D4', // Ciano
  '#F97316', // Arancione scuro
  '#84CC16'  // Verde lime
];

const ComparePanel = ({
  players = [],
  onClose,
  onBack
}) => {
  const [chartType, setChartType] = useState('overlay');   // overlay, radar, scatter
  const [metric, setMetric] = useState('playerLoad');      // playerLoad, distance, topSpeed, avgHeartRate
  const [timeRange, setTimeRange] = useState('all');
  const [sessionsByPlayer, setSessionsByPlayer] = useState({});
  const [loading, setLoading] = useState(true);

  // ================================
  // CARICAMENTO DATI COMPLETI
  // ================================
  useEffect(() => {
    const fetchAllPlayerData = async () => {
      setLoading(true);
      const sessionsData = {};
      
      try {
        // Carica i dati completi per ogni giocatore
        const promises = players.map(async (player) => {
          const response = await fetch(`/api/performance/player/${player.id}/sessions`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const result = await response.json();
            sessionsData[player.id] = result.data || [];
          } else {
            sessionsData[player.id] = [];
          }
        });
        
        await Promise.all(promises);
        setSessionsByPlayer(sessionsData);
      } catch (error) {
        console.log('🔴 Errore caricamento dati confronto:', error);
      } finally {
        setLoading(false);
      }
    };

    if (players.length > 0) {
      fetchAllPlayerData();
    }
  }, [players]);

  // ================================
  // HOOKS (devono stare prima di return)
  // ================================

  // 📊 Analytics comparativi per player - FIX CRUCIALE PER FILTRO "ALL"
  const compareAnalytics = useMemo(() => {
    const results = {};
    const now = new Date();

    console.log('🟢 ComparePanel - Calcolo analytics per', players.length, 'giocatori con timeRange:', timeRange); // INFO - rimuovere in produzione

    players.forEach((player, index) => {
      // 🎯 FIX CRUCIALE: Gestione corretta filtro "all" 
      let filteredSessions;
      
      if (timeRange === 'all') {
        // ⭐ Per "all" NON filtrare per data - prendi TUTTO
        console.log('🟢 ComparePanel filtro "all" - mostrando tutte le sessioni per:', player.firstName, '- totale:', (sessionsByPlayer[player.id] || []).length); // INFO - rimuovere in produzione
        filteredSessions = sessionsByPlayer[player.id] || [];
      } else {
        // 📅 Solo per filtri specifici applica limitazione di giorni
            const daysBack = 
      timeRange === '7d' ? 7 :
      timeRange === '14d' ? 14 :
      timeRange === '30d' ? 30 :
      timeRange === '90d' ? 90 : 30;
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        
        filteredSessions = (sessionsByPlayer[player.id] || []).filter(
          s => new Date(s.session_date) >= cutoffDate
        );
        
        console.log(`🔵 ComparePanel filtro ${timeRange} per ${player.firstName} - sessioni:`, filteredSessions.length); // INFO DEV - rimuovere in produzione
      }

      if (filteredSessions.length === 0) {
        results[player.id] = {
          player,
          color: PLAYER_COLORS[index],
          sessions: [],
          summary: {},
          timeline: [],
          radarData: {}
        };
        return;
      }

      // 📊 Calcola statistiche
      const summary = {
        totalSessions: filteredSessions.length,
        avgDistance: Math.round(filteredSessions.reduce((a, s) => a + (s.total_distance_m || 0), 0) / filteredSessions.length),
        avgPlayerLoad: Math.round(filteredSessions.reduce((a, s) => a + (s.player_load || 0), 0) / filteredSessions.length),
        maxSpeed: Math.max(...filteredSessions.map(s => s.top_speed_kmh || 0), 0),
        avgSpeed: Math.round(
          (filteredSessions.reduce((a, s) => a + (s.top_speed_kmh || 0), 0) / filteredSessions.length) * 10
        ) / 10,
        avgSprintDistance: Math.round(filteredSessions.reduce((a, s) => a + (s.sprint_distance_m || 0), 0) / filteredSessions.length),
        avgHeartRate: Math.round(filteredSessions.reduce((a, s) => a + (s.avg_heart_rate || 0), 0) / filteredSessions.length),
        maxHeartRate: Math.max(...filteredSessions.map(s => s.max_heart_rate || 0), 0),
        trainingCount: filteredSessions.filter(s => s.session_type === 'Training').length,
        matchCount: filteredSessions.filter(s => s.session_type === 'Match').length
      };

      // 📈 Timeline per grafici
      const timeline = filteredSessions
        .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))
        .map(s => ({
          date: new Date(s.session_date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
          fullDate: s.session_date,
          playerLoad: s.player_load || 0,
          distance: s.total_distance_m || 0,
          sprintDistance: s.sprint_distance_m || 0,
          topSpeed: s.top_speed_kmh || 0,
          avgHeartRate: s.avg_heart_rate || 0,
          maxHeartRate: s.max_heart_rate || 0,
          sessionType: s.session_type,
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`
        }));

      // 🎯 Radar data normalizzato
      const radarData = {
        distanza: Math.min((summary.avgDistance / 12000) * 100, 100),
        velocita: Math.min((summary.maxSpeed / 35) * 100, 100),
        sprint: Math.min((summary.avgSprintDistance / 1500) * 100, 100),
        playerLoad: Math.min((summary.avgPlayerLoad / 800) * 100, 100),
        frequenzaCardiaca: Math.min((summary.maxHeartRate / 200) * 100, 100)
      };

      results[player.id] = {
        player,
        color: PLAYER_COLORS[index],
        sessions: filteredSessions, // ⭐ Usa le sessioni filtrate correttamente
        summary,
        timeline,
        radarData
      };
    });

    console.log('🟡 CompareAnalytics calcolati per', Object.keys(results).length, 'giocatori'); // DEBUG - rimuovere in produzione

    return results;
  }, [players, sessionsByPlayer, timeRange]);

  // 📈 Dati per i grafici
  const chartData = useMemo(() => {
    const allTimelines = Object.values(compareAnalytics).flatMap(p => p.timeline);

    // Overlay
    const dateMap = {};
    allTimelines.forEach(point => {
      if (!dateMap[point.date]) dateMap[point.date] = { date: point.date };
      // 🔧 FIX: Sostituisci TUTTI gli spazi con underscore per evitare problemi con nomi multipli
      const playerKey = `${point.playerName}`.replace(/\s+/g, '_');
      dateMap[point.date][`${playerKey}_${metric}`] = point[metric];
    });
    const overlayData = Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Radar combinato
    const radarMetrics = ['distanza', 'velocita', 'sprint', 'playerLoad', 'frequenzaCardiaca'];
    const combinedRadarData = radarMetrics.map(metricName => {
      const dp = { metric: metricName.charAt(0).toUpperCase() + metricName.slice(1) };
      Object.values(compareAnalytics).forEach(p => {
        dp[`${p.player.firstName} ${p.player.lastName}`] = p.radarData[metricName] || 0;
      });
      return dp;
    });

    // Scatter (Player Load vs Distanza)
    const scatterData = Object.values(compareAnalytics).map(p => ({
      x: p.summary.avgPlayerLoad || 0,
      y: p.summary.avgDistance || 0,
      name: `${p.player.firstName} ${p.player.lastName}`,
      color: p.color,
      sessions: p.summary.totalSessions
    }));

    return { overlayData, combinedRadarData, scatterData };
  }, [compareAnalytics, metric]);

  // 🚨 Alert intelligenti
  const alerts = useMemo(() => {
    const out = [];
    const summaries = Object.values(compareAnalytics).map(p => p.summary);
    
    if (summaries.length < 2) return out;

    // Alert velocità massima
    const speeds = summaries.map(s => s.maxSpeed || 0).filter(s => s > 0);
    if (speeds.length >= 2) {
      const maxSpeed = Math.max(...speeds);
      const minSpeed = Math.min(...speeds);
      const fastP = Object.values(compareAnalytics).find(p => p.summary.maxSpeed === maxSpeed);
      if (maxSpeed > minSpeed * 1.2) {
        out.push({
          type: 'info',
          title: 'Differenza Velocità',
          message: `${fastP.player.firstName} ${fastP.player.lastName} raggiunge i ${maxSpeed.toFixed(1)} km/h (${((maxSpeed - minSpeed) / maxSpeed * 100).toFixed(1)}% più veloce)`
        });
      }
    }

    // Alert carico squilibrato
    const loads = summaries.map(s => s.avgPlayerLoad || 0).filter(l => l > 0);
    if (loads.length >= 2) {
      const maxLoad = Math.max(...loads);
      const minLoad = Math.min(...loads);
      const hardP = Object.values(compareAnalytics).find(p => p.summary.avgPlayerLoad === maxLoad);
      if (maxLoad > minLoad * 1.25) {
        out.push({
          type: 'warning',
          title: 'Carico Squilibrato',
          message: `${hardP.player.firstName} ${hardP.player.lastName} ha un carico medio del ${(((maxLoad - minLoad) / Math.max(minLoad, 1)) * 100).toFixed(1)}% superiore agli altri`
        });
      }
    }

    return out.slice(0, 3);
  }, [compareAnalytics]);

  // ================================
  // SOLO ORA eventuale return condizionale
  // ================================
  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-card">
          <div className="loading-text">Caricamento dati confronto...</div>
        </div>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <GitCompare size={48} />
          <h3>Nessun giocatore selezionato per il confronto</h3>
          <button className="btn btn-primary" onClick={onBack}>
            <ArrowLeft size={16} />
            Seleziona Giocatori
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // RENDER HELPERS
  // ================================
  const renderPlayerLegend = () => (
    <div className="players-legend">
      {players.map((player, index) => (
        <div key={player.id} className="legend-player">
          <div className="legend-color" style={{ backgroundColor: PLAYER_COLORS[index] }} />
          <span className="legend-name">
            {player.firstName} {player.lastName}
          </span>
          <span className="legend-position">({translatePosition(player.position)})</span>
          <button
            className="legend-remove"
            onClick={() => {
              // Qui avviseresti il parent per rimuovere il player dal confronto
              // Se non lo gestisci lato parent, chiudo il pannello se non resta nessuno
              if (players.length <= 1) onClose();
            }}
            title="Rimuovi dal confronto"
          >
            <RemoveIcon size={12} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderOverlayChart = () => {
    const { overlayData } = chartData;
    
    if (!overlayData.length) {
      return <div className="no-data">Nessun dato per il periodo selezionato</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={overlayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {players.map((player, index) => {
            // 🔧 FIX: Usa la stessa logica per sostituire TUTTI gli spazi
            const dataKey = `${player.firstName}_${player.lastName}`.replace(/\s+/g, '_') + `_${metric}`;
            return (
              <Line
                key={player.id}
                type="monotone"
                dataKey={dataKey}
                stroke={PLAYER_COLORS[index]}
                strokeWidth={2}
                dot={{ fill: PLAYER_COLORS[index], strokeWidth: 2, r: 4 }}
                name={`${player.firstName} ${player.lastName}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderRadarChart = () => {
    const { combinedRadarData } = chartData;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={combinedRadarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {players.map((player, index) => (
            <Radar
              key={player.id}
              name={`${player.firstName} ${player.lastName}`}
              dataKey={`${player.firstName} ${player.lastName}`}
              stroke={PLAYER_COLORS[index]}
              fill={PLAYER_COLORS[index]}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderScatterChart = () => {
    const { scatterData } = chartData;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" name="Player Load" unit="" />
          <YAxis dataKey="y" name="Distanza" unit="m" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p><strong>{data.name}</strong></p>
                    <p>Player Load: {data.x}</p>
                    <p>Distanza: {data.y}m</p>
                    <p>Sessioni: {data.sessions}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          {scatterData.map((point, index) => (
            <Scatter key={index} data={[point]} fill={point.color} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const renderStatsTable = () => {
    const metrics = [
      { key: 'totalSessions', label: 'Sessioni', unit: '' },
      { key: 'avgDistance', label: 'Distanza Media', unit: 'm' },
      { key: 'avgPlayerLoad', label: 'Player Load Medio', unit: '' },
      { key: 'maxSpeed', label: 'Velocità Max', unit: 'km/h' },
      { key: 'avgSprintDistance', label: 'Sprint Medio', unit: 'm' },
      { key: 'maxHeartRate', label: 'FC Max', unit: 'bpm' }
    ];

    return (
      <div className="stats-table-container">
        <table className="table compare-stats-table">
          <thead>
            <tr>
              <th>Metrica</th>
              {players.map((player, index) => (
                <th key={player.id} style={{ color: PLAYER_COLORS[index] }}>
                  {player.firstName} {player.lastName}
                </th>
              ))}
              <th className="leader-column">Leader</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label, unit }) => {
              const values = players.map(p => compareAnalytics[p.id]?.summary[key] || 0);
              const maxValue = Math.max(...values);
              const leaderIndex = values.findIndex(v => v === maxValue);

              return (
                <tr key={key}>
                  <td className="metric-label">{label}</td>
                  {values.map((value, index) => {
                    const isLeader = value === maxValue && value > 0;
                    return (
                      <td 
                        key={index} 
                        className={`metric-value ${isLeader ? 'leader' : ''}`}
                      >
                        {typeof value === 'number' ? value.toLocaleString() : value}{unit}
                        {isLeader && <Award size={10} className="leader-icon" />}
                      </td>
                    );
                  })}
                  <td className="leader-cell">
                    <div style={{ color: PLAYER_COLORS[leaderIndex] }}>
                      {players[leaderIndex] ? `${players[leaderIndex].firstName} ${players[leaderIndex].lastName}` : '-'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ================================
  // RENDER PRINCIPALE
  // ================================
  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title">
          <div>
            <h1>Confronto Giocatori</h1>
            <p className="analytics-subtitle">
              Analisi comparativa • {players.length} giocatori • {timeRange === 'all' ? 'Tutti i dati' : timeRange}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn--ghost back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Lista Giocatori
          </button>
          <button className="btn btn--ghost back-btn" onClick={onClose}>
            <MinusCircle size={16} /> Chiudi Confronto
          </button>
        </div>
      </div>

      {/* Players Legend */}
      {renderPlayerLegend()}

      {/* Controls */}
              <div className="analytics-filters">
          <div className="filter-group">
            <span className="filter-label">Periodo</span>
            <select
              className="filter-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">7 giorni</option>
              <option value="14d">14 giorni</option>
              <option value="30d">30 giorni</option>
              <option value="90d">90 giorni</option>
              <option value="all">Tutto</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Metrica</span>
            <select
              className="filter-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              <option value="playerLoad">Player Load</option>
              <option value="distance">Distanza</option>
              <option value="topSpeed">Velocità</option>
              <option value="avgHeartRate">Freq. Cardiaca</option>
            </select>
          </div>

        <div className="quick-filters">
          <button
            className={`quick-filter-btn ${chartType === 'overlay' ? 'active' : ''}`}
            onClick={() => setChartType('overlay')}
          >
            Sovrapposizione
          </button>
          <button
            className={`quick-filter-btn ${chartType === 'radar' ? 'active' : ''}`}
            onClick={() => setChartType('radar')}
          >
            Radar
          </button>
          <button
            className={`quick-filter-btn ${chartType === 'scatter' ? 'active' : ''}`}
            onClick={() => setChartType('scatter')}
          >
            Correlazione
          </button>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary">
            Esporta Confronto
          </button>
          <button className="btn btn-secondary">
            Condividi
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section section-spacing">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.type}`}>
              <div>
                <h4>{alert.title}</h4>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="compare-content">
        {/* Chart Section */}
        <div className="chart-section chart-spacing">
          <div className="chart-header">
            <h3>
              {chartType === 'overlay' && 'Andamento Temporale'}
              {chartType === 'radar' && 'Profilo Multidimensionale'}  
              {chartType === 'scatter' && 'Correlazione Metriche'}
            </h3>
          </div>
          <div className="chart-container">
            {chartType === 'overlay' && renderOverlayChart()}
            {chartType === 'radar' && renderRadarChart()}
            {chartType === 'scatter' && renderScatterChart()}
          </div>
        </div>

        {/* Stats Table */}
        <div className="table-section table-spacing">
          <div className="section-header">
            <h3>Statistiche Comparative</h3>
          </div>
          {renderStatsTable()}
        </div>
      </div>
    </div>
  );
};

export default ComparePanel;