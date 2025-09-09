import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, 
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
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';
import { apiFetch } from '../../utils/http';
import Segmented from '../../components/ui/Segmented';
import '../../modules/filters/filters.css';

export default function DossierPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  console.log('🟢 DossierPage: componente inizializzato con loading ottimizzato'); // INFO - rimuovere in produzione

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

  // Handler per selezione date
  const handleDateSelect = ({ startDate, endDate }) => {
    console.log('🔵 DossierPage: date selezionate', { startDate, endDate }); // INFO DEV - rimuovere in produzione
    // Aggiorna filtri se necessario
    setIsDatePickerOpen(false);
  };



  // Caricamento dati giocatore
  useEffect(() => {
    if (!playerId) return;

    const fetchPlayerDossier = async () => {
      try {
        // 🔧 FIX: Distingui tra primo caricamento e refresh
        if (player === null) {
          setInitialLoading(true);
          console.log('🔵 DossierPage: primo caricamento in corso'); // INFO DEV - rimuovere in produzione
        } else {
          setIsRefreshing(true);
          console.log('🔵 DossierPage: refresh dati in corso'); // INFO DEV - rimuovere in produzione
        }
        setError(null);

        const query = buildPerformanceQuery(filters);

        // Log per debug (solo in dev)
        if (import.meta.env.DEV) {
          console.debug('[DossierPage] fetch', { 
            playerId, 
            filters,
            sessionType: filters.sessionType,
            sessionName: filters.sessionName,
            normalize: filters.normalize,
            sortBy: filters.sortBy,
            url: `/api/performance/player/${playerId}/dossier?${query}`
          });
        }

        const response = await apiFetch(`/api/performance/player/${playerId}/dossier?${query}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setPlayer(data);
        console.log('🟢 DossierPage: dati caricati con successo'); // INFO - rimuovere in produzione
      } catch (err) {
        console.log('🔴 DossierPage: errore caricamento dossier', err.message); // ERROR - mantenere essenziali
        setError(err.message);
      } finally {
        // 🔧 FIX: Reset del loading state appropriato
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchPlayerDossier();
      }, [playerId, filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.startDate, filters.endDate, filters.normalize, filters.sortBy]);

  // 🔧 FIX: Mostra loading skeleton solo al primo caricamento
  if (initialLoading) {
    console.log('🔵 DossierPage: rendering loading skeleton'); // INFO DEV - rimuovere in produzione
    return (
      <div className={`dossier-page density-${filters.density}`}>
        <div className="page-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
        <div className="page-content">
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
      <div className={`dossier-page density-${filters.density}`}>
        <div className="page-header">
          <h3>Errore</h3>
          <button className="btn-secondary" onClick={() => navigate('/performance/players')}>
            ← Torna alla Lista
          </button>
        </div>
        <div className="page-content">
          <div className="error-state">
            <p>Errore nel caricamento: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dossier-page density-${filters.density} ${isRefreshing ? 'refreshing' : ''}`}>
      {/* Header con FilterBar */}
      <div className="page-header">
        {/* 🔧 Indicatore refresh discreto */}
        {isRefreshing && (
          <div className="refresh-indicator">
            <div className="refresh-spinner"></div>
            <span>Aggiornamento...</span>
          </div>
        )}

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
        
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/performance/players')}>
            ← Torna alla Lista
          </button>
        </div>
      </div>

      {/* Filtri unificati - stesso stile dei contratti */}
      <div className="filters-container">
        <FiltersBar 
          mode="dossier"
          showSort={true}
        />
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
      <div className="page-tabs">
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
      <div className="page-content">
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
            {player.breakdown?.bySession?.length > 0 ? (
              <div className="sessions-list">
                {player.breakdown.bySession.map((session, index) => (
                  <div key={index} className="session-item">
                    <div className="session-date">{session.date}</div>
                    <div className="session-type">{session.type}</div>
                    <div className="session-duration">{session.minutes}'</div>
                    <div className="session-load">{safeDec(session.PL, 1)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Nessuna sessione nel periodo selezionato</p>
                <p>Modifica i filtri sopra per vedere le sessioni</p>
              </div>
            )}
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

        {/* DatePicker */}
        {isDatePickerOpen && (
          <div className="datepicker-overlay" onClick={() => setIsDatePickerOpen(false)}>
            <div className="datepicker" onClick={(e) => e.stopPropagation()}>
              <div className="datepicker-header">
                <h3>Seleziona Periodo</h3>
                <button onClick={() => setIsDatePickerOpen(false)} className="close-btn">
                  <X size={16} />
                </button>
              </div>
              <div className="datepicker-body">
                <p>Filtro date in sviluppo</p>
              </div>
              <div className="datepicker-footer">
                <button onClick={() => setIsDatePickerOpen(false)} className="btn-secondary">
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
