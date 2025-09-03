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
  Users,
  Shield
} from 'lucide-react';
import { apiFetch } from '../../utils/http';
import { useFilters } from '../../modules/filters/index.js';
import { FiltersBar } from '../../modules/filters/index.js';

import '../../styles/performance-players-list.css';

const CompareOverlay = ({ 
  playerIds, 
  filters, 
  onClose,
  onOpenExtended 
}) => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('panoramica');

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

  // Helper per role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'POR': return <Shield size={16} />;
      case 'DIF': return <Target size={16} />;
      case 'CEN': return <Activity size={16} />;
      case 'ATT': return <ArrowUpRight size={16} />;
      default: return <Users size={16} />;
    }
  };

  // Caricamento dati confronto
  useEffect(() => {
    if (!playerIds || playerIds.length === 0) return;

    const fetchCompareData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 🔧 FIX: Sanificazione ID giocatori (solo numeri)
        const ids = Array.from(new Set(
          (playerIds || [])
            .map(p => Number(p?.id ?? p))
            .filter(Number.isFinite)            // solo numeri
        ));

        if (ids.length === 0) {
          setError('Seleziona almeno un giocatore da confrontare.');
          setPlayers([]);
          return;
        }

        // 🔧 FIX: Costruzione URL con URLSearchParams
        const qs = new URLSearchParams();
        qs.set('players', ids.join(','));
        
        if (filters.period) qs.set('period', filters.period);
        if (filters.sessionType) qs.set('sessionType', filters.sessionType);
        if (filters.roles && filters.roles.length > 0) qs.set('roles', filters.roles.join(','));
        if (filters.status) qs.set('status', filters.status);
        if (filters.startDate) qs.set('startDate', filters.startDate);
        if (filters.endDate) qs.set('endDate', filters.endDate);

        const url = `/api/performance/compare?${qs.toString()}`;
        console.log('🔵 CompareOverlay: fetch URL:', url); // INFO DEV - rimuovere in produzione

        const response = await apiFetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('🟢 CompareOverlay: dati ricevuti:', data); // INFO DEV - rimuovere in produzione
        
        // 🔧 FIX: Estrai i giocatori dalla risposta corretta dell'API
        const playersData = data.players || [];
        setPlayers(playersData);
      } catch (err) {
        console.error('🔴 CompareOverlay: errore nel caricamento confronto:', err);
        setError('Errore nel caricamento: ' + err.message);
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompareData();
  }, [playerIds, filters]);

  // Gestione ESC per chiudere
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Toggle filtri
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (isLoading) {
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

  if (error || !players || players.length === 0) {
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
            <p>Errore nel caricamento: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcola metriche aggregate per il confronto
  const totalDistance = players.reduce((sum, p) => sum + (Number(p.total_distance_m) || 0), 0);
  const totalMinutes = players.reduce((sum, p) => sum + (Number(p.duration_minutes) || 0), 0);
  const totalPlayerLoad = players.reduce((sum, p) => sum + (Number(p.player_load || p.training_load) || 0), 0);
  const avgPlayerLoad = totalMinutes > 0 ? totalPlayerLoad / totalMinutes : 0;

  return (
    <div className="dossier-drawer">
      
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

      {/* KPI Header identico al DossierDrawer */}
      <div className="kpi-header">
        <div className="kpi-item">
          <div className="kpi-label">
            <Zap size={14} /> PL/min
          </div>
          <div className="kpi-value">
            {safeDec(avgPlayerLoad, 2)}
            <span className="kpi-trend">
              {getTrendIcon(0)}
              0%
            </span>
          </div>
          <div className="kpi-percentile">P5000 ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Activity size={14} /> HSR
          </div>
          <div className="kpi-value">
            {safeInt(players.reduce((sum, p) => sum + (Number(p.distance_15_20_kmh_m || p.distance_20_25_kmh_m || p.distance_over_25_kmh_m) || 0), 0))} m
            <span className="kpi-trend">
              {getTrendIcon(0)}
              0%
            </span>
          </div>
          <div className="kpi-percentile">P5000 ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <ArrowUpRight size={14} /> Sprint/90
          </div>
          <div className="kpi-value">
            {safeDec(players.reduce((sum, p) => sum + (Number(p.sprint_distance_m) || 0), 0) / (totalMinutes / 90), 2)}
            <span className="kpi-trend">
              {getTrendIcon(0)}
              0%
            </span>
          </div>
          <div className="kpi-percentile">P5000 ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Target size={14} /> Vel. max
          </div>
          <div className="kpi-value">
            {safeDec(Math.max(...players.map(p => Number(p.top_speed_kmh) || 0)), 2)} km/h
            <span className="kpi-trend">
              {getTrendIcon(0)}
              0%
            </span>
          </div>
          <div className="kpi-percentile">P5000 ruolo</div>
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
              {players.slice(0, 5).map((player, index) => (
                <div key={index} className="session-item">
                  <div className="session-date">{new Date(player.session_date).toLocaleDateString('it-IT')}</div>
                  <div className="session-type">{player.session_type || 'N/A'}</div>
                  <div className="session-duration">{player.duration_minutes || 0}'</div>
                  <div className="session-load">{safeDec(player.player_load || player.training_load, 1)}</div>
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
                <span className="zone-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.distance_15_20_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 20-25 km/h</span>
                <span className="zone-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.distance_20_25_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 25+ km/h</span>
                <span className="zone-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.distance_over_25_kmh_m) || 0), 0))} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">HSR Totale</span>
                <span className="zone-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.distance_15_20_kmh_m || p.distance_20_25_kmh_m || p.distance_over_25_kmh_m) || 0), 0))} m</span>
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
                <span className="accdec-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.num_acc_over_3_ms2) || 0), 0))}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Decelerazioni</span>
                <span className="accdec-value">{safeInt(players.reduce((sum, p) => sum + (Number(p.num_dec_over_minus3_ms2) || 0), 0))}</span>
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
          <button className="btn primary" onClick={onOpenExtended}>
            Apri Confronto Esteso
          </button>
        </div>
      </div>

    </div>
  );
};

export default CompareOverlay;
