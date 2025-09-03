import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
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
  Filter
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/http';
import { useFilters, buildPerformanceQuery } from '../../modules/filters/index.js';
import { FiltersBar } from '../../modules/filters/index.js';

const DossierDrawer = ({ 
  playerId, 
  onClose
}) => {
  const { filters } = useFilters();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');
  const [showFilters, setShowFilters] = useState(false);

  console.log('🟢 DossierDrawer: apertura drawer per giocatore', playerId); // INFO - rimuovere in produzione

  // Helper per formattazione sicura
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const safePct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;
  const safeDec = (v, d=2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits:d, maximumFractionDigits:d }) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';

  // Helper per trend
  const getTrendIcon = (trend) => {
    if (trend === null || trend === 0) return <Minus size={12} className="text-gray-400" />;
    return trend > 0 
      ? <TrendingUp size={12} className="text-green-500" />
      : <TrendingDown size={12} className="text-red-500" />;
  };

  // === Fetch dossier con stessi parametri usati altrove ===
  useEffect(() => {
    if (!playerId) return;

    const fetchPlayerDossier = async () => {
      try {
        // 🔧 FIX: Distingui tra primo caricamento e refresh filtri
        if (player === null) {
          setInitialLoading(true);
          console.log('🔵 DossierDrawer: primo caricamento dossier', playerId); // INFO DEV - rimuovere in produzione
        } else {
          setIsRefreshing(true);
          console.log('🔵 DossierDrawer: refresh dossier per cambio filtri', playerId); // INFO DEV - rimuovere in produzione
        }
        setError(null);

        const params = buildPerformanceQuery(filters);

        // Log per debug (solo in dev)
        if (import.meta.env.DEV) {
          console.debug('[Dossier] fetch', { 
            playerId, 
            filters,
            sessionType: filters.sessionType,
            sessionName: filters.sessionName,
            normalize: filters.normalize,
            sortBy: filters.sortBy,
            url: `/api/performance/player/${playerId}/dossier?${params}`
          });
        }

        const response = await apiFetch(`/api/performance/player/${playerId}/dossier?${params}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setPlayer(data);
        console.log('🟢 DossierDrawer: dossier aggiornato con successo'); // INFO - rimuovere in produzione
      } catch (err) {
        console.log('🔴 DossierDrawer: errore caricamento dossier', err.message); // ERROR - mantenere essenziali
        setError(err.message);
      } finally {
        // 🔧 FIX: Reset del loading state appropriato
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchPlayerDossier();
  }, [playerId, filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.startDate, filters.endDate, filters.normalize, filters.sortBy]);

  // 🔧 FIX: Mostra skeleton solo al primo caricamento
  if (initialLoading) {
    console.log('🔵 DossierDrawer: rendering skeleton primo caricamento'); // INFO DEV - rimuovere in produzione
    return (
      <div className="dossier-drawer">
        <div className="drawer-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
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

  if (error || !player) {
    return (
      <div className="dossier-drawer">
        <div className="drawer-header">
          <h3>Errore</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <div className="error-state">
            <p>Errore nel caricamento: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dossier-drawer ${isRefreshing ? 'refreshing' : ''}`}>
      {/* 🔧 Indicatore refresh discreto */}
      {isRefreshing && (
        <div className="drawer-refresh-indicator">
          <div className="refresh-spinner"></div>
          <span>Aggiornamento...</span>
        </div>
      )}

      {/* Header con FilterBar */}
      <div className="dossier-header">
        <div className="player-info">
          <div className="player-avatar">
            {player.player.avatar ? (
              <img src={player.player.avatar} alt={player.player.name} />
            ) : (
              <div className="avatar-placeholder">
                {player.player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
          </div>
          <div className="player-details">
            <h3>{player.player.name}</h3>
            <p>{player.player.role} #{player.player.number}</p>
          </div>
        </div>
        
        {/* 🔵 FilterBar compatta per drawer */}
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

      {/* KPI Header */}
      <div className="kpi-header">
        <div className="kpi-item">
          <div className="kpi-label">
            <Zap size={14} /> PL/min
          </div>
          <div className="kpi-value">
            {safeDec(player.summary.plPerMin, 2)}
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.summary.trend?.plPerMin))}
              {safePct(player.summary.trend?.plPerMin) !== null ? `${Math.abs(safePct(player.summary.trend?.plPerMin))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{Math.round((player.percentiles?.plPerMin || 0) * 100)} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Activity size={14} /> HSR
          </div>
          <div className="kpi-value">
            {safeInt(player.summary.hsrTot)} m
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.summary.trend?.hsrTot))}
              {safePct(player.summary.trend?.hsrTot) !== null ? `${Math.abs(safePct(player.summary.trend?.hsrTot))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{Math.round((player.percentiles?.hsrTot || 0) * 100)} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <ArrowUpRight size={14} /> Sprint/90
          </div>
          <div className="kpi-value">
            {safeDec(player.summary.sprintPer90, 2)}
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.summary.trend?.sprintPer90))}
              {safePct(player.summary.trend?.sprintPer90) !== null ? `${Math.abs(safePct(player.summary.trend?.sprintPer90))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{Math.round((player.percentiles?.sprintPer90 || 0) * 100)} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Target size={14} /> Vel. max
          </div>
          <div className="kpi-value">
            {safeDec(player.summary.topSpeedMax, 2)} km/h
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.summary.trend?.topSpeedMax))}
              {safePct(player.summary.trend?.topSpeedMax) !== null ? `${Math.abs(safePct(player.summary.trend?.topSpeedMax))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{Math.round((player.percentiles?.topSpeedMax || 0) * 100)} ruolo</div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      <div className="dossier-drawer__content">
        {activeTab === 'panoramica' && (
          <div className="tab-content">
            <h4>Panoramica 30 giorni</h4>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-label">Distanza totale</span>
                <span className="stat-value">{safeInt(player.summary.distTot)} m</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Minuti totali</span>
                <span className="stat-value">{safeInt(player.summary.minutesTot)}'</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Passi totali</span>
                <span className="stat-value">{safeInt(player.summary.stepsTot)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ACWR</span>
                <span className="stat-value">{safeDec(player.summary.acwr, 2)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessioni' && (
          <div className="tab-content">
            <h4>Sessioni recenti</h4>
            <div className="sessions-list">
              {player.breakdown?.bySession?.map((session, index) => (
                <div key={index} className="session-item">
                  <div className="session-date">{session.date}</div>
                  <div className="session-type">{session.type}</div>
                  <div className="session-duration">{session.minutes}'</div>
                  <div className="session-load">{safeDec(session.PL, 1)}</div>
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
                <span className="zone-value">{safeInt(player.intensity?.zone15_20)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 20-25 km/h</span>
                <span className="zone-value">{safeInt(player.intensity?.zone20_25)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 25+ km/h</span>
                <span className="zone-value">{safeInt(player.intensity?.zone25plus)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">HSR Totale</span>
                <span className="zone-value">{safeInt(player.intensity?.hsrTot)} m</span>
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
                <span className="cardio-value">{safeInt(player.cardio?.avgHR)} bpm</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">Freq. cardiaca max</span>
                <span className="cardio-value">{safeInt(player.cardio?.maxHR)} bpm</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE medio</span>
                <span className="cardio-value">{safeDec(player.cardio?.rpeAvg, 1)}</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE sessione</span>
                <span className="cardio-value">{safeInt(player.cardio?.rpeSession)}</span>
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
                <span className="accdec-value">{safeInt(player.accDec?.acc)}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Decelerazioni</span>
                <span className="accdec-value">{safeInt(player.accDec?.dec)}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Impatto stimato</span>
                <span className="accdec-value">{safeInt(player.accDec?.impact)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="drawer-footer">
        <div className="drawer-footer__left">
          <button type="button" className="btn ghost" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div className="drawer-footer__right">
          <Link
            to={`/performance/dossier/${playerId}?${buildPerformanceQuery(filters)}`}
            className="btn primary"
          >
            Apri in pagina
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DossierDrawer;
