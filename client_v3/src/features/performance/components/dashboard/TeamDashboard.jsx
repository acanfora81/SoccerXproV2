// Percorso: client_v3/src/features/performance/components/dashboard/TeamDashboard.jsx

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/utils/apiClient';
import { useFilters, buildPerformanceQuery, FiltersBar } from '@/modules/filters/index.js';
import PageLoader from '@/components/ui/PageLoader';
import Segmented from '@/components/ui/Segmented';
import { formatItalianNumber, formatItalianCurrency } from '@/utils/italianNumbers';

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
    const cacheKey = `${user?.teamId}-${filters.period}-${filters.startDate || ''}-${filters.endDate || ''}-${filters.sessionType}-${filters.sessionName}-${filters.roles?.join(',') || 'all'}`;
    
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
      const responseData = await apiFetch(`/dashboard/stats/team?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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
      
      // Se l'API non è disponibile o non ci sono dati, mostra dati vuoti invece di errore
      const emptyData = {
        data: {
          summary: { totalSessions: 0, totalDistance: 0, avgSpeed: 0, avgHR: 0, totalPlayers: 0 },
          eventsSummary: { numeroAllenamenti: 0, numeroPartite: 0 },
          load: { totalDistance: 0, avgDistance: 0, totalDuration: 0, avgDuration: 0 },
          intensity: { avgSpeed: 0, maxSpeed: 0, avgPace: 0 },
          speed: { avgSpeed: 0, maxSpeed: 0, speedPB: { player: 'N/A', value: 0 } },
          accelerations: { totalAccelerations: 0, totalDecelerations: 0, avgAccelerations: 0 },
          cardio: { avgHR: 0, maxHR: 0, avgRPE: null, isRPEEstimated: false },
          readiness: { avgACWR: 0, playersAtRisk: 0, playersOptimal: 0, totalPlayers: 0, riskPercentage: 0 }
        },
        trends: {}
      };
      setDashboardData(emptyData);
      setData(emptyData.data);
      setError(null); // Non mostrare errore, solo dati vuoti
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
      const responseData = await apiFetch(`/dashboard/stats/player/${selectedPlayer}?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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
        const data = await apiFetch('/players');
        console.log('🟢 TeamDashboard: risposta API giocatori:', data);
        
        // 🔧 FIX: Gestisce entrambi i formati di risposta (come AnalyticsAdvanced)
        const playersData = data.data || data.players || data || [];
        console.log('🟢 TeamDashboard: giocatori estratti:', playersData.length);
        setPlayers(playersData);
      } catch (err) {
        console.error('🔴 TeamDashboard: errore nel caricamento giocatori:', err);
        setPlayers([]); // Array vuoto se l'API fallisce
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

  // Componente MetricCard con Tailwind CSS (stile client_v3)
  const MetricCard = useCallback(({ title, value, unit, icon: Icon, trend, isEstimated }) => (
    <div className="bg-white dark:bg-[#0f1424] rounded-xl p-4 border border-gray-200/50 dark:border-white/10 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={18} className="text-blue-600 dark:text-blue-400" />}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
          {isEstimated && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
              stimato
            </span>
          )}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-sm">
          {getTrendIcon(trend)}
          <span className="text-gray-600 dark:text-gray-400">{getTrendDisplay(trend)}</span>
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
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="text-center space-y-4">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Errore nel caricamento
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            {error}
          </p>
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Se non abbiamo dati, mostra stato vuoto
  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="text-center space-y-4">
          <Users size={48} className="text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nessun dato disponibile
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Non ci sono dati di performance disponibili per la squadra.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header con refresh indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dashboard Squadra
          </h2>
          {lastFetchTime && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Aggiornato: {new Date(lastFetchTime).toLocaleTimeString('it-IT')}
            </p>
          )}
        </div>
        {isRefreshing && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin">🔄</div>
            <span className="text-sm">Aggiornamento...</span>
          </div>
        )}
      </div>

      {/* Filtri unificati */}
      <div className="bg-white dark:bg-[#0f1424] rounded-xl p-4 border border-gray-200/50 dark:border-white/10">
        <FiltersBar 
          mode="team"
          showSort={false}
          showNormalize={false}
        />
      </div>

      {/* Toggle Team/Player */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="team">Squadra</TabsTrigger>
            <TabsTrigger value="player">Giocatore</TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "player" && (
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500 dark:text-gray-400" />
            <select
              value={selectedPlayer || ''}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Panoramica Generale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3 mb-3">
            <Crown size={24} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
              Best Performer Settimanale
            </span>
          </div>
          <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
            {data.summary?.speedPB?.player || 'N/A'} - {fmtDec(data.summary?.speedPB?.value || 0)} km/h
          </div>
        </div>
      </div>

      {/* Carico & Volumi */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Carico & Volumi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Intensità</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alta Velocità & Sprint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accelerazioni & Decelerazioni</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cardio & Percezione</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Alert Giocatori Critici</h3>
              </div>
              <div className="space-y-2">
                {dashboardData.alerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      alert.type === 'danger' 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-700' 
                        : alert.type === 'warning'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Readiness Board */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f1424] rounded-xl p-6 border border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Users size={24} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewMode === 'player' ? 'Readiness Giocatore (ACWR)' : 'Readiness Squadra (ACWR)'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ACWR Medio con ranges */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ACWR Medio</span>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Number.isFinite(Number(data.readiness?.avgACWR)) ? fmtDec(data.readiness.avgACWR) : 'N/A'}
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Basso</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">&lt; 0.8</span>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <span className="text-green-700 dark:text-green-400 font-medium">Ottimale</span>
                    <span className="text-green-700 dark:text-green-400 font-medium">0.8 - 1.3</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Alto</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">&gt; 1.3</span>
                  </div>
                </div>
              </div>
              
              {/* Giocatori a Rischio */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giocatori a Rischio</span>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {data.readiness?.playersAtRisk || 0}/{data.readiness?.totalPlayers || 0}
                </div>
              </div>
              
              {/* Giocatori Ottimali */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giocatori Ottimali</span>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {data.readiness?.playersOptimal || 0}/{data.readiness?.totalPlayers || 0}
                </div>
              </div>
              
              {/* % Rischio */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">% Rischio</span>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {data.readiness?.riskPercentage || 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default TeamDashboard;
