// client/src/components/analytics/Analytics.jsx
// 🏆 SISTEMA ANALYTICS PROFESSIONALE - Il WOW dei preparatori atletici!

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, TrendingUp, Activity, AlertTriangle, 
  Calendar, Filter, Download, RefreshCw, Eye, GitCompare,
  Zap, Heart, Timer, Target, Award, ArrowUp, ArrowDown,
  ChevronLeft, Settings, MoreVertical
} from 'lucide-react';

// Importa gli altri componenti
import PlayerList from './PlayerList';
import PlayerDossier from './PlayerDossier';
import ComparePanel from './ComparePanel';
import ReportPreview from './ReportPreview';
import Reports from './Reports';

// Stili avanzati
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

/**
 * 🎯 ANALYTICS MAIN COMPONENT
 * 
 * Features WOW:
 * - Team Overview con RAG Readiness Board
 * - KPI dinamici con trend e sparklines
 * - ACWR automatico (semaforo verde/giallo/rosso)
 * - Confronti multi-player real-time
 * - Drill-down su ogni giocatore
 * - Export reports professionali
 */
const Analytics = () => {
  const [players, setPlayers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerAllData, setPlayerAllData] = useState([]);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  
  // Stati per navigazione
  const [currentView, setCurrentView] = useState('overview'); // overview, player-list, dossier, compare, reports
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  
  // Stati per filtri
  const [dateRange, setDateRange] = useState('all'); // 7d, 14d, 30d, all
  const [positionFilter, setPositionFilter] = useState('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');
  
  // Stato per aggiornamenti real-time
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // console.log('🔵 Analytics component renderizzato'); // INFO DEV

  /**
   * 📊 FETCH DATA - Carica giocatori e performance
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log('🔵 Caricamento dati analytics...');

      // Carica giocatori
      const playersResponse = await fetch('/api/players', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!playersResponse.ok) {
        throw new Error(`Errore caricamento giocatori: ${playersResponse.status}`);
      }

      const playersData = await playersResponse.json();
      const playersList = playersData.data || playersData.players || [];
      setPlayers(playersList);

      // Carica performance data
      const performanceResponse = await fetch('/api/performance?all=true', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!performanceResponse.ok) {
        throw new Error(`Errore caricamento performance: ${performanceResponse.status}`);
      }

      const performanceResult = await performanceResponse.json();
      const performanceList = performanceResult.data || performanceResult.sessions || [];
      setPerformanceData(performanceList);

             setLastUpdate(new Date());
       // console.log('🟢 Dati analytics caricati:', {
       //   players: playersList.length,
       //   sessions: performanceList.length
       // });

         } catch (err) {
       // console.log('🔴 Errore caricamento analytics:', err.message);
       setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔄 AUTO-REFRESH ogni 30 secondi se attivato
   */
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  /**
   * 🚀 Initial load
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔧 FIX: useEffect per caricare dati completi quando si seleziona un giocatore
  useEffect(() => {
    if (currentView === 'dossier' && selectedPlayer) {
      const fetchPlayerAllData = async () => {
        try {
          setLoadingPlayerData(true);
          const response = await fetch(`/api/performance/player/${selectedPlayer.id}/sessions`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
                     if (response.ok) {
             const result = await response.json();
             const allPlayerData = result.data || [];
             const capped = response.headers.get('X-Records-Capped') === 'true';
             const capLimit = Number(response.headers.get('X-Records-Limit') || 0) || null;
             const total = Number(response.headers.get('X-Total-Records') || 0) || allPlayerData.length;
             setPlayerAllData(Object.assign(allPlayerData, { _meta: { capped, capLimit, total } }));
           }
        } catch (error) {
          console.log('🔴 Errore caricamento dati completi giocatore:', error);
        } finally {
          setLoadingPlayerData(false);
        }
      };

      fetchPlayerAllData();
    }
  }, [currentView, selectedPlayer]);

   /**
   * 📈 CALCOLI AVANZATI - KPI, ACWR, Trends
   */
  const analytics = useMemo(() => {
  if (!players.length || !performanceData.length) {
    return {
      teamKPIs: {},
      readinessBoard: [],
      trends: {},
      alerts: [],
      filteredSessions: []
    };
  }

  // console.log('🔵 Calcolando analytics avanzati...'); // INFO DEV - rimuovere in produzione

 // FIX: Filtra dati per date range - CORRETTO
  const now = new Date();
  let filteredSessions;
  let cutoffDate;
  let daysBack;

     if (dateRange === 'all') {
     // Per "all" mostra TUTTI i dati senza filtro di data
     // console.log('Filtro "all" - mostrando tutte le sessioni:', performanceData.length);
    
    filteredSessions = performanceData.filter(session => {
      const matchesPosition = positionFilter === 'all' || 
        players.find(p => p.id === session.playerId)?.position === positionFilter;
      const matchesType = sessionTypeFilter === 'all' || (session.session_type || 'Training') === sessionTypeFilter;
      
      return matchesPosition && matchesType;
    });
    
    // Per "all" non calcoliamo trends vs periodo precedente
    daysBack = null;
    cutoffDate = null;
  } else {
    // Solo per filtri specifici applica limitazione di giorni
    daysBack = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 30;
    cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    filteredSessions = performanceData.filter(session => {
      const sessionDate = new Date(session.session_date);
      const matchesDate = sessionDate >= cutoffDate;
      const matchesPosition = positionFilter === 'all' || 
        players.find(p => p.id === session.playerId)?.position === positionFilter;
      const matchesType = sessionTypeFilter === 'all' || (session.session_type || 'Training') === sessionTypeFilter;
      
      return matchesDate && matchesPosition && matchesType;
    });
  }

  // console.log('Sessioni filtrate:', filteredSessions.length, 'su', performanceData.length, 'totali');

    // TEAM KPIs
    const teamKPIs = {
      totalSessions: filteredSessions.length,
      activePlayers: new Set(filteredSessions.map(s => s.playerId)).size,
      avgDistance: filteredSessions.length > 0 ? 
        Math.round(filteredSessions.reduce((acc, s) => acc + (s.total_distance_m || 0), 0) / filteredSessions.length) : 0,
      avgPlayerLoad: filteredSessions.length > 0 ? 
        Math.round(filteredSessions.reduce((acc, s) => acc + (s.player_load || 0), 0) / filteredSessions.length) : 0,
      maxSpeed: Math.max(...filteredSessions.map(s => s.top_speed_kmh || 0), 0),
      totalSprintDistance: filteredSessions.reduce((acc, s) => acc + (s.sprint_distance_m || 0), 0)
    };

    // TRENDS (vs periodo precedente) - solo per filtri specifici
    let trends = { distanceTrend: 0, loadTrend: 0, sessionsTrend: 0 };
    
    if (cutoffDate && daysBack) {
      const prevPeriodStart = new Date(cutoffDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      const prevSessions = performanceData.filter(session => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= prevPeriodStart && sessionDate < cutoffDate;
      });

      const prevAvgDistance = prevSessions.length > 0 ? 
        prevSessions.reduce((acc, s) => acc + (s.total_distance_m || 0), 0) / prevSessions.length : 0;
      const prevAvgPlayerLoad = prevSessions.length > 0 ? 
        prevSessions.reduce((acc, s) => acc + (s.player_load || 0), 0) / prevSessions.length : 0;

      trends = {
        distanceTrend: prevAvgDistance > 0 ? 
          ((teamKPIs.avgDistance - prevAvgDistance) / prevAvgDistance * 100).toFixed(1) : 0,
        loadTrend: prevAvgPlayerLoad > 0 ? 
          ((teamKPIs.avgPlayerLoad - prevAvgPlayerLoad) / prevAvgPlayerLoad * 100).toFixed(1) : 0,
        sessionsTrend: ((teamKPIs.totalSessions - prevSessions.length) / Math.max(prevSessions.length, 1) * 100).toFixed(1)
      };
    }

         // 🚨 RAG READINESS BOARD (ACWR Calculation)
     const readinessBoard = players.map(player => {
       // 🔧 FIX: Usa TUTTI i dati del giocatore per ACWR, non solo quelli filtrati
       const allPlayerSessions = performanceData.filter(s => s.playerId === player.id);
      
             if (allPlayerSessions.length === 0) {
        return {
          ...player,
          acwr: 0,
          status: 'red',
          lastSession: null,
          weeklyLoad: 0,
          monthlyAvg: 0
        };
      }

             // Calcola ACWR (7-day acute / 28-day chronic) su TUTTI i dati
       const last7Days = allPlayerSessions.filter(s => {
         const sessionDate = new Date(s.session_date);
         const days7Ago = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
         return sessionDate >= days7Ago;
       });

       const last28Days = allPlayerSessions.filter(s => {
         const sessionDate = new Date(s.session_date);
         const days28Ago = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
         return sessionDate >= days28Ago;
       });

      const acuteLoad = last7Days.reduce((acc, s) => acc + (s.player_load || 0), 0);
      const chronicLoad = last28Days.reduce((acc, s) => acc + (s.player_load || 0), 0) / 4; // media settimanale
      
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
      // Determina status RAG
      let status = 'green'; // 0.8 - 1.3 = verde
      if (acwr < 0.7 || acwr > 1.5) {
        status = 'red'; // Alto rischio
      } else if (acwr < 0.8 || acwr > 1.3) {
        status = 'yellow'; // Attenzione
      }

      return {
        ...player,
        acwr: acwr.toFixed(2),
        status,
                 lastSession: allPlayerSessions[allPlayerSessions.length - 1],
         weeklyLoad: acuteLoad,
         monthlyAvg: chronicLoad.toFixed(0),
         sessionsCount: allPlayerSessions.length
      };
    }).sort((a, b) => parseFloat(b.acwr) - parseFloat(a.acwr));

    // ⚠️ ALERTS automatici
    const alerts = [];
    readinessBoard.forEach(player => {
      if (player.status === 'red') {
        alerts.push({
          type: 'danger',
          playerName: `${player.firstName} ${player.lastName}`,
          message: `ACWR ${player.acwr} - Rischio infortunio elevato`,
          priority: 'high'
        });
      } else if (player.status === 'yellow') {
        alerts.push({
          type: 'warning',
          playerName: `${player.firstName} ${player.lastName}`,
          message: `ACWR ${player.acwr} - Monitorare carico`,
          priority: 'medium'
        });
      }
    });

    // PB della settimana
    const weeklyPBs = filteredSessions.filter(s => {
      const player = players.find(p => p.id === s.playerId);
      if (!player) return false;
      
      const allPlayerSessions = performanceData.filter(ps => ps.playerId === s.playerId);
      const playerMaxSpeed = Math.max(...allPlayerSessions.map(ps => ps.top_speed_kmh || 0));
      
      return s.top_speed_kmh === playerMaxSpeed && s.top_speed_kmh > 0;
    });

    if (weeklyPBs.length > 0) {
      weeklyPBs.forEach(pb => {
        const player = players.find(p => p.id === pb.playerId);
        if (player) {
          alerts.push({
            type: 'success',
            playerName: `${player.firstName} ${player.lastName}`,
            message: `🏆 Nuovo PB velocità: ${pb.top_speed_kmh} km/h`,
            priority: 'info'
          });
        }
      });
    }

    return {
      teamKPIs,
      readinessBoard,
      trends,
      alerts,
      filteredSessions
    };
  }, [players, performanceData, dateRange, positionFilter, sessionTypeFilter]);

  /**
   * 🎮 EVENT HANDLERS
   */
  const handleViewChange = (view, data = null) => {
    setCurrentView(view);
    if (view === 'dossier' && data) {
      setSelectedPlayer(data);
    }
  };

 
  const clearComparison = () => {
    setCompareIds([]);
    if (currentView === 'compare') {
      setCurrentView('overview');
    }
  };

  /**
   * 🎨 RENDER HELPERS
   */
  const renderKPICard = (icon, label, value, unit, trend, trendLabel) => (
            <div className="card kpi-card">
      <div className="kpi-header">
        <div className="kpi-icon">
          {icon}
        </div>
        <div className={`kpi-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
          {trend > 0 ? <ArrowUp size={12} /> : trend < 0 ? <ArrowDown size={12} /> : null}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="kpi-unit">{unit}</span>
        </div>
      </div>
      <div className="kpi-footer">
        <span className="kpi-comparison">vs {trendLabel}</span>
        <span className="kpi-period">{dateRange}</span>
      </div>
    </div>
  );

  const renderReadinessCard = (player) => (
    <div key={player.id} className={`readiness-card status-${player.status}`}>
      <div className="player-avatar">
        {player.firstName?.[0]}{player.lastName?.[0]}
      </div>
      <div className="player-name-small">{player.firstName} {player.lastName}</div>
              <div className="player-position-small">{translatePosition(player.position)}</div>
      <div className={`acwr-value status-${player.status}`}>
        {player.acwr}
      </div>
      <div className="acwr-label">ACWR</div>
    </div>
  );

  /**
   * 🖥️ MAIN RENDER
   */
  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-card">
          <div className="loading-bar large loading-shimmer"></div>
          <div className="loading-bar medium loading-shimmer"></div>
          <div className="loading-bar small loading-shimmer"></div>
        </div>
      </div>
    );
  }

     if (error) {
     return (
       <div className="analytics-container">
         <div className="error-state">
           <h3>Errore caricamento dati</h3>
           <p>{error}</p>
           <button className="btn btn-primary" onClick={fetchData}>
             Riprova
           </button>
         </div>
       </div>
     );
   }

  // 🏠 OVERVIEW MODE
  if (currentView === 'overview') {
    return (
      <div className="analytics-container">
        {/* Header */}
                 <div className="analytics-header">
           <div className="analytics-title">
             <div>
               <h1>Team Analytics</h1>
               <p className="analytics-subtitle">
                 Dashboard prestazioni squadra • {analytics.teamKPIs.activePlayers} giocatori attivi
               </p>
             </div>
           </div>
         </div>

        {/* Filtri */}
                 <div className="analytics-filters">
           <div className="filter-group">
             <span className="filter-label">Periodo</span>
             <select 
               className="filter-select" 
               value={dateRange} 
               onChange={(e) => setDateRange(e.target.value)}
             >
               <option value="7d">Ultimi 7 giorni</option>
               <option value="14d">Ultimi 14 giorni</option>
               <option value="30d">Ultimi 30 giorni</option>
               <option value="90d">Ultimi 90 giorni</option>
               <option value="all">Tutto</option>
             </select>
           </div>

           <div className="filter-group">
             <span className="filter-label">Ruolo</span>
             <select 
               className="filter-select" 
               value={positionFilter} 
               onChange={(e) => setPositionFilter(e.target.value)}
             >
               <option value="all">Tutti</option>
               <option value="GOALKEEPER">Portieri</option>
               <option value="DEFENDER">Difensori</option>
               <option value="MIDFIELDER">Centrocampisti</option>
               <option value="FORWARD">Attaccanti</option>
             </select>
           </div>

           <div className="filter-group">
             <span className="filter-label">Tipo</span>
             <select 
               className="filter-select" 
               value={sessionTypeFilter} 
               onChange={(e) => setSessionTypeFilter(e.target.value)}
             >
               <option value="all">Tutti</option>
               <option value="Training">Allenamento</option>
               <option value="Match">Partita</option>
             </select>
           </div>

                     <div className="quick-filters">
             <button 
               className={`quick-filter-btn ${autoRefresh ? 'active' : ''}`}
               onClick={() => setAutoRefresh(!autoRefresh)}
             >
               Auto-refresh
             </button>
             <button className="quick-filter-btn" onClick={fetchData}>
               Aggiorna
             </button>
           </div>
        </div>

        {/* Quick Actions */}
        <div className="card dashboard-card section-spacing">
          <div className="card-header">
            <h2>Azioni Rapide</h2>
          </div>
                     <div className="quick-actions">
             <button 
               className="btn btn--ghost quick-action-btn"
               onClick={() => handleViewChange('player-list')}
             >
               <span>Analizza Giocatori</span>
             </button>
             <button 
               className="btn btn--ghost quick-action-btn"
               onClick={() => handleViewChange('reports')}
             >
               <span>Genera Report</span>
             </button>
             <button className="btn btn--ghost quick-action-btn">
               <span>Trend Analysis</span>
             </button>
             <button className="btn btn--ghost quick-action-btn">
               <span>Configurazione</span>
             </button>
           </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-overview section-spacing">
          {renderKPICard(
            <Activity size={24} />,
            'Sessioni Totali',
            analytics.teamKPIs.totalSessions,
            '',
            parseFloat(analytics.trends.sessionsTrend),
            'periodo precedente'
          )}
          {renderKPICard(
            <Target size={24} />,
            'Distanza Media',
            analytics.teamKPIs.avgDistance,
            ' m',
            parseFloat(analytics.trends.distanceTrend),
            'periodo precedente'
          )}
          {renderKPICard(
            <Zap size={24} />,
            'Player Load Medio',
            analytics.teamKPIs.avgPlayerLoad,
            '',
            parseFloat(analytics.trends.loadTrend),
            'periodo precedente'
          )}
          {renderKPICard(
            <Award size={24} />,
            'Velocità Max',
            analytics.teamKPIs.maxSpeed,
            ' km/h',
            0,
            'record stagionale'
          )}
        </div>

        {/* Alerts */}
                 {analytics.alerts.length > 0 && (
           <div className="mapping-warnings section-spacing">
             <div className="warnings-content">
               <h4>Alert Sistema ({analytics.alerts.length})</h4>
               <ul>
                 {analytics.alerts.slice(0, 3).map((alert, idx) => (
                   <li key={idx}>
                     <strong>{alert.playerName}:</strong> {alert.message}
                   </li>
                 ))}
                 {analytics.alerts.length > 3 && (
                   <li>... e altri {analytics.alerts.length - 3} alert</li>
                 )}
               </ul>
             </div>
           </div>
         )}

        {/* RAG Readiness Board */}
                 <div className="readiness-board section-spacing">
           <div className="board-header">
             <h2 className="board-title">
               Readiness Board (ACWR)
             </h2>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-dot green"></div>
                <span>Ottimale (0.8-1.3)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot yellow"></div>
                <span>Attenzione (1.3-1.5)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot red"></div>
                <span>Rischio (&gt;1.5 o &lt;0.7)</span>
              </div>
            </div>
          </div>
          <div className="readiness-grid">
            {analytics.readinessBoard.slice(0, 12).map(renderReadinessCard)}
          </div>
        </div>

        {/* Last Update */}
        <div className="kpi-footer" style={{textAlign: 'center', marginTop: '20px', opacity: 0.7}}>
          <small>Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}</small>
        </div>
      </div>
    );
  }

  // 👥 PLAYER LIST MODE
  if (currentView === 'player-list') {
    return (
      <PlayerList
        players={players}
        performanceData={analytics.filteredSessions}
        onSelect={(player) => handleViewChange('dossier', player)}
        onCompareChange={setCompareIds}
        compareIds={compareIds}
        onBack={() => handleViewChange('overview')}
        onStartCompare={() => handleViewChange('compare')}
      />
    );
  }

// 👤 PLAYER DOSSIER MODE
if (currentView === 'dossier' && selectedPlayer) {
  if (loadingPlayerData) {
    return (
      <div className="analytics-container">
        <div className="loading-card">
          <div className="loading-text">Caricamento dati completi giocatore...</div>
        </div>
      </div>
    );
  }

  const playerFilteredSessions = analytics.filteredSessions.filter(s => s.playerId === selectedPlayer.id);
  
  return (
    <PlayerDossier
      player={selectedPlayer}
      sessions={playerFilteredSessions}
      allSessions={playerAllData}
      onBack={() => handleViewChange('player-list')}
    />
  );
}

  // ⚖️ COMPARE MODE
  if (currentView === 'compare' && compareIds.length > 0) {
    const comparePlayers = players.filter(p => compareIds.includes(p.id));
    
    return (
      <ComparePanel
        players={comparePlayers}
        onClose={clearComparison}
        onBack={() => handleViewChange('player-list')}
      />
    );
  }

  // 📄 REPORTS MODE
  if (currentView === 'reports') {
    return (
      <Reports
        teamStats={analytics.teamKPIs}
        players={players}
        sessions={analytics.filteredSessions}
        alerts={analytics.alerts}
        onBack={() => handleViewChange('overview')}
      />
    );
  }

  // Fallback
  return (
    <div className="analytics-container">
      <div className="error-state">
        <h3>Vista non riconosciuta</h3>
        <button className="btn btn-primary" onClick={() => handleViewChange('overview')}>
          Torna alla Dashboard
        </button>
      </div>
    </div>
  );
};

export default Analytics;