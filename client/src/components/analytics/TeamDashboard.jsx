import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Target, 
  Heart, 
  AlertTriangle, 
  Users, 
  Clock,
  MapPin,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus,
  Dumbbell,
  BarChart3,
  Layers,
  Flame,
  Wind,
  ArrowUpRight,
  TrendingDown,
  ArrowLeftRight,
  HeartPulse,
  ShieldCheck,
  AlertCircle,
  Crown,
  Calendar,
  X,
  Filter
} from 'lucide-react';

// STEP 5: Import UI components per toggle Team/Player
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import useAuthStore from '../../store/authStore';
import { apiFetch } from '../../utils/http';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';
import PageLoader from '../ui/PageLoader';
import Segmented from '../ui/Segmented';
import { formatItalianNumber, formatItalianCurrency } from '../../utils/italianNumbers';
import '../../modules/filters/filters.css';
import '../../components/ui/ui-components.css';
import '../../styles/team-dashboard.css';

// Cache per i dati della dashboard
const dashboardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

const TeamDashboard = () => {
  const { user } = useAuthStore();
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // STEP 6: Stato per toggle Team/Player
  const [viewMode, setViewMode] = useState("team"); // "team" | "player"
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [data, setData] = useState({});

  // Helper per formattazione numeri
  const fmtInt = (n) => formatItalianNumber(n ?? 0);
  const fmtDec = (n, d = 2) => formatItalianNumber(n ?? 0);

  // Helper per trend
  const fmtTrend = (v) => (v === null || v === undefined) ? 'n/a' : `${v.toFixed(1)}%`;
  const isTrendNa = (v) => v === null || v === undefined;
  const isTrendZero = (v) => v === 0;
  const getTrendDisplay = (v) => {
    if (isTrendNa(v)) return 'n/a';
    if (isTrendZero(v)) return '0%';
    return `${Math.abs(v)}%`;
  };

  // Funzione per verificare se i dati in cache sono ancora validi
  const isCacheValid = useCallback((cacheKey) => {
    const cached = dashboardCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < CACHE_DURATION;
  }, []);

  // STEP 8: Fetch condizionato per Team/Player
  useEffect(() => {
    if (viewMode === "team") {
      fetchDashboardData();
    } else if (viewMode === "player" && selectedPlayer) {
      fetchPlayerData();
    }
  }, [viewMode, selectedPlayer]);

  // Funzione per caricare i dati del team dal backend con cache
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `${user?.teamId}-${filters.period}-${filters.sessionType}-${filters.sessionName}-${filters.roles?.join(',') || 'all'}`;
    
    // Se non è un refresh forzato e abbiamo dati validi in cache, usali
    if (!forceRefresh && isCacheValid(cacheKey)) {
      const cached = dashboardCache.get(cacheKey);
      setDashboardData(cached.data);
      setData(cached.data.data || cached.data); // STEP 8: Usa struttura unificata
      setLastFetchTime(cached.timestamp);
      setIsLoading(false);
      return;
    }

    try {
      // Mostra loading solo se non abbiamo dati o è un refresh
      if (!dashboardData || forceRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true); // Loading silenzioso per aggiornamenti
      }
      
      setError(null);
      
      if (!user?.teamId) {
        throw new Error('Nessun team associato all\'utente');
      }

      const query = buildPerformanceQuery(filters);
      console.log('🔵 TeamDashboard: chiamata API team con query:', query); // DEBUG
      const response = await apiFetch(`/api/dashboard/stats/team?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // DEBUG: Log della risposta per verificare i filtri
      console.log('🟢 TeamDashboard: risposta API team ricevuta:', {
        totalSessions: responseData.data?.summary?.totalSessions,
        filters: responseData.filters,
        sessionType: responseData.filters?.sessionType
      });
      
      // Salva in cache
      dashboardCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
      
      setDashboardData(responseData);
      setData(responseData.data || responseData); // STEP 8: Usa struttura unificata
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Errore nel caricamento dati dashboard team:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.teamId, dashboardData, isCacheValid, filters]);

  // STEP 8: Funzione per caricare i dati del player
  const fetchPlayerData = useCallback(async () => {
    if (!selectedPlayer) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (!user?.teamId) {
        throw new Error('Nessun team associato all\'utente');
      }

      const query = buildPerformanceQuery(filters);
      console.log('🔵 TeamDashboard: chiamata API player con query:', query); // DEBUG
      const response = await apiFetch(`/api/dashboard/stats/player/${selectedPlayer}?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      console.log('🟢 TeamDashboard: risposta API player ricevuta:', {
        player: responseData.player,
        totalSessions: responseData.data?.summary?.totalSessions,
        eventsSummary: responseData.data?.eventsSummary,
        fullResponse: responseData
      });
      
      setData(responseData.data || responseData);
      setDashboardData(responseData.data || responseData); // 🔧 FIX: Passa i dati corretti a dashboardData
      console.log('🔍 TeamDashboard: dashboardData aggiornato con:', {
        eventsSummary: responseData.data?.eventsSummary,
        hasEventsSummary: !!responseData.data?.eventsSummary,
        fullDashboardData: responseData.data || responseData
      });
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Errore nel caricamento dati dashboard player:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.teamId, selectedPlayer, filters]);

  // STEP 7: Carica lista giocatori
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user?.teamId) return;
      
      try {
        console.log('🟢 TeamDashboard: caricamento giocatori per teamId:', user.teamId);
        const response = await apiFetch('/api/players');
        if (response.ok) {
          const data = await response.json();
          console.log('🟢 TeamDashboard: risposta API giocatori:', data);
          
          // 🔧 FIX: Gestisce entrambi i formati di risposta (come AnalyticsAdvanced)
          const playersData = data.data || data.players || data || [];
          console.log('🟢 TeamDashboard: giocatori estratti:', playersData.length);
          setPlayers(playersData);
        } else {
          console.error('🔴 TeamDashboard: errore API giocatori:', response.status);
        }
      } catch (err) {
        console.error('🔴 TeamDashboard: errore nel caricamento giocatori:', err);
      }
    };

    fetchPlayers();
  }, [user?.teamId]);

  // Caricamento iniziale e quando cambiano i filtri
  useEffect(() => {
    if (user?.teamId) {
      if (viewMode === "team") {
        fetchDashboardData();
      } else if (viewMode === "player" && selectedPlayer) {
        fetchPlayerData();
      }
    }
  }, [user?.teamId, filters, viewMode, selectedPlayer]);

  // Funzione per refresh manuale
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Memoizzazione delle funzioni di utilità
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'red': return '#EF4444';
      default: return '#6B7280';
    }
  }, []);

  const getTrendIcon = useCallback((trend) => {
    if (isTrendNa(trend)) return <Minus size={16} className="trend-neutral" />;
    if (trend > 0) return <ArrowUp size={16} className="trend-up" />;
    if (trend < 0) return <ArrowDown size={16} className="trend-down" />;
    return <Minus size={16} className="trend-neutral" />;
  }, []);

  // Memoizzazione del calcolo del periodo di visualizzazione
  const periodDisplay = useMemo(() => {
    const now = new Date();
    let startDate, endDate;
    
    switch (filters.period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        // 🔧 FIX: Calcola primo giorno del mese corrente invece di ultimi 30 giorni
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        // 🔧 FIX: Calcola primo giorno del trimestre corrente invece di ultimi 90 giorni
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = now;
        break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
          } else {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
        }
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }
    
    return {
      start: startDate.toLocaleDateString('it-IT'),
      end: endDate.toLocaleDateString('it-IT')
    };
  }, [filters.period, filters.startDate, filters.endDate]);

  // Componente MetricCard ottimizzato CON TREND e supporto "stimato"
  const MetricCard = useCallback(({ title, value, unit, icon: Icon, trend, isEstimated }) => (
    <div className="metric-card">
      <div className="metric-header">
        {Icon && <Icon size={20} />}
        <span className="metric-title">
          {title}
          {isEstimated && <span className="estimated-badge">stimato</span>}
        </span>
      </div>
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className="metric-trend">
          {getTrendIcon(trend)}
          <span>{getTrendDisplay(trend)}</span>
        </div>
      )}
    </div>
  ), [getTrendIcon, getTrendDisplay]);

  // Loading state ottimizzato
  if (isLoading && !dashboardData) {
    return <PageLoader message="Caricamento Dashboard…" minHeight={360} />;
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="team-dashboard">
        <div className="error-state">
          <AlertTriangle size={48} color="#EF4444" />
          <p>Errore nel caricamento: {error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Se non abbiamo dati, mostra stato vuoto
  if (!dashboardData) {
    return (
      <div className="team-dashboard">
        <div className="empty-state">
          <p>Nessun dato disponibile</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`team-dashboard density-${filters.density}`}>
      {/* Header con refresh indicator */}
      <div className="dashboard-header">
        <h1>Dashboard Squadra</h1>
        <div className="period-display">
          {lastFetchTime && (
            <span className="last-update">
              • Aggiornato: {new Date(lastFetchTime).toLocaleTimeString('it-IT')}
            </span>
          )}
          {isRefreshing && <span className="refreshing-indicator">🔄</span>}
        </div>
      </div>

      {/* Filtri unificati - stesso stile dei contratti */}
      <div className="filters-container">
        <FiltersBar 
          mode="team"
          showSort={false}
          showNormalize={false}
        />
      </div>

      {/* Contenuto Dashboard */}
      <div className="dashboard-content">
        {/* STEP 9: Toggle UI per Team/Player */}
        <div className="flex items-center justify-between mb-4">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="team">Squadra</TabsTrigger>
              <TabsTrigger value="player">Giocatore</TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === "player" && (
            <div className="filter-box">
              {/* Icona utente */}
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <select
                value={selectedPlayer || ''}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="filter-select"
              >
                <option value="">Seleziona giocatore</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {(player.lastName || '').toUpperCase()} {player.firstName || ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Panoramica Generale */}
        <div className="dashboard-section">
          <h2>Panoramica Generale</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Sessioni Totali"
              value={fmtInt(data.summary?.totalSessions || 0)}
              trend={dashboardData.trends?.totalSessions}
              icon={Activity}
            />
            <MetricCard
              title="Allenamenti Totali"
              value={(() => {
                const value = fmtInt(dashboardData.eventsSummary?.numeroAllenamenti || 0);
                console.log('🔍 Card Allenamenti Totali:', {
                  dashboardDataEventsSummary: dashboardData.eventsSummary,
                  numeroAllenamenti: dashboardData.eventsSummary?.numeroAllenamenti,
                  finalValue: value
                });
                return value;
              })()}
              unit="giorni"
              icon={Users}
            />
            <MetricCard
              title="Partite Disputate"
              value={(() => {
                const value = fmtInt(dashboardData.eventsSummary?.numeroPartite || 0);
                console.log('🔍 Card Partite Disputate:', {
                  dashboardDataEventsSummary: dashboardData.eventsSummary,
                  numeroPartite: dashboardData.eventsSummary?.numeroPartite,
                  finalValue: value
                });
                return value;
              })()}
              unit="giorni"
              icon={Target}
            />
            <MetricCard
              title="Durata Media Sessione"
              value={fmtDec(data.summary?.avgSessionDuration || 0)}
              unit="min"
              trend={dashboardData.trends?.avgSessionDuration}
              icon={Clock}
            />
            <MetricCard
              title={viewMode === 'player' ? 'Distanza Media Giocatore' : 'Distanza Media Squadra'}
              value={fmtDec(data.summary?.avgTeamDistance || 0)}
              unit="m"
              trend={dashboardData.trends?.avgTeamDistance}
              icon={MapPin}
            />
            <MetricCard
              title="Player Load Medio"
              value={fmtDec(data.summary?.avgPlayerLoad || 0)}
              unit="load"
              trend={dashboardData.trends?.avgPlayerLoad}
              icon={Gauge}
            />
            <MetricCard
              title="Velocità Max Media"
              value={fmtDec(data.summary?.avgMaxSpeed || 0)}
              unit="km/h"
              trend={dashboardData.trends?.avgMaxSpeed}
              icon={Zap}
            />
          </div>
          
          {/* Highlight Card per Best Performer */}
          <div className="highlight-card">
            <div className="highlight-header">
              <Crown className="crown-icon" size={24} />
              <span className="highlight-label">Best Performer Settimanale</span>
            </div>
            <div className="highlight-value">
              {data.summary?.speedPB?.player || 'N/A'} - {fmtDec(data.summary?.speedPB?.value || 0)} km/h
            </div>
          </div>
        </div>

        {/* Carico & Volumi */}
        <div className="dashboard-section">
          <h2>Carico & Volumi</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Distanza Totale"
              value={fmtInt(data.load?.totalDistance || 0)}
              unit="m"
              trend={dashboardData.trends?.totalDistance}
              icon={Layers}
            />
            <MetricCard
              title="Sprint Totali"
              value={fmtInt(data.load?.totalSprints || 0)}
              unit="sprint"
              trend={dashboardData.trends?.totalSprints}
              icon={Target}
            />
            <MetricCard
              title="Passi Totali"
              value={fmtInt(data.load?.totalSteps || 0)}
              unit="passi"
              trend={dashboardData.trends?.totalSteps}
              icon={BarChart3}
            />
          </div>
        </div>

        {/* Intensità */}
        <div className="dashboard-section">
          <h2>Intensità</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Distanza/min"
              value={fmtDec(data.intensity?.avgDistancePerMin || 0)}
              unit="m/min"
              trend={dashboardData.trends?.avgDistancePerMin}
              icon={Flame}
            />
            <MetricCard
              title="Player Load/min"
              value={fmtDec(data.intensity?.avgPlayerLoadPerMin || 0)}
              unit="load/min"
              trend={dashboardData.trends?.avgPlayerLoadPerMin}
              icon={Zap}
            />
            <MetricCard
              title="Sprint per Sessione"
              value={fmtDec(data.intensity?.avgSprintsPerSession || 0)}
              unit="sprint/sess."
              trend={dashboardData.trends?.avgSprintsPerSession}
              icon={Target}
            />
          </div>
        </div>

        {/* Alta Velocità & Sprint */}
        <div className="dashboard-section">
          <h2>Alta Velocità & Sprint</h2>
          <div className="metrics-grid">
            <MetricCard
              title="HSR Totale"
              value={fmtInt(data.speed?.totalHSR || 0)}
              unit="m"
              trend={dashboardData.trends?.totalHSR}
              icon={Wind}
            />
            <MetricCard
              title="Sprint Distance Media"
              value={fmtDec(data.speed?.avgSprintDistance || 0)}
              unit="m"
              trend={dashboardData.trends?.avgSprintDistance}
              icon={ArrowUpRight}
            />
          </div>
        </div>

        {/* Accelerazioni & Decelerazioni */}
        <div className="dashboard-section">
          <h2>Accelerazioni & Decelerazioni</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Acc+Dec per Sessione"
              value={fmtDec(data.accelerations?.avgAccDecPerSession || 0)}
              unit="per sess."
              trend={dashboardData.trends?.avgAccDecPerSession}
              icon={ArrowLeftRight}
            />
            <MetricCard
              title="Impatti Stimati"
              value={fmtInt(data.accelerations?.totalImpacts || 0)}
              unit="impatti"
              trend={dashboardData.trends?.totalImpacts}
              icon={TrendingDown}
            />
          </div>
        </div>

        {/* Cardio & Percezione */}
        <div className="dashboard-section">
          <h2>Cardio & Percezione</h2>
          <div className="metrics-grid">
            <MetricCard
              title={viewMode === 'player' ? 'HR Medio Giocatore' : 'HR Medio Squadra'}
              value={fmtDec(data.cardio?.avgHR || 0)}
              unit="bpm"
              trend={dashboardData.trends?.avgHR}
              icon={HeartPulse}
            />
            <MetricCard
              title={viewMode === 'player' ? 'HR Max Giocatore' : 'HR Max Squadra'}
              value={fmtDec(data.cardio?.maxHR || 0)}
              unit="bpm"
              trend={dashboardData.trends?.maxHR}
              icon={HeartPulse}
            />
            <MetricCard
              title="RPE Medio"
              value={data.cardio?.avgRPE !== null ? fmtDec(data.cardio.avgRPE) : 'N/A'}
              trend={dashboardData.trends?.avgRPE}
              icon={ShieldCheck}
              isEstimated={data.cardio?.isRPEEstimated}
            />
            <MetricCard
              title="Session-RPE Totale"
              value={data.cardio?.totalSessionRPE !== null ? fmtInt(data.cardio.totalSessionRPE) : 'N/A'}
              trend={dashboardData.trends?.totalSessionRPE}
              icon={Dumbbell}
              isEstimated={data.cardio?.isRPEEstimated}
            />
          </div>
        </div>

        {/* Alert Giocatori Critici */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <div className="dashboard-section">
            <div className="alert-card">
              <div className="alert-header">
                <AlertCircle size={24} />
                <span>Alert Giocatori Critici</span>
              </div>
              <div className="alert-list">
                {dashboardData.alerts.map((alert, index) => (
                  <div key={index} className={`alert-item alert-${alert.type}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Readiness Board */}
        <div className="dashboard-section">
          <div className="team-readiness">
            <div className="readiness-header">
              <Users size={24} />
              <span>{viewMode === 'player' ? 'Readiness Giocatore (ACWR)' : 'Readiness Squadra (ACWR)'}</span>
            </div>
            <div className="readiness-metrics-grid">
              <div className="readiness-metric">
                <span className="metric-label">ACWR Medio</span>
                <span className="metric-value">
                  {Number.isFinite(Number(data.readiness?.avgACWR)) ? fmtDec(data.readiness.avgACWR) : 'N/A'}
                </span>
                <div className="acwr-ranges">
                  <div className="range-item">
                    <span className="range-label">Basso</span>
                    <span className="range-value">&lt; 0.8</span>
                  </div>
                  <div className="range-item optimal">
                    <span className="range-label">Ottimale</span>
                    <span className="range-value">0.8 - 1.3</span>
                  </div>
                  <div className="range-item">
                    <span className="range-label">Alto</span>
                    <span className="range-value">&gt; 1.3</span>
                  </div>
                </div>
              </div>
              <div className="readiness-metric">
                <span className="metric-label">Giocatori a Rischio</span>
                <span className="metric-value risk">
                  {data.readiness?.playersAtRisk || 0}/{data.readiness?.totalPlayers || 0}
                </span>
              </div>
              <div className="readiness-metric">
                <span className="metric-label">Giocatori Ottimali</span>
                <span className="metric-value optimal">
                  {data.readiness?.playersOptimal || 0}/{data.readiness?.totalPlayers || 0}
                </span>
              </div>
              <div className="readiness-metric">
                <span className="metric-label">% Rischio</span>
                <span className="metric-value percentage">
                  {data.readiness?.riskPercentage || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
