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
  Activity
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
  const { filters } = useFilters();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Stati principali
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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

  // 🔧 FIX: Funzione per refresh manuale
  const handleForceRefresh = useCallback(() => {
    console.log('🟢 PerformancePlayersList: Refresh manuale richiesto'); // INFO - rimuovere in produzione
    playersCache.clear(); // Pulisci tutta la cache
    fetchPlayers(); // Ricarica i dati
  }, [fetchPlayers]);

  // Effetto per caricamento iniziale e cambio filtri
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

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
  const PlayerCard = useCallback(({ player, isSelected, onToggleSelection }) => (
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
            <div className="player-role">
              {player.role} #{player.number}
            </div>
          </div>
        </div>
        <button className="menu-btn">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* KPI Grid 2x2 Compatta */}
      <div className="kpi-grid">
        <div className="kpi-item">
          <div className="kpi-label">
            <Zap size={14} /> PL/min
          </div>
          <div className="kpi-value">
            {safeDec(player.plMin, 2)}
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.plMinTrend))}
              {safePct(player.plMinTrend) !== null ? `${Math.abs(safePct(player.plMinTrend))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{player.plMinPercentile ?? 0} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Activity size={14} /> HSR
          </div>
          <div className="kpi-value">
            {safeInt(player.hsr)} m
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.hsrTrend))}
              {safePct(player.hsrTrend) !== null ? `${Math.abs(safePct(player.hsrTrend))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{player.hsrPercentile ?? 0} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <ArrowUpRight size={14} /> Sprint/90
          </div>
          <div className="kpi-value">
            {safeDec(player.sprintPer90, 2)}
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.sprintTrend))}
              {safePct(player.sprintTrend) !== null ? `${Math.abs(safePct(player.sprintTrend))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{player.sprintPercentile ?? 0} ruolo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Target size={14} /> Vel. max
          </div>
          <div className="kpi-value">
            {safeDec(player.topSpeed, 2)} km/h
            <span className="kpi-trend">
              {getTrendIcon(safePct(player.speedTrend))}
              {safePct(player.speedTrend) !== null ? `${Math.abs(safePct(player.speedTrend))}%` : ''}
            </span>
          </div>
          <div className="kpi-percentile">P{player.speedPercentile ?? 0} ruolo</div>
        </div>
      </div>

      {/* ACWR Badge Semplificato */}
      <div className={`acwr-badge ${getACWRColor(player.acwr ?? 0)}`}>
        ACWR: {safeDec(player.acwr, 2)}
        {(player.acwr ?? 0) >= 0.8 && (player.acwr ?? 0) <= 1.3 ? ' 🟢 OK' : 
         (player.acwr ?? 0) > 1.3 ? ' 🟡 Attenzione' : ' 🔴 Scarico'}
      </div>

      {/* Ultima Sessione Compatta */}
      <div className="last-session">
        <div className="session-info">
          {player.lastSession?.type || 'N/A'} • {player.lastSession?.minutes || '0'}' • {player.lastSession?.date || 'N/A'}
        </div>
        <div className={`session-delta ${(player.lastSession?.delta ?? 0) > 0 ? 'positive' : 'negative'}`}>
          Δ {player.lastSession?.delta > 0 ? '+' : ''}{player.lastSession?.delta != null ? safeDec(player.lastSession?.delta, 1) : 'N/A'}%
        </div>
      </div>

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
  ), [fmtDec, fmtInt, getTrendIcon, getACWRColor, selectedPlayers.size]);

  // Loading state
  if (isLoading && players.length === 0) {
    return <PageLoader message="Caricamento performance…" minHeight={360} />;
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
      {/* 🔧 FIX: Pulsante refresh manuale */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleForceRefresh}
          title="Aggiorna dati dal database"
          style={{ 
            marginLeft: '8px',
            padding: '8px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            color: '#374151',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Aggiorna
        </button>
      </div>

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
              pageId="ALL" 
              mode="compact" 
 
              showSort={true} 
            />
          </div>
        )}
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
           onOpenExtended={handleOpenCompareExtended}
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
            onOpenExtended={handleOpenCompareExtended}
          />
        )}
     </div>
   );
 };

export default PerformancePlayersList;
