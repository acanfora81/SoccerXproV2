// client/src/components/analytics/ComparePanel.jsx
// ⚖️ CONFRONTO MULTI-PLAYER - IDENTICO AL DOSSIER

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  Maximize2,
  Minimize2,
  GitCompare,
  Filter,
  ChevronUp,
  ChevronDown,
  Zap, 
  Activity, 
  ArrowUpRight, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Heart,
  Gauge,
  Users
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../utils/http';
import { useFilters, buildPerformanceQuery } from '../../modules/filters/index.js';
import { FiltersBar } from '../../modules/filters/index.js';

// Import di tutte le sezioni di AnalyticsAdvanced
import CaricoVolumi from './sections/CaricoVolumi';
import Intensita from './sections/Intensita';
import AltaVelocita from './sections/AltaVelocita';
import Accelerazioni from './sections/Accelerazioni';
import Energetico from './sections/Energetico';
import RischioRecupero from './sections/RischioRecupero';
import Comparazioni from './sections/Comparazioni';
import ReportCoach from './sections/ReportCoach';

import '../../styles/performance-players-list.css';

const ComparePanel = ({ 
  players = [], 
  performanceData = [],
  onClose,
  onBack 
}) => {
  const { filters } = useFilters();
  
  const [compareData, setCompareData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');
  const [showFilters, setShowFilters] = useState(false);

  console.log('🟢 ComparePanel: apertura confronto per', players.length, 'giocatori');

  // Helper per formattazione sicura (identici a DossierDrawer)
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const safePct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;
  const safeDec = (v, d=2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits:d, maximumFractionDigits:d }) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';

  // Helper per trend (identici a DossierDrawer)
  const getTrendIcon = (trend) => {
    if (trend === null || trend === 0) return <Minus size={12} className="text-gray-400" />;
    return trend > 0 
      ? <TrendingUp size={12} className="text-green-500" />
      : <TrendingDown size={12} className="text-red-500" />;
  };

  // === Fetch dati confronto ===
  useEffect(() => {
    if (!players || players.length === 0) return;

    const fetchCompareData = async () => {
      try {
        // Distingui tra primo caricamento e refresh filtri
        if (compareData.length === 0) {
          setInitialLoading(true);
          console.log('🔵 ComparePanel: primo caricamento confronto', players.map(p => p.id));
        } else {
          setIsRefreshing(true);
          console.log('🔵 ComparePanel: refresh confronto per cambio filtri', players.map(p => p.id));
        }
        setError(null);

        const params = buildPerformanceQuery(filters);
        const playerIds = players.map(p => p.id);
        
        console.log('🔵 ComparePanel: fetch dati confronto', { 
          playerIds, 
          filters,
          url: `/api/performance/compare?players=${playerIds.join(',')}&${params}`
        });

        const response = await apiFetch(`/api/performance/compare?players=${playerIds.join(',')}&${params}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('🟢 ComparePanel: dati confronto caricati', { 
          giocatori: data.players?.length || 0, 
          sessioni: data.allSessions?.length || 0 
        });
        
        setCompareData(data.allSessions || []);
        
      } catch (err) {
        console.log('🔴 ComparePanel: errore caricamento dati confronto:', err.message);
        setError(err.message);
      } finally {
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchCompareData();
  }, [players, filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.startDate, filters.endDate, filters.normalize, filters.sortBy]);

  // Toggle filtri
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (!players || players.length === 0) {
    return (
      <div className="dossier-drawer">
        <div className="dossier-header">
          <h3>Errore</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dossier-content">
          <div className="error-state">
            <p>Nessun giocatore selezionato per il confronto</p>
            <button className="btn-secondary" onClick={onBack}>
              <ArrowLeft size={16} /> Torna alla Selezione
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostra skeleton solo al primo caricamento
  if (initialLoading) {
    console.log('🔵 ComparePanel: rendering skeleton primo caricamento');
    return (
      <div className="dossier-drawer">
        <div className="dossier-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dossier-content">
          <div className="loading-skeleton">
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !compareData.length) {
    return (
      <div className="dossier-drawer">
        <div className="dossier-header">
          <h3>Errore Confronto</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dossier-content">
          <div className="error-state">
            <p>Errore nel caricamento: {error || 'Nessun dato disponibile'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcola metriche aggregate per il confronto
  const totalDistance = compareData.reduce((sum, s) => sum + (Number(s.total_distance_m) || 0), 0);
  const totalMinutes = compareData.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);
  const totalPlayerLoad = compareData.reduce((sum, s) => sum + (Number(s.player_load || s.training_load) || 0), 0);
  const avgPlayerLoad = totalMinutes > 0 ? totalPlayerLoad / totalMinutes : 0;

  return (
    <div className={`dossier-drawer ${isRefreshing ? 'refreshing' : ''}`}>
      
      {/* Indicatore refresh discreto */}
      {isRefreshing && (
        <div className="drawer-refresh-indicator">
          <div className="refresh-spinner"></div>
          <span>Aggiornamento...</span>
        </div>
      )}

      {/* Header identico al DossierDrawer */}
      <div className="dossier-header">
        <div className="player-info">
          <div className="player-avatar">
            <div className="avatar-placeholder">
              <GitCompare size={24} />
            </div>
          </div>
          <div className="player-details">
            <h3>Confronto Giocatori ({players.length})</h3>
            <p>Confronto rapido - {filters.period || 'week'} • {filters.sessionType || 'all'}</p>
          </div>
        </div>
        
        {/* FilterBar compatta per drawer */}
        <div className="drawer-filters-section">
          <button 
            className="filters-toggle-btn"
            onClick={toggleFilters}
          >
            <Filter size={16} />
            Filtri {showFilters ? '−' : '+'}
          </button>
          
          {showFilters && (
            <div className="drawer-filters-expanded">
              <FiltersBar 
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* KPI Header con confronto diretto tra giocatori */}
      <div className="kpi-header">
        <div className="kpi-item">
          <div className="kpi-label">
            <Zap size={14} /> PL/min
          </div>
          <div className="kpi-comparison">
            {players.map((player, index) => {
              const stats = currentPlayerStats[player.id];
              const plPerMin = stats && stats.totalMinutes > 0 ? stats.totalPlayerLoad / stats.totalMinutes : 0;
              return (
                <div key={player.id} className="player-kpi">
                  <span className="player-name">{player.name || player.full_name || `G${index + 1}`}</span>
                  <span className="kpi-value">{safeDec(plPerMin, 2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Activity size={14} /> HSR
          </div>
          <div className="kpi-comparison">
            {players.map((player, index) => {
              const stats = currentPlayerStats[player.id];
              return (
                <div key={player.id} className="player-kpi">
                  <span className="player-name">{player.name || player.full_name || `G${index + 1}`}</span>
                  <span className="kpi-value">{safeInt(stats?.hsrDistance || 0)} m</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <ArrowUpRight size={14} /> Sprint/90
          </div>
          <div className="kpi-comparison">
            {players.map((player, index) => {
              const stats = currentPlayerStats[player.id];
              const sprintPer90 = stats && stats.totalMinutes > 0 ? stats.sprintDistance / (stats.totalMinutes / 90) : 0;
              return (
                <div key={player.id} className="player-kpi">
                  <span className="player-name">{player.name || player.full_name || `G${index + 1}`}</span>
                  <span className="kpi-value">{safeDec(sprintPer90, 2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Target size={14} /> Vel. max
          </div>
          <div className="kpi-comparison">
            {players.map((player, index) => {
              const stats = currentPlayerStats[player.id];
              return (
                <div key={player.id} className="player-kpi">
                  <span className="player-name">{player.name || player.full_name || `G${index + 1}`}</span>
                  <span className="kpi-value">{safeDec(stats?.topSpeed || 0, 2)} km/h</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sezione compatta con tabelle affiancate per confronto rapido */}
      <div className="compact-comparison-section">
        <h4 className="section-title">Confronto Rapido - Dati Principali</h4>
        <div className="comparison-tables-grid">
          {/* Tabella 1: Metriche di Volume */}
          <div className="comparison-table">
            <h5 className="table-title">
              <Gauge size={16} />
              Volume e Carico
            </h5>
            <div className="table-content">
              <div className="table-header">
                <span className="metric-label">Metrica</span>
                {players.map((player, index) => (
                  <span key={player.id} className="player-header">
                    {player.name || player.full_name || `G${index + 1}`}
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Distanza Totale</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.totalDistance || 0)} m
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Minuti Totali</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.totalMinutes || 0)}'
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Player Load</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeDec(currentPlayerStats[player.id]?.totalPlayerLoad || 0, 1)}
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">PL/min</span>
                {players.map((player) => {
                  const stats = currentPlayerStats[player.id];
                  const plPerMin = stats && stats.totalMinutes > 0 ? stats.totalPlayerLoad / stats.totalMinutes : 0;
                  return (
                    <span key={player.id} className="metric-value">
                      {safeDec(plPerMin, 2)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabella 2: Metriche di Intensità */}
          <div className="comparison-table">
            <h5 className="table-title">
              <Activity size={16} />
              Intensità e Velocità
            </h5>
            <div className="table-content">
              <div className="table-header">
                <span className="metric-label">Metrica</span>
                {players.map((player, index) => (
                  <span key={player.id} className="player-header">
                    {player.name || player.full_name || `G${index + 1}`}
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">HSR (15+ km/h)</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.hsrDistance || 0)} m
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Sprint (25+ km/h)</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.sprintDistance || 0)} m
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Velocità Max</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeDec(currentPlayerStats[player.id]?.topSpeed || 0, 2)} km/h
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Accelerazioni</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.accelerations || 0)}
                  </span>
                ))}
              </div>
              <div className="table-row">
                <span className="metric-label">Decelerazioni</span>
                {players.map((player) => (
                  <span key={player.id} className="metric-value">
                    {safeInt(currentPlayerStats[player.id]?.decelerations || 0)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs identici al DossierDrawer */}
      <div className="drawer-tabs">
        <button 
          className={`tab-btn ${activeTab === 'panoramica' ? 'active' : ''}`}
          onClick={() => setActiveTab('panoramica')}
        >
          <Gauge size={16} /> Panoramica
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sessioni' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessioni')}
        >
          <Calendar size={16} /> Sessioni
        </button>
        <button 
          className={`tab-btn ${activeTab === 'intensita' ? 'active' : ''}`}
          onClick={() => setActiveTab('intensita')}
        >
          <Activity size={16} /> Intensità
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cardio' ? 'active' : ''}`}
          onClick={() => setActiveTab('cardio')}
        >
          <Heart size={16} /> Cardio
        </button>
        <button 
          className={`tab-btn ${activeTab === 'accdec' ? 'active' : ''}`}
          onClick={() => setActiveTab('accdec')}
        >
          <ArrowUpRight size={16} /> Acc/Dec
        </button>
      </div>

      {/* Tab Content identico al DossierDrawer */}
      <div className="dossier-drawer__content">
        {activeTab === 'panoramica' && (
          <div className="tab-content">
            <h4>Panoramica {filters.period || '30 giorni'}</h4>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-label">Distanza totale</span>
                <span className="stat-value">{safeInt(totalDistance)} m</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Minuti totali</span>
                <span className="stat-value">{safeInt(totalMinutes)}'</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Passi totali</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ACWR</span>
                <span className="stat-value">0.00</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessioni' && (
          <div className="tab-content">
            <h4>Sessioni recenti</h4>
            <div className="sessions-list">
              {compareData.slice(0, 5).map((session, index) => (
                <div key={index} className="session-item">
                  <div className="session-date">{new Date(session.session_date).toLocaleDateString('it-IT')}</div>
                  <div className="session-type">{session.session_type || 'N/A'}</div>
                  <div className="session-duration">{session.duration_minutes || 0}'</div>
                  <div className="session-load">{safeDec(session.player_load || session.training_load, 1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'intensita' && (
          <div className="tab-content">
            <h4>Zone di intensità</h4>
            <div className="intensity-breakdown">
              <div className="intensity-item">
                <span className="zone-label">Zona 15-20 km/h</span>
                <span className="zone-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.distance_15_20_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 20-25 km/h</span>
                <span className="zone-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.distance_20_25_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 25+ km/h</span>
                <span className="zone-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.distance_over_25_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">HSR Totale</span>
                <span className="zone-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.distance_15_20_kmh_m || s.distance_20_25_kmh_m || s.distance_over_25_kmh_m) || 0), 0))} m</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cardio' && (
          <div className="tab-content">
            <h4>Metriche cardiovascolari</h4>
            <div className="cardio-stats">
              <div className="cardio-item">
                <span className="cardio-label">Freq. cardiaca media</span>
                <span className="cardio-value">N/A</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">Freq. cardiaca max</span>
                <span className="cardio-value">N/A</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE medio</span>
                <span className="cardio-value">N/A</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE sessione</span>
                <span className="cardio-value">N/A</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accdec' && (
          <div className="tab-content">
            <h4>Accelerazioni e decelerazioni</h4>
            <div className="accdec-stats">
              <div className="accdec-item">
                <span className="accdec-label">Accelerazioni</span>
                <span className="accdec-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.num_acc_over_3_ms2) || 0), 0))}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Decelerazioni</span>
                <span className="accdec-value">{safeInt(compareData.reduce((sum, s) => sum + (Number(s.num_dec_over_minus3_ms2) || 0), 0))}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Impatto stimato</span>
                <span className="accdec-value">N/A</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer identico al DossierDrawer */}
      <div className="drawer-footer">
        <div className="drawer-footer__left">
          <button type="button" className="btn ghost" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div className="drawer-footer__right">
          <button className="btn primary" onClick={() => window.open(`/performance/compare?players=${players.map(p => p.id).join(',')}`, '_blank')}>
            Apri in pagina
          </button>
        </div>
      </div>

    </div>
  );
};

export default ComparePanel;