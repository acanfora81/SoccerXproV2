// client/src/components/analytics/PlayerList.jsx
// 👥 LISTA GIOCATORI AVANZATA con micro-insights e confronti

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Users, TrendingUp, TrendingDown, Minus,
  Eye, GitCompare, ArrowLeft, AlertTriangle, Award,
  Activity, Zap, Target, Clock, Heart, BarChart3,
  CheckCircle2, XCircle, MinusCircle, Calendar
} from 'lucide-react';

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
 * 🎯 PLAYER LIST COMPONENT
 * 
 * Features WOW:
 * - Ricerca intelligente con filtri multipli
 * - Mini-insights per ogni giocatore (sparklines, trend, PB)
 * - Selezione multipla per confronti
 * - Ordinamento dinamico
 * - Status indicators real-time
 */
const PlayerList = ({ 
  players = [], 
  performanceData = [], 
  onSelect, 
  onCompareChange, 
  compareIds = [],
  onBack,
  onStartCompare 
}) => {
  // 🔧 FIX: Stato per i dati completi di ogni giocatore
  const [allPlayerData, setAllPlayerData] = useState({});
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d'); // 🔧 FIX: Aggiunto filtro temporale
  
  // DEBUG: Log quando cambia timeRange
  console.log('🟡 PlayerList - timeRange cambiato a:', timeRange);
  
  // 🔧 FIX: Monitora cambiamenti di timeRange
  useEffect(() => {
    console.log('🟢 PlayerList - useEffect timeRange cambiato:', timeRange);
  }, [timeRange]);
  
  // 🔧 FIX: Carica dati completi per ogni giocatore
  useEffect(() => {
    const fetchAllPlayerData = async () => {
      if (players.length === 0) return;
      
      setLoadingPlayerData(true);
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
        setAllPlayerData(sessionsData);
        console.log('🟢 PlayerList - Dati completi caricati per', Object.keys(sessionsData).length, 'giocatori');
      } catch (error) {
        console.log('🔴 Errore caricamento dati completi PlayerList:', error);
      } finally {
        setLoadingPlayerData(false);
      }
    };

    fetchAllPlayerData();
  }, [players]);
  
  const [sortBy, setSortBy] = useState('name'); // name, performance, acwr, last-session
  const [sortDirection, setSortDirection] = useState('asc');

  console.log('🔵 PlayerList renderizzato con', players.length, 'giocatori'); // INFO DEV

  /**
   * 📊 CALCOLA ANALYTICS PER OGNI GIOCATORE
   */
  const playersWithAnalytics = useMemo(() => {
    console.log('🔴 DEBUG PlayerList - Players:', players.length);
    console.log('🔴 DEBUG PlayerList - All player data loaded:', Object.keys(allPlayerData).length);
    const now = new Date();
    
    // 🔧 FIX: Calcolo dinamico basato su timeRange
    const getDaysBack = (range) => {
      switch(range) {
        case '7d': return 7;
        case '14d': return 14;
        case '30d': return 30;
        case '90d': return 90;
        case 'all': return 365; // Per "tutto" usiamo 1 anno
        default: return 7;
      }
    };
    
    const daysBack = getDaysBack(timeRange);
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const last28Days = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const lastRangeDays = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    console.log('🔵 PlayerList - timeRange:', timeRange, 'daysBack:', daysBack, 'cutoff:', lastRangeDays.toLocaleDateString()); // DEBUG

    return players.map(player => {
      const playerSessions = allPlayerData[player.id] || [];
      
      if (playerSessions.length === 0) {
        return {
          ...player,
          analytics: {
            totalSessions: 0,
            avgDistance: 0,
            avgPlayerLoad: 0,
            maxSpeed: 0,
            acwr: 0,
            acwrStatus: 'red',
            lastSession: null,
            trend7d: 'neutral',
            weeklyLoad: 0,
            monthlyAvg: 0,
            sparklineData: [],
            personalBests: 0,
            availability: 'inactive'
          }
        };
      }

      // Sessioni recenti
      const sessions7d = playerSessions.filter(s => new Date(s.session_date) >= last7Days);
      const sessions28d = playerSessions.filter(s => new Date(s.session_date) >= last28Days);
      const sessionsRange = timeRange === 'all' ? playerSessions : playerSessions.filter(s => new Date(s.session_date) >= lastRangeDays);
      
      // DEBUG: Log per verificare il filtraggio
      if (player.firstName === 'Alessandro') { // Solo per debug
        console.log('🔵 PlayerList -', player.firstName, 'total sessions:', playerSessions.length, 'filtered sessions:', sessionsRange.length, 'timeRange:', timeRange);
        
        // 🔧 DEBUG: Mostra le date delle sessioni per capire il problema
        const sessionDates = playerSessions.map(s => new Date(s.session_date).toLocaleDateString()).slice(0, 5);
        console.log('🔵 PlayerList - Date sessioni Alessandro:', sessionDates);
        console.log('🔵 PlayerList - Cutoff date:', lastRangeDays.toLocaleDateString());
      }

      // KPI base - usiamo le sessioni filtrate per il periodo selezionato
      const totalSessions = playerSessions.length;
      const sessionsForAvg = sessionsRange.length > 0 ? sessionsRange : playerSessions;
      const avgDistance = Math.round(sessionsForAvg.reduce((acc, s) => acc + (s.total_distance_m || 0), 0) / sessionsForAvg.length);
      const avgPlayerLoad = Math.round(sessionsForAvg.reduce((acc, s) => acc + (s.player_load || 0), 0) / sessionsForAvg.length);
      const maxSpeed = Math.max(...sessionsForAvg.map(s => s.top_speed_kmh || 0), 0);
      
      // DEBUG: Log dei valori calcolati
      if (player.firstName === 'Alessandro') {
        console.log('🔵 PlayerList - Valori calcolati per', timeRange, ':', {
          avgDistance,
          avgPlayerLoad,
          maxSpeed,
          sessionsCount: sessionsForAvg.length
        });
      }
      
      // ACWR Calculation
      const acuteLoad = sessions7d.reduce((acc, s) => acc + (s.player_load || 0), 0);
      const chronicLoad = sessions28d.reduce((acc, s) => acc + (s.player_load || 0), 0) / 4;
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
      let acwrStatus = 'green';
      if (acwr < 0.7 || acwr > 1.5) {
        acwrStatus = 'red';
      } else if (acwr < 0.8 || acwr > 1.3) {
        acwrStatus = 'yellow';
      }

      // Trend ultimi 7 giorni vs precedenti 7
      const prev7Days = playerSessions.filter(s => {
        const sessionDate = new Date(s.session_date);
        return sessionDate >= new Date(last7Days.getTime() - (7 * 24 * 60 * 60 * 1000)) && sessionDate < last7Days;
      });

      const current7dAvg = sessions7d.length > 0 ? sessions7d.reduce((acc, s) => acc + (s.player_load || 0), 0) / sessions7d.length : 0;
      const prev7dAvg = prev7Days.length > 0 ? prev7Days.reduce((acc, s) => acc + (s.player_load || 0), 0) / prev7Days.length : 0;
      
      let trend7d = 'neutral';
      if (prev7dAvg > 0) {
        const trendPercentage = ((current7dAvg - prev7dAvg) / prev7dAvg) * 100;
        if (trendPercentage > 10) trend7d = 'up';
        else if (trendPercentage < -10) trend7d = 'down';
      }

      // Sparkline data (ultimi 14 punti)
      const sparklineData = playerSessions
        .slice(-14)
        .map(s => ({
          date: s.session_date,
          value: s.player_load || 0,
          distance: s.total_distance_m || 0
        }));

      // Personal Bests questa settimana
      const weeklyPBs = sessions7d.filter(s => {
        const playerMaxSpeed = Math.max(...playerSessions.map(ps => ps.top_speed_kmh || 0));
        const playerMaxDistance = Math.max(...playerSessions.map(ps => ps.total_distance_m || 0));
        return s.top_speed_kmh === playerMaxSpeed || s.total_distance_m === playerMaxDistance;
      }).length;

      // Availability status
      const lastSessionDate = playerSessions.length > 0 ? 
        new Date(Math.max(...playerSessions.map(s => new Date(s.session_date)))) : null;
      
      let availability = 'active';
      if (!lastSessionDate || (now - lastSessionDate) > (7 * 24 * 60 * 60 * 1000)) {
        availability = 'inactive';
      } else if ((now - lastSessionDate) > (3 * 24 * 60 * 60 * 1000)) {
        availability = 'warning';
      }

      return {
        ...player,
        analytics: {
          totalSessions,
          avgDistance,
          avgPlayerLoad,
          maxSpeed,
          acwr: acwr.toFixed(2),
          acwrStatus,
          lastSession: playerSessions[playerSessions.length - 1],
          trend7d,
          weeklyLoad: acuteLoad,
          monthlyAvg: Math.round(chronicLoad),
          sparklineData,
          personalBests: weeklyPBs,
          availability,
          sessions7d: sessions7d.length,
          sessionsRange: sessionsRange.length, // 🔧 FIX: Sessioni nel periodo selezionato
          sessions28d: sessions28d.length
        }
      };
    });
  }, [players, allPlayerData, timeRange]);

  /**
   * 🔍 FILTRI E RICERCA
   */
  const filteredPlayers = useMemo(() => {
    let filtered = playersWithAnalytics.filter(player => {
      // Ricerca per nome
      const matchesSearch = searchTerm === '' || 
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.shirtNumber && player.shirtNumber.toString().includes(searchTerm));

      // Filtro posizione
      const matchesPosition = positionFilter === 'all' || player.position === positionFilter;

      // Filtro status
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && player.analytics.availability === 'active') ||
        (statusFilter === 'warning' && player.analytics.availability === 'warning') ||
        (statusFilter === 'inactive' && player.analytics.availability === 'inactive') ||
        (statusFilter === 'risk' && player.analytics.acwrStatus === 'red');

      return matchesSearch && matchesPosition && matchesStatus;
    });

    // Ordinamento
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`;
          valueB = `${b.firstName} ${b.lastName}`;
          break;
        case 'performance':
          valueA = a.analytics.avgPlayerLoad;
          valueB = b.analytics.avgPlayerLoad;
          break;
        case 'acwr':
          valueA = parseFloat(a.analytics.acwr);
          valueB = parseFloat(b.analytics.acwr);
          break;
        case 'last-session':
          valueA = a.analytics.lastSession ? new Date(a.analytics.lastSession.session_date) : new Date(0);
          valueB = b.analytics.lastSession ? new Date(b.analytics.lastSession.session_date) : new Date(0);
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string') {
        return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
    });

    return filtered;
  }, [playersWithAnalytics, searchTerm, positionFilter, statusFilter, timeRange, sortBy, sortDirection]);

  /**
   * 🎮 EVENT HANDLERS
   */
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  const handleCompareToggle = (playerId) => {
    const newCompareIds = compareIds.includes(playerId)
      ? compareIds.filter(id => id !== playerId)
      : [...compareIds, playerId].slice(0, 8); // 🔧 AGGIORNATO: Max 8 confronti
    
    // 🔔 Notifica se raggiunto il limite massimo
    if (!compareIds.includes(playerId) && compareIds.length >= 8) {
      alert('Limite massimo di 8 giocatori per confronto raggiunto. Rimuovi un giocatore per aggiungerne un altro.');
    }
    
    onCompareChange(newCompareIds);
  };

  /**
   * 🎨 RENDER HELPERS
   */
  const renderSparkline = (data) => {
  if (!data || data.length === 0) return <div className="sparkline-empty">-</div>;
  
  // Fix per single data point
  if (data.length === 1) {
    return (
      <svg viewBox="0 0 100 100" className="sparkline">
        <circle cx="50" cy="50" r="2" fill="currentColor" />
      </svg>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1; // Fix divisione per zero
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

    return (
      <svg viewBox="0 0 100 100" className="sparkline">
        <polyline 
          points={points} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
          className="sparkline-path"
        />
      </svg>
    );
  };

  const renderTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp size={12} className="trend-up" />;
      case 'down': return <TrendingDown size={12} className="trend-down" />;
      default: return <Minus size={12} className="trend-neutral" />;
    }
  };

  const renderACWRStatus = (status, value) => (
    <div className={`acwr-indicator status-${status}`}>
      <div className={`acwr-dot status-${status}`}></div>
      <span className="acwr-text">{value}</span>
    </div>
  );

  const renderAvailabilityStatus = (availability) => {
    const statusConfig = {
      active: { icon: CheckCircle2, color: '#10B981', label: 'Attivo' },
      warning: { icon: MinusCircle, color: '#F59E0B', label: 'Attenzione' },
      inactive: { icon: XCircle, color: '#EF4444', label: 'Inattivo' }
    };
    
    const config = statusConfig[availability];
    const Icon = config.icon;
    
    return (
      <div className="availability-status" style={{ color: config.color }}>
        <Icon size={12} />
        <span>{config.label}</span>
      </div>
    );
  };

  /**
   * 🖥️ MAIN RENDER
   */
  
  // Loading state mentre carichiamo i dati completi
  if (loadingPlayerData) {
    return (
      <div className="analytics-container">
        <div className="loading-card">
          <div className="loading-text">Caricamento dati giocatori...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title">
          <Users size={40} />
          <div>
            <h1>Lista Giocatori</h1>
            <p className="analytics-subtitle">
              Analizza performance individuali • {filteredPlayers.length} di {players.length} giocatori
            </p>
          </div>
        </div>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
      </div>

      {/* Comparison Mode Banner */}
      {compareIds.length > 0 && (
        <div className="comparison-mode">
          <div className="comparison-info">
            <GitCompare size={20} />
            <div className="comparison-count">
              {compareIds.length} giocatori selezionati per confronto
              <span className="comparison-limit">(max 8)</span>
            </div>
            <div className="selected-players">
              {compareIds.map(id => {
                const player = players.find(p => p.id === id);
                return player ? (
                  <div key={id} className="selected-player-tag">
                    {player.firstName} {player.lastName}
                    <button 
                      className="remove-player"
                      onClick={() => handleCompareToggle(id)}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div className="comparison-actions">
            <button 
              className="btn btn-primary"
              onClick={onStartCompare}
              disabled={compareIds.length < 2}
            >
              <BarChart3 size={16} />
              Confronta Ora
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => onCompareChange([])}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Filtri e Ricerca */}
      <div className="analytics-filters">
        <div className="filter-group">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cerca giocatore, ruolo o numero..."
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
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
          <Activity size={16} />
          <span className="filter-label">Status</span>
          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tutti</option>
            <option value="active">Attivi</option>
            <option value="warning">Attenzione</option>
            <option value="inactive">Inattivi</option>
            <option value="risk">Rischio ACWR</option>
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={16} />
          <span className="filter-label">Periodo</span>
          <select 
            className="filter-select" 
            value={timeRange} 
            onChange={(e) => {
              console.log('🟠 PlayerList - onChange timeRange:', e.target.value);
              setTimeRange(e.target.value);
            }}
          >
            <option value="7d">7 giorni</option>
            <option value="14d">14 giorni</option>
            <option value="30d">30 giorni</option>
            <option value="90d">90 giorni</option>
            <option value="all">Tutto</option>
          </select>
        </div>

        <div className="quick-filters">
          <button 
            className={`quick-filter-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            Nome {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`quick-filter-btn ${sortBy === 'performance' ? 'active' : ''}`}
            onClick={() => handleSort('performance')}
          >
            Performance {sortBy === 'performance' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`quick-filter-btn ${sortBy === 'acwr' ? 'active' : ''}`}
            onClick={() => handleSort('acwr')}
          >
            ACWR {sortBy === 'acwr' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="players-analytics-grid">
        {filteredPlayers.map(player => (
          <div 
            key={player.id} 
            className={`player-analytics-card ${compareIds.includes(player.id) ? 'selected-for-compare' : ''}`}
          >
            {/* Performance Indicator */}
            <div className={`performance-indicator ${
              player.analytics.acwrStatus === 'green' ? 'excellent' :
              player.analytics.acwrStatus === 'yellow' ? 'warning' : 'danger'
            }`}></div>

            {/* Header */}
            <div className="player-card-header">
              <div className="player-avatar">
                {player.firstName?.[0]}{player.lastName?.[0]}
              </div>
              <div className="player-info">
                <h3 className="player-name">
                  {player.firstName} {player.lastName}
                </h3>
                <div className="player-details">
                  <span>{translatePosition(player.position)}</span>
                  <span>#{player.shirtNumber || '-'}</span>
                  {renderAvailabilityStatus(player.analytics.availability)}
                </div>
                <div className="player-status active">
                  {player.analytics.personalBests > 0 && (
                    <>
                      <Award size={12} className="award-icon" />
                      <span className="pb-text">{player.analytics.personalBests} PB</span>
                    </>
                  )}
                </div>
              </div>
              <div className="player-trend">
                {renderTrendIcon(player.analytics.trend7d)}
              </div>
            </div>

            {/* Mini Stats */}
            <div className="player-stats-mini">
              <div className="stat-mini">
                <div className="stat-mini-value">{player.analytics.avgDistance}</div>
                <div className="stat-mini-label">Dist. Avg</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-value">{player.analytics.avgPlayerLoad}</div>
                <div className="stat-mini-label">Load Avg</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-value">{player.analytics.maxSpeed}</div>
                <div className="stat-mini-label">Max Speed</div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="sparkline-container">
              <div className="sparkline-header">
                <span>Player Load (14d)</span>
                {renderACWRStatus(player.analytics.acwrStatus, player.analytics.acwr)}
              </div>
              <div className="sparkline-chart">
                {renderSparkline(player.analytics.sparklineData)}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="player-actions">
              <button 
                className={`action-btn compare ${compareIds.includes(player.id) ? 'selected' : ''}`}
                onClick={() => handleCompareToggle(player.id)}
              >
                <GitCompare size={12} />
                {compareIds.includes(player.id) ? 'Rimuovi' : 'Confronta'}
              </button>
              <button 
                className="action-btn"
                onClick={() => onSelect(player)}
              >
                <Eye size={12} />
                Dossier
              </button>
            </div>

            {/* Quick Info Footer */}
            <div className="card-quick-info">
              <span className="quick-info-item">
                <Clock size={10} />
                {player.analytics.sessionsRange} sess. ({timeRange === 'all' ? 'tutto' : timeRange})
              </span>
              <span className="quick-info-item">
                <Target size={10} />
                {player.analytics.totalSessions} totali
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlayers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>Nessun giocatore trovato</h3>
          <p>Prova a modificare i filtri di ricerca</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setPositionFilter('all');
              setStatusFilter('all');
              setTimeRange('7d');
            }}
          >
            Azzera Filtri
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerList;