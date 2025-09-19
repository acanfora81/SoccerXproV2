import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search,
  Filter,
  Users,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  FileText,
  BarChart3,
  Target,
  Heart,
  Clock,
  Calendar,
  Settings,
  Save,
  Eye,
  EyeOff,
  Grid,
  List,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  AlertTriangle,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { apiFetch } from '../../utils/http';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';
import CompareBar from './CompareBar';
import DossierDrawer from './DossierDrawer';
import CompareOverlay from './CompareOverlay';
import '../../styles/performance-players-list.css';
import '../../modules/filters/filters.css';
import PageLoader from '../ui/PageLoader';

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
  const [compareOverlay, setCompareOverlay] = useState({ open: false });

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
      console.log('[PERF-LIST] calling /api/performance/stats/players?', query);

      const response = await apiFetch(`/api/performance/stats/players?${query}`, { 
        signal: controller.signal,
        // 🔧 FIX: Aggiungi header per bypassare cache browser se necessario
        headers: {
          'Cache-Control': 'max-age=30', // Cache per 30 secondi
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
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

      const res = await apiFetch(`/api/dashboard/stats/player/${playerId}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
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
    
    navigate(`/performance/dossier/${playerId}?${params.toString()}`);
  }, [navigate, filters.period, filters.sessionType, filters.sessionName]);

  // Handler per Compare
  const handleOpenCompareQuick = useCallback(() => {
    console.log('🟢 PerformancePlayersList: handleOpenCompareQuick chiamato');
    setCompareOverlay({ open: true });
  }, []);

  const handleCloseCompareOverlay = useCallback(() => {
    setCompareOverlay({ open: false });
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
    <div className={`player-card ${isSelected ? 'selected' : ''}`}>
      {/* Badge Selezionato */}
      {isSelected && (
        <div className="selected-badge">
          Selezionato
        </div>
      )}
      {/* Header Semplificato */}
      <div className="card-header">
        <div className="player-info">
          <div className="player-avatar">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} />
            ) : (
              <div className="avatar-placeholder">
                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
          </div>
          <div className="player-details">
            <div className="player-name">{player.name}</div>
            <div className="player-role">{getRoleFullName(player.role)}</div>
            {player.number && (
              <div className="player-number">#{player.number}</div>
            )}
          </div>
        </div>
        {/* Tabs visibili (compatte) per maggiore chiarezza */}
      </div>

      {/* Tabs stile Dashboard (compatte dentro la card) */}
      <div className="player-tabs">
        <button className={`player-tab-btn ${selectedTab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>
          <BarChart3 size={14} /> Panoramica
        </button>
        <button className={`player-tab-btn ${selectedTab==='load'?'active':''}`} onClick={()=>setTab('load')}>
          <Layers size={14} /> Sessioni
        </button>
        <button className={`player-tab-btn ${selectedTab==='intensity'?'active':''}`} onClick={()=>setTab('intensity')}>
          <Zap size={14} /> Intensità
        </button>
        <button className={`player-tab-btn ${selectedTab==='cardio'?'active':''}`} onClick={()=>setTab('cardio')}>
          <Heart size={14} /> Cardio
        </button>
        <button className={`player-tab-btn ${selectedTab==='acc'?'active':''}`} onClick={()=>setTab('acc')}>
          <ArrowLeftRight size={14} /> Acc/Dec
        </button>
        <button className={`player-tab-btn ${selectedTab==='speed'?'active':''}`} onClick={()=>setTab('speed')}>
          <ArrowUpRight size={14} /> Sprint
        </button>
        <button className={`player-tab-btn ${selectedTab==='readiness'?'active':''}`} onClick={()=>setTab('readiness')}>
          <Crown size={14} /> Readiness
        </button>
      </div>

      <div className="player-tab-content">
        {selectedTab && playerDashLoading.get(player.id) && (
          <div className="kpi-grid"><div className="kpi-item">Caricamento…</div></div>
        )}
        {playerDashById.get(player.id)?.error && (
          <div className="kpi-grid"><div className="kpi-item">Errore nel caricamento</div></div>
        )}
        {selectedTab === 'summary' && playerDashById.get(player.id) && (() => {
          const d = playerDashById.get(player.id);
          const s = d?.summary || {};
          const e = d?.eventsSummary || {};
          return (
            <>
              <div className="kpi-grid">
                <div className="kpi-item"><div className="kpi-label">Sessioni totali</div><div className="kpi-value">{fmtInt(s.totalSessions)}</div></div>
                <div className="kpi-item"><div className="kpi-label">Allenamenti totali</div><div className="kpi-value">{fmtInt(e.numeroAllenamenti)}</div></div>
                <div className="kpi-item"><div className="kpi-label">Partite disputate</div><div className="kpi-value">{fmtInt(e.numeroPartite)}</div></div>
                <div className="kpi-item"><div className="kpi-label">Durata media sessione</div><div className="kpi-value">{fmtDec(s.avgSessionDuration, 2)} min</div></div>
                <div className="kpi-item"><div className="kpi-label">Distanza media squadra</div><div className="kpi-value">{fmtInt(s.avgTeamDistance)} m</div></div>
                <div className="kpi-item"><div className="kpi-label">Player load medio</div><div className="kpi-value">{fmtDec(s.avgPlayerLoad, 2)}</div></div>
                <div className="kpi-item"><div className="kpi-label">Velocità max media</div><div className="kpi-value">{fmtDec(s.avgMaxSpeed, 2)} km/h</div></div>
              </div>
            </>
          );
        })()}
        {selectedTab === 'load' && (() => {
          const d = playerDashById.get(player.id);
          const l = d?.load || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">Distanza totale</div><div className="kpi-value">{fmtInt(l.totalDistance)} m</div></div>
              <div className="kpi-item"><div className="kpi-label">Sprint totali</div><div className="kpi-value">{fmtInt(l.totalSprints)} sprint</div></div>
              <div className="kpi-item"><div className="kpi-label">Passi totali</div><div className="kpi-value">{fmtInt(l.totalSteps)} passi</div></div>
            </div>
          );
        })()}
        {selectedTab === 'intensity' && (() => {
          const d = playerDashById.get(player.id);
          const i = d?.intensity || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">Distanza/min</div><div className="kpi-value">{safeDec(i.avgDistancePerMin, 2)} m/min</div></div>
              <div className="kpi-item"><div className="kpi-label">Player load/min</div><div className="kpi-value">{safeDec(i.avgPlayerLoadPerMin, 2)} load/min</div></div>
              <div className="kpi-item"><div className="kpi-label">Sprint per sessione</div><div className="kpi-value">{safeDec(i.avgSprintsPerSession, 2)} sprint/sess.</div></div>
            </div>
          );
        })()}
        {selectedTab === 'speed' && (() => {
          const d = playerDashById.get(player.id);
          const sp = d?.speed || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">HSR totale</div><div className="kpi-value">{fmtInt(sp.totalHSR)} m</div></div>
              <div className="kpi-item"><div className="kpi-label">Sprint distance media</div><div className="kpi-value">{safeDec(sp.avgSprintDistance, 2)} m</div></div>
              <div className="kpi-item"><div className="kpi-label">Distanza per sprint</div><div className="kpi-value">{safeDec(sp.avgSprintDistancePerSprint, 2)} m</div></div>
              <div className="kpi-item"><div className="kpi-label">Vel. max media</div><div className="kpi-value">{safeDec(player.topSpeed, 2)} km/h</div></div>
            </div>
          );
        })()}
        {selectedTab === 'acc' && (() => {
          const d = playerDashById.get(player.id);
          const a = d?.accelerations || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">Acc+Dec per sessione</div><div className="kpi-value">{safeDec(a.avgAccDecPerSession, 2)}</div></div>
              <div className="kpi-item"><div className="kpi-label">Impatti stimati</div><div className="kpi-value">{fmtInt(a.totalImpacts)}</div></div>
            </div>
          );
        })()}
        {selectedTab === 'cardio' && (() => {
          const d = playerDashById.get(player.id);
          const c = d?.cardio || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">HR medio</div><div className="kpi-value">{safeDec(c.avgHR, 2)} bpm</div></div>
              <div className="kpi-item"><div className="kpi-label">HR max</div><div className="kpi-value">{safeDec(c.maxHR, 2)} bpm</div></div>
              <div className="kpi-item"><div className="kpi-label">RPE medio</div><div className="kpi-value">{safeDec(c.avgRPE, 2)}</div></div>
              <div className="kpi-item"><div className="kpi-label">Session-RPE totale</div><div className="kpi-value">{safeDec(c.totalSessionRPE, 2)}</div></div>
            </div>
          );
        })()}
        {selectedTab === 'readiness' && (() => {
          const d = playerDashById.get(player.id);
          const r = d?.readiness || {};
          return (
            <div className="kpi-grid">
              <div className="kpi-item"><div className="kpi-label">ACWR</div><div className="kpi-value">{safeDec(r.acwr ?? player.acwr, 2)}</div></div>
            </div>
          );
        })()}
      </div>

      {/* Rimosse badge ACWR e last session per lasciare solo le tab dentro la card */}

      {/* Footer Azioni Compatte */}
      <div className="card-footer">
                 <button 
           className="btn-primary btn-sm"
           onClick={() => handleOpenDossier(player.id)}
         >
           <FileText size={14} /> Dossier
         </button>
                 <button
           className={`btn-secondary btn-sm ${isSelected ? 'selected' : ''}`}
           onClick={() => onToggleSelection(player.id)}
           disabled={!isSelected && (selectedPlayers?.size || 0) >= 8}
           aria-disabled={!isSelected && (selectedPlayers?.size || 0) >= 8}
         >
           {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
           Confronta
         </button>
        {/* Alert/PB come chip nel footer */}
        {Array.isArray(player.alerts) && player.alerts.length > 0 && (
          <div className="alerts-chips">
            {player.alerts.map((alert, index) => (
              <span key={index} className={`alert-chip ${alert.type}`}>
                {alert.message}
              </span>
            ))}
          </div>
        )}
      </div>
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
      <div className="players-list-container">
        <div className="error-state">
          <AlertTriangle size={48} color="#EF4444" />
          <p>Errore nel caricamento: {error}</p>
          <button onClick={fetchPlayers} className="btn-primary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className={`players-list-container density-${filters.density}`}>

      {/* Filtri unificati - stesso stile dei contratti */}
      <div className="filters-container">
        <FiltersBar 
          mode="players"
          showSort={true}
          showNormalize={true}
        />
      </div>

      {/* Contenuto Principale */}
      <div className="players-content">
        {Object.entries(playersByRole).map(([role, rolePlayers]) => {
          if (rolePlayers.length === 0) return null;
          
          return (
            <div key={role} className="role-section">
              <div className="role-header">
                <h3>
                  {role === 'POR' ? 'Portieri' :
                   role === 'DIF' ? 'Difensori' :
                   role === 'CEN' ? 'Centrocampisti' : 'Attaccanti'}
                  <span className="player-count"> ({rolePlayers.length})</span>
                </h3>
                <div className="role-actions">
                  <button 
                    className="btn-secondary btn-sm"
                    onClick={() => selectAllRole(role)}
                  >
                    Seleziona tutti
                  </button>
                </div>
              </div>

              <div className={`players-grid density-${filters.density}`}>
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

               {/* Compare Overlay */}
        {compareOverlay.open && (
          <CompareOverlay
            playerIds={Array.from(selectedPlayers)}
            filters={filters}
            onClose={handleCloseCompareOverlay}
          />
        )}
     </div>
   );
 };

export default PerformancePlayersList;
