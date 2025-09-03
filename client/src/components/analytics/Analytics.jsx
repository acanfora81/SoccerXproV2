// client/src/components/analytics/Analytics.jsx
// 🏆 SISTEMA ANALYTICS PROFESSIONALE - Il WOW dei preparatori atletici!

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, TrendingUp, Activity, AlertTriangle, 
  Calendar, Filter, Download, RefreshCw, Eye, GitCompare,
  Zap, Heart, Timer, Target, Award, ArrowUp, ArrowDown,
  ChevronLeft, Settings, MoreVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';

// Importa gli altri componenti
import PlayerList from './PlayerList';
import PlayerDossier from './PlayerDossier';
import ComparePanel from './ComparePanel';
import ReportPreview from './ReportPreview';
import Reports from './Reports';
import TeamDashboard from './TeamDashboard';

// Stili avanzati
import '../../styles/analytics.css';
import '../../modules/filters/filters.css';
import PageLoader from '../ui/PageLoader';

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
  const { filters } = useFilters();
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
  
  // Stato per aggiornamenti real-time
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  console.log('🟢 Analytics: componente inizializzato con filtri compatti'); // INFO - rimuovere in produzione

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
      const query = buildPerformanceQuery(filters);
      const performanceResponse = await fetch(`/api/performance?${query}`, {
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
  }, [filters]);

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
  }, [players, performanceData, filters]);

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
    return <PageLoader message="Caricamento Analytics Avanzate…" minHeight={360} />;
  }

     if (error) {
     return (
       <div className={`analytics-container density-${filters.density}`}>
         {/* 🎯 FilterBar compatta per Analytics */}
         <div className="analytics-filters-section">
           <button 
             className="filters-toggle-btn"
             onClick={() => setShowFilters(!showFilters)}
           >
             <Filter size={16} />
             Filtri {showFilters ? '−' : '+'}
           </button>
           
           {showFilters && (
             <div className="analytics-filters-expanded">
               <FiltersBar 
                 pageId="ANALYTICS_MAIN" 
                 showSort={true}
                 mode="expanded"
               />
             </div>
           )}
         </div>
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

  // 🏠 OVERVIEW MODE - Team Dashboard
  if (currentView === 'overview') {
    return (
      <div className={`analytics-container density-${filters.density}`}>
        {/* FilterBar minimal come DossierDrawer */}
        <div className="drawer-filters-section">
          <button 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtri {showFilters ? '−' : '+'}
          </button>
          
          {showFilters && (
            <div className="drawer-filters-expanded">
              <FiltersBar 
                pageId="ANALYTICS_MAIN" 
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        <TeamDashboard />
      </div>
    );
  }

  // 👥 PLAYER LIST MODE
  if (currentView === 'player-list') {
    return (
      <div className={`analytics-container density-${filters.density}`}>
        {/* FilterBar minimal come DossierDrawer */}
        <div className="drawer-filters-section">
          <button 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtri {showFilters ? '−' : '+'}
          </button>
          
          {showFilters && (
            <div className="drawer-filters-expanded">
              <FiltersBar 
                pageId="ANALYTICS_MAIN" 
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        <PlayerList
          players={players}
          performanceData={analytics.filteredSessions}
          onSelect={(player) => handleViewChange('dossier', player)}
          onCompareChange={setCompareIds}
          compareIds={compareIds}
          onBack={() => handleViewChange('overview')}
          onStartCompare={() => handleViewChange('compare')}
        />
      </div>
    );
  }

// 👤 PLAYER DOSSIER MODE
if (currentView === 'dossier' && selectedPlayer) {
  if (loadingPlayerData) {
    return <PageLoader message="Caricamento dossier giocatore…" minHeight={360} />;
  }

  const playerFilteredSessions = analytics.filteredSessions.filter(s => s.playerId === selectedPlayer.id);
  
  return (
    <div className={`analytics-container density-${filters.density}`}>
      {/* 🎯 FilterBar compatta per Analytics */}
      <div className="analytics-filters-section">
        <button 
          className="filters-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filtri {showFilters ? '−' : '+'}
        </button>
        
        {showFilters && (
          <div className="analytics-filters-expanded">
            <FiltersBar 
              pageId="ANALYTICS_MAIN" 
              showSort={true}
              mode="expanded"
            />
          </div>
        )}
      </div>
      <PlayerDossier
        player={selectedPlayer}
        sessions={playerFilteredSessions}
        allSessions={playerAllData}
        onBack={() => handleViewChange('player-list')}
      />
    </div>
  );
}

  // ⚖️ COMPARE MODE
  if (currentView === 'compare' && compareIds.length > 0) {
    const comparePlayers = players.filter(p => compareIds.includes(p.id));
    
    return (
      <div className={`analytics-container density-${filters.density}`}>
        {/* FilterBar minimal come DossierDrawer */}
        <div className="drawer-filters-section">
          <button 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtri {showFilters ? '−' : '+'}
          </button>
          
          {showFilters && (
            <div className="drawer-filters-expanded">
              <FiltersBar 
                pageId="ANALYTICS_MAIN" 
                showNormalize={true}
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        <ComparePanel
          players={comparePlayers}
          onClose={clearComparison}
          onBack={() => handleViewChange('player-list')}
        />
      </div>
    );
  }

  // 📄 REPORTS MODE
  if (currentView === 'reports') {
    return (
      <div className={`analytics-container density-${filters.density}`}>
        {/* FilterBar minimal come DossierDrawer */}
        <div className="drawer-filters-section">
          <button 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtri {showFilters ? '−' : '+'}
          </button>
          
          {showFilters && (
            <div className="drawer-filters-expanded">
              <FiltersBar 
                pageId="ANALYTICS_MAIN" 
                showNormalize={true}
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        <Reports
          teamStats={analytics.teamKPIs}
          players={players}
          sessions={analytics.filteredSessions}
          alerts={analytics.alerts}
          onBack={() => handleViewChange('overview')}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className={`analytics-container density-${filters.density}`}>
      {/* 🎯 FilterBar compatta per Analytics */}
      <div className="analytics-filters-section">
        <button 
          className="filters-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filtri {showFilters ? '−' : '+'}
        </button>
        
        {showFilters && (
          <div className="analytics-filters-expanded">
            <FiltersBar 
              pageId="ANALYTICS_MAIN" 
              showNormalize={true}
              showSort={true}
              mode="expanded"
            />
          </div>
        )}
      </div>
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