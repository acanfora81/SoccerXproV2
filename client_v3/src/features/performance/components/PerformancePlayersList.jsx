import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ICONS, ICON_SIZES } from '@/config/icons-map';
import { 
  BarChart3, Layers, Zap, Heart, Crown, ArrowLeftRight, ArrowUpRight,
  Minus, TrendingUp, TrendingDown, Shield, Target, Activity, Users
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/utils/apiClient';
import { useFilters, buildPerformanceQuery, FiltersBar } from '@/modules/filters/index.js';
import CompareBar from './CompareBar';
import DossierDrawer from './DossierDrawer';
import CompareDrawer from './CompareDrawer';
import PageLoader from '@/components/ui/PageLoader';

// --- Hook debounce ---
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

// Cache per i dati dei giocatori
const playersCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minuti

const PerformancePlayersList = () => {
  const { user } = useAuthStore();
  const { filters, skipUrlSync, enableUrlSync } = useFilters();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Stati principali
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [compareMode, setCompareMode] = useState(false);
  // Tab selezionata per ciascuna card giocatore
  const [cardTabById, setCardTabById] = useState(new Map());
  // Dati dettagliati per tab (Dashboard Giocatore)
  const [playerDashById, setPlayerDashById] = useState(new Map());
  const [playerDashLoading, setPlayerDashLoading] = useState(new Map());
  // In-flight guard per richieste dettagli
  const [playerDashInFlight, setPlayerDashInFlight] = useState(new Map());
  
  // Stati per Drawer e Overlay
  const [dossierDrawer, setDossierDrawer] = useState({ open: false, playerId: null });
  const [compareDrawer, setCompareDrawer] = useState({ open: false, playerIds: [] });

  // Search debounced (per evitare chiamate a ogni tasto)
  const debouncedSearch = useDebounce(filters.search, 300);



  // Helper per formattazione sicura
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const safePct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;
  const safeDec = (v, d=2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits:d, maximumFractionDigits:d }) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';
  
  // Helper legacy per compatibilità
  const fmtInt = (n) => (n ?? 0).toLocaleString('it-IT');
  const fmtDec = (n, d = 2) => (n ?? 0).toLocaleString('it-IT', { 
    minimumFractionDigits: d, 
    maximumFractionDigits: d 
  });

  // Helper per trend
  const getTrendIcon = (trend) => {
    if (trend === null || trend === 0) return <Minus size={12} className="text-gray-400" />;
    return trend > 0 
      ? <TrendingUp size={12} className="text-green-500" />
      : <TrendingDown size={12} className="text-red-500" />;
  };

  // Helper per ACWR color
  const getACWRColor = (acwr) => {
    if (acwr >= 0.8 && acwr <= 1.3) return 'bg-green-100 text-green-800';
    if (acwr > 1.3 && acwr <= 1.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Helper per status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'return': return 'bg-yellow-100 text-yellow-800';
      case 'injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper per role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'POR': return <Shield size={16} />;
      case 'DIF': return <Target size={16} />;
      case 'CEN': return <Activity size={16} />;
      case 'ATT': return <Zap size={16} />;
      default: return <Users size={16} />;
    }
  };

  // Helper per convertire ruolo abbreviato in nome completo
  const getRoleFullName = (role) => {
    switch (role) {
      case 'POR': return 'Portiere';
      case 'DIF': return 'Difensore';
      case 'CEN': return 'Centrocampista';
      case 'ATT': return 'Attaccante';
      default: return role;
    }
  };

  // Caricamento dati
  const fetchPlayers = useCallback(async () => {
    if (!user?.teamId) return;

    // 🔧 FIX: Cache key più specifica che include timestamp per session changes
    const cacheKey = [
      user.teamId,
      filters.period, filters.sessionType, filters.sessionName,
      (filters.roles || []).join('|'),
      filters.status, filters.normalize, filters.sortBy,
      debouncedSearch,
      filters.period === 'custom' ? (filters.startDate || '') : '',
      filters.period === 'custom' ? (filters.endDate || '') : '',
      // 🔧 FIX: Aggiungi versioning per invalidare quando session_name cambia
      Math.floor(Date.now() / 10000).toString() // Cambia ogni 10 secondi per development
    ].join('::');

    const controller = new AbortController();

    // Cache - RIATTIVATA con tutti i parametri
    const cached = playersCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setPlayers(cached.data);
      setIsLoading(false);
      return () => controller.abort();
    }

    try {
      setIsLoading(true);
      setError(null);

      const query = buildPerformanceQuery(filters);
      console.log('[PERF-LIST] calling /performance/stats/players?', query);

      const data = await apiFetch(`/performance/stats/players?${query}`, { 
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=30',
          'Content-Type': 'application/json'
        }
      });
      
      // Salva in cache
      playersCache.set(cacheKey, {
        data: data.players,
        timestamp: Date.now()
      });

      setPlayers(data.players);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Errore nel caricamento giocatori:', err);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [user?.teamId, filters, debouncedSearch]);


  // Fetch dettagli Dashboard per singolo giocatore (lazy on tab open)
  const fetchPlayerDashboard = useCallback(async (playerId) => {
    if (!playerId) return;
    if (playerDashById.get(playerId)) return; // cache hit
    if (playerDashInFlight.get(playerId)) return; // già in corso

    setPlayerDashInFlight(prev => new Map(prev).set(playerId, true));
    setPlayerDashLoading(prev => new Map(prev).set(playerId, true));
    try {
      const params = new URLSearchParams();
      if (filters.period) params.set('period', filters.period);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.sessionType) params.set('sessionType', filters.sessionType);
      if (filters.sessionName) params.set('sessionName', filters.sessionName);

      const json = await apiFetch(`/dashboard/stats/player/${playerId}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = json?.data || {};
      setPlayerDashById(prev => new Map(prev).set(playerId, data));
    } catch (e) {
      console.error('Errore fetch dashboard player', playerId, e);
      setPlayerDashById(prev => new Map(prev).set(playerId, { error: true }));
    } finally {
      setPlayerDashLoading(prev => new Map(prev).set(playerId, false));
      setPlayerDashInFlight(prev => new Map(prev).set(playerId, false));
    }
  }, [filters.period, filters.startDate, filters.endDate, filters.sessionType, filters.sessionName, playerDashById]);

  // Pulisci cache dettagli quando cambiano i filtri periodo/date/sessionType/sessionName
  useEffect(() => {
    setPlayerDashById(new Map());
  }, [filters.period, filters.startDate, filters.endDate, filters.sessionType, filters.sessionName]);

  // Effetto per caricamento iniziale e cambio filtri
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Imposta tab di default "summary" (Panoramica) per tutte le card quando i giocatori sono caricati
  // E pre-carica automaticamente i dati Panoramica per tutti i giocatori
  useEffect(() => {
    if (!Array.isArray(players) || players.length === 0) return;
    
    // Imposta tab di default
    setCardTabById((prev) => {
      const next = new Map(prev);
      let changed = false;
      players.forEach((p) => {
        if (!next.has(p.id)) {
          next.set(p.id, 'summary');
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    // Pre-carica i dati Panoramica per tutti i giocatori
    players.forEach((player) => {
      if (!playerDashById.get(player.id) && !playerDashInFlight.get(player.id)) {
        fetchPlayerDashboard(player.id);
      }
    });
  }, [players, fetchPlayerDashboard, playerDashById, playerDashInFlight]);

  // Gestione selezione giocatori
  const togglePlayerSelection = useCallback((playerId) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  }, []);

  // Handler per Dossier Drawer
  const handleOpenDossier = useCallback((playerId) => {
    setDossierDrawer({ open: true, playerId });
  }, []);

  const handleCloseDossier = useCallback(() => {
    setDossierDrawer({ open: false, playerId: null });
  }, []);

  const handleOpenDossierInPage = useCallback((playerId) => {
    // Usa solo i filtri rilevanti per il dossier (period, sessionType e sessionName)
    const params = new URLSearchParams();
    if (filters.period) params.set('period', filters.period);
    if (filters.sessionType) params.set('sessionType', filters.sessionType);
    if (filters.sessionName && filters.sessionName !== 'all') params.set('sessionName', filters.sessionName);
    
    navigate(`/app/dashboard/performance/dossier/${playerId}?${params.toString()}`);
  }, [navigate, filters.period, filters.sessionType, filters.sessionName]);

  // Handler per Compare
  const handleOpenCompareQuick = useCallback(() => {
    console.log('🟢 PerformancePlayersList: handleOpenCompareQuick chiamato');
    setCompareDrawer({ open: true, playerIds: Array.from(selectedPlayers) });
  }, [selectedPlayers]);

  const handleCloseCompareDrawer = useCallback(() => {
    setCompareDrawer({ open: false, playerIds: [] });
  }, []);

  const handleOpenCompareExtended = useCallback(() => {
    const params = new URLSearchParams();
    params.set('players', Array.from(selectedPlayers).join(','));
    if (filters.search) params.set('search', filters.search);
    if (filters.period) params.set('period', filters.period);
    if (filters.sessionType) params.set('sessionType', filters.sessionType);
    if (filters.sessionTypeSimple) params.set('sessionTypeSimple', filters.sessionTypeSimple);
    if (filters.roles && filters.roles.length > 0) params.set('roles', filters.roles.join(','));
    if (filters.status) params.set('status', filters.status);
    if (filters.normalize) params.set('normalize', filters.normalize);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.viewMode) params.set('viewMode', filters.viewMode);
    if (filters.density) params.set('density', filters.density);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    
    navigate(`/performance/compare?${params.toString()}`);
  }, [navigate, selectedPlayers, filters]);


  const selectAllRole = useCallback((role) => {
    const rolePlayers = players.filter(p => p.role === role).map(p => p.id);
    setSelectedPlayers(prev => new Set([...prev, ...rolePlayers]));
  }, [players]);

  const clearSelection = useCallback(() => {
    setSelectedPlayers(new Set());
  }, []);

  // Raggruppa giocatori per ruolo
  const playersByRole = useMemo(() => {
    const grouped = {
      POR: [],
      DIF: [],
      CEN: [],
      ATT: []
    };

    // 🔧 FIX: Controlla che players sia un array valido
    if (Array.isArray(players)) {
      players.forEach(player => {
        if (player && grouped[player.role]) {
          grouped[player.role].push(player);
        }
      });
    }

    return grouped;
  }, [players]);

  // Componente Card Giocatore - Design Pulito
  const PlayerCard = useCallback(({ player, isSelected, onToggleSelection }) => {
    const selectedTab = cardTabById.get(player.id) || 'summary';
    const setTab = (tab) => {
      setCardTabById(prev => {
        const next = new Map(prev);
        next.set(player.id, tab);
        return next;
      });
      // Carica dati dashboard alla prima apertura di una tab
      if (tab && !playerDashById.get(player.id)) fetchPlayerDashboard(player.id);
    };


    return (
    <div className={`bg-white dark:bg-[#0f1424] rounded-xl border transition-all duration-200 ${
      isSelected 
        ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-500/20' 
        : 'border-2 border-blue-300 dark:border-blue-500/60 hover:shadow-md ring-1 ring-blue-300/20 dark:ring-blue-500/20 hover:ring-blue-300/30 dark:hover:ring-blue-500/30'
    }`}>
      {/* Badge Selezionato */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
          Selezionato
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white truncate">{player.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{getRoleFullName(player.role)}</div>
            {player.number && (
              <div className="text-xs text-gray-500 dark:text-gray-500">#{player.number}</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex flex-wrap gap-1">
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='summary' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('summary')}
          >
            <BarChart3 size={12} /> Panoramica
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='load' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('load')}
          >
            <Layers size={12} /> Sessioni
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='intensity' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('intensity')}
          >
            <Zap size={12} /> Intensità
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='cardio' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('cardio')}
          >
            <Heart size={12} /> Cardio
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='acc' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('acc')}
          >
            <ArrowLeftRight size={12} /> Acc/Dec
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='speed' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('speed')}
          >
            <ArrowUpRight size={12} /> Sprint
          </button>
          <button 
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedTab==='readiness' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`} 
            onClick={()=>setTab('readiness')}
          >
            <Crown size={12} /> Readiness
          </button>
        </div>
      </div>

      <div className="p-4">
        {selectedTab && playerDashLoading.get(player.id) && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500 dark:text-gray-400">Caricamento…</div>
          </div>
        )}
        {playerDashById.get(player.id)?.error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500 dark:text-red-400">Errore nel caricamento</div>
          </div>
        )}
        {selectedTab === 'summary' && playerDashById.get(player.id) && (() => {
          const d = playerDashById.get(player.id);
          const s = d?.summary || {};
          const e = d?.eventsSummary || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sessioni totali</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(s.totalSessions)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Allenamenti totali</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(e.numeroAllenamenti)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Partite disputate</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(e.numeroPartite)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Durata media sessione</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtDec(s.avgSessionDuration, 2)} min</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Distanza media squadra</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(s.avgTeamDistance)} m</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Player load medio</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtDec(s.avgPlayerLoad, 2)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Velocità max media</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtDec(s.avgMaxSpeed, 2)} km/h</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'load' && (() => {
          const d = playerDashById.get(player.id);
          const l = d?.load || {};
          return (
            <div className="grid grid-cols-1 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Distanza totale</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(l.totalDistance)} m</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sprint totali</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(l.totalSprints)} sprint</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Passi totali</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(l.totalSteps)} passi</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'intensity' && (() => {
          const d = playerDashById.get(player.id);
          const i = d?.intensity || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Distanza/min</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(i.avgDistancePerMin, 2)} m/min</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Player load/min</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(i.avgPlayerLoadPerMin, 2)} load/min</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sprint per sessione</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(i.avgSprintsPerSession, 2)} sprint/sess.</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'speed' && (() => {
          const d = playerDashById.get(player.id);
          const sp = d?.speed || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">HSR totale</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(sp.totalHSR)} m</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sprint distance media</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(sp.avgSprintDistance, 2)} m</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Distanza per sprint</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(sp.avgSprintDistancePerSprint, 2)} m</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Vel. max media</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(player.topSpeed, 2)} km/h</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'acc' && (() => {
          const d = playerDashById.get(player.id);
          const a = d?.accelerations || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Acc+Dec per sessione</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(a.avgAccDecPerSession, 2)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Impatti stimati</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{fmtInt(a.totalImpacts)}</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'cardio' && (() => {
          const d = playerDashById.get(player.id);
          const c = d?.cardio || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">HR medio</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(c.avgHR, 2)} bpm</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">HR max</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(c.maxHR, 2)} bpm</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">RPE medio</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(c.avgRPE, 2)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Session-RPE totale</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(c.totalSessionRPE, 2)}</div>
              </div>
            </div>
          );
        })()}
        {selectedTab === 'readiness' && (() => {
          const d = playerDashById.get(player.id);
          const r = d?.readiness || {};
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ACWR</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{safeDec(r.acwr ?? player.acwr, 2)}</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Rimosse badge ACWR e last session per lasciare solo le tab dentro la card */}

      {/* Footer Azioni */}
      <div className="p-4 border-t border-gray-200/50 dark:border-white/10 flex gap-2">
        <button 
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={() => handleOpenDossier(player.id)}
        >
          <ICONS.add size={ICON_SIZES.sm} /> Dossier
        </button>
        <button
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            isSelected 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' 
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          } ${!isSelected && (selectedPlayers?.size || 0) >= 8 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => onToggleSelection(player.id)}
          disabled={!isSelected && (selectedPlayers?.size || 0) >= 8}
        >
          <ICONS.compare size={ICON_SIZES.sm} />
          Confronta
        </button>
      </div>
      {/* Alert rischio infortunio spostato sotto i pulsanti, a tutta larghezza */}
      {(() => {
        const alerts = Array.isArray(player.alerts) ? player.alerts : [];
        const injury = alerts.find(a => a?.type === 'injury_risk' || a?.category === 'injury' || /infortun/i.test(a?.message || ''));
        if (!injury) return null;

        // Mappa livelli → colori: basso=verde, moderato=arancione, alto=rosso
        const level = (injury.level || '').toLowerCase();
        const isLow = level === 'info' || level === 'low' || /basso/i.test(injury.message || '');
        const isModerate = level === 'warning' || level === 'moderate' || /moderat/i.test(injury.message || '');
        const isHigh = level === 'danger' || level === 'high' || /alto|elevat/i.test(injury.message || '');

        const cls = isHigh
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          : isModerate
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700';

        return (
          <div className="px-4 pb-4">
            <div className={`w-full text-xs px-3 py-2 rounded-lg text-center ${cls}`}>
              {injury.message}
            </div>
          </div>
        );
      })()}
    </div>
  );
  }, [cardTabById, fmtDec, fmtInt, getTrendIcon, getACWRColor, selectedPlayers.size]);

  // Loading state
  if (isLoading && players.length === 0) {
    return <PageLoader message="Caricamento Performance…" minHeight={360} />;
  }

  // Error state
  if (error && players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <ICONS.warning size={48} className="text-red-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Errore nel caricamento: {error}</p>
          <button 
            onClick={fetchPlayers} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="space-y-6 p-6">

      {/* Filtri unificati */}
      <div className="bg-white dark:bg-[#0f1424] rounded-xl p-4 border border-gray-200/50 dark:border-white/10">
        <FiltersBar 
          mode="players"
          showSort={true}
          showNormalize={true}
        />
      </div>

      {/* CompareBar in alto */}
      {selectedPlayers.size > 0 && (
        <CompareBar
          count={selectedPlayers.size}
          onClear={clearSelection}
          onOpenQuick={handleOpenCompareQuick}
        />
      )}

      {/* Contenuto Principale */}
      <div className="space-y-8">
        {Object.entries(playersByRole).map(([role, rolePlayers]) => {
          if (rolePlayers.length === 0) return null;
          
          return (
            <div key={role} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {role === 'POR' ? 'Portieri' :
                   role === 'DIF' ? 'Difensori' :
                   role === 'CEN' ? 'Centrocampisti' : 'Attaccanti'}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({rolePlayers.length})</span>
                </h3>
                <button 
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  onClick={() => selectAllRole(role)}
                >
                  <ICONS.selectAll size={ICON_SIZES.sm} />
                  Seleziona tutti
                </button>
              </div>

              <div className={`grid gap-4 ${
                filters.density === 'compact' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {Array.isArray(rolePlayers) && rolePlayers.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayers.has(player.id)}
                    onToggleSelection={togglePlayerSelection}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

                    {/* Nuova CompareBar */}
       {selectedPlayers.size > 0 && (
         <CompareBar
           count={selectedPlayers.size}
           onClear={clearSelection}
           onOpenQuick={handleOpenCompareQuick}
         />
       )}

               {/* Dossier Drawer */}
        {dossierDrawer.open && (
          <DossierDrawer
            playerId={dossierDrawer.playerId}
            onClose={handleCloseDossier}
          />
        )}

      {/* Compare Drawer */}
        {compareDrawer.open && (
          <CompareDrawer
            playerIds={compareDrawer.playerIds}
            onClose={handleCloseCompareDrawer}
          />
        )}
     </div>
   );
 };

export default PerformancePlayersList;
