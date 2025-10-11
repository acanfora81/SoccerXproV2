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
  Filter,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/utils/apiClient';
import { useFilters, buildPerformanceQuery } from '@/modules/filters/index.js';
import { FiltersBar } from '@/modules/filters/index.js';

const DossierDrawer = ({ 
  playerId, 
  onClose
}) => {
  const { filters, updateFilter } = useFilters();
  const navigate = useNavigate();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');

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
          console.debug('[DossierDrawer] fetch', { 
            playerId, 
            filters,
            sessionType: filters.sessionType,
            sessionName: filters.sessionName,
            normalize: filters.normalize,
            sortBy: filters.sortBy,
            url: `/performance/player/${playerId}/dossier?${params}`
          });
        }

        const data = await apiFetch(`/performance/player/${playerId}/dossier?${params}`);
        console.log('🟢 DossierDrawer: dati ricevuti:', data);
        setPlayer(data);
      } catch (err) {
        console.log('🔴 DossierDrawer: errore caricamento dossier', err.message); // ERROR - mantenere essenziali
        
        // Gestione specifica per errori 500 (dati mancanti nel database)
        if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          setError('NO_DATA'); // Flag speciale per dati mancanti
        } else {
          setError(err.message);
        }
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
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Drawer */}
        <div className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0f1424] shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Drawer */}
        <div className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0f1424] shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {error === 'NO_DATA' ? 'Dati Non Disponibili' : 'Errore'}
            </h3>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {error === 'NO_DATA' ? (
                <>
                  <div className="text-6xl mb-4">📊</div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nessun Dato Disponibile
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Non ci sono ancora dati di performance per questo giocatore nel database.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    I dati appariranno qui una volta che il giocatore avrà completato delle sessioni di allenamento.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">⚠️</div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Errore di Connessione
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <button 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      setError(null);
                      setPlayer(null);
                      // Il useEffect si riattiverà automaticamente
                    }}
                  >
                    Riprova
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Drawer - Più alto e più largo, avvicinato al bordo superiore */}
      <div className="relative ml-auto w-full max-w-4xl bg-white dark:bg-[#0f1424] shadow-xl flex flex-col" style={{ maxHeight: '94vh', marginTop: '0' }}>
        {/* 🔧 Indicatore refresh discreto */}
        {isRefreshing && (
          <div className="absolute top-4 right-20 z-10 flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Aggiornamento...</span>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1424] border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {player.player.avatar ? (
                  <img src={player.player.avatar} alt={player.player.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{player.player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{player.player.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{player.player.role} #{player.player.number}</p>
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Alert Rischio Infortunio */}
          {Array.isArray(player?.alerts) && player.alerts.length > 0 && (() => {
            const injury = player.alerts.find(a => a?.type === 'injury_risk' || a?.category === 'injury' || /infortun/i.test(a?.message || ''));
            if (!injury) return null;
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
              <div className="px-4 pt-4">
                <div className={`w-full text-xs px-3 py-2 rounded-lg text-center ${cls}`}>
                  {injury.message}
                </div>
              </div>
            );
          })()}
          {/* 🔵 FilterBar compatta - su una riga */}
          <div className="sticky top-0 z-10 px-3 py-2 border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#0b1220]">
            <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Filtri</div>
            <FiltersBar 
              showSort={true}
              mode="compact"
            />
            {/* Periodo personalizzato - riga separata */}
            {filters.period === 'custom' && filters.startDate && filters.endDate && (
              <div className="mt-2 pt-2 border-t border-gray-200/30 dark:border-white/10">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Periodo:</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                    {filters.startDate} - {filters.endDate}
                  </span>
                  <button
                    onClick={() => {
                      updateFilter('period', 'week');
                      updateFilter('startDate', null);
                      updateFilter('endDate', null);
                    }}
                    className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                    title="Rimuovi periodo personalizzato"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        
        {/* KPI Header - 4 colonne su una riga */}
        <div className="px-4 py-2 border-b border-gray-200/50 dark:border-white/10">
          <div className="grid grid-cols-4 gap-2">
            {/* KPI 1: PL/min */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">PL/min</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.plPerMin, 2)}</span>
                <div className="flex items-center gap-0.5">
                  {getTrendIcon(safePct(player.summary.trend?.plPerMin))}
                  {safePct(player.summary.trend?.plPerMin) !== null && (
                    <span className="text-[10px] text-gray-500">{Math.abs(safePct(player.summary.trend?.plPerMin))}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 2: HSR */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={12} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">HSR</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary?.hsrTot)}<span className="text-xs font-normal text-gray-500 ml-0.5">m</span></span>
                <div className="flex items-center gap-0.5">
                  {getTrendIcon(safePct(player.summary.trend?.hsrTot))}
                  {safePct(player.summary.trend?.hsrTot) !== null && (
                    <span className="text-[10px] text-gray-500">{Math.abs(safePct(player.summary.trend?.hsrTot))}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 3: Sprint/90 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight size={12} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sprint/90</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.sprintPer90, 2)}</span>
                <div className="flex items-center gap-0.5">
                  {getTrendIcon(safePct(player.summary.trend?.sprintPer90))}
                  {safePct(player.summary.trend?.sprintPer90) !== null && (
                    <span className="text-[10px] text-gray-500">{Math.abs(safePct(player.summary.trend?.sprintPer90))}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 4: Vel. max */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={12} className="text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Vel. max</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.topSpeedMax, 2)}<span className="text-xs font-normal text-gray-500 ml-0.5">km/h</span></span>
                <div className="flex items-center gap-0.5">
                  {getTrendIcon(safePct(player.summary.trend?.topSpeedMax))}
                  {safePct(player.summary.trend?.topSpeedMax) !== null && (
                    <span className="text-[10px] text-gray-500">{Math.abs(safePct(player.summary.trend?.topSpeedMax))}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Compatti */}
        <div className="px-4 py-2 border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-[#0b1220]/50">
          <div className="flex flex-wrap gap-1.5">
            <button 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'panoramica' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('panoramica')}
            >
              <Gauge size={14} /> Panoramica
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'sessioni' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('sessioni')}
            >
              <Calendar size={14} /> Sessioni
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'intensita' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('intensita')}
            >
              <Activity size={14} /> Intensità
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'cardio' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('cardio')}
            >
              <Heart size={14} /> Cardio
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'accdec' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('accdec')}
            >
              <ArrowUpRight size={14} /> Acc/Dec
            </button>
          <button 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'sprint' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('sprint')}
          >
            <Target size={14} /> Sprint
          </button>
          <button 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'readiness' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('readiness')}
          >
            <Gauge size={14} /> Readiness
          </button>
          </div>
        </div>

        {/* Tab Content - Ultra Compatto */}
        <div className="p-3">
          {activeTab === 'panoramica' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Panoramica Periodo</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800/50">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Distanza tot</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{safeInt(player.summary.distTot)} <span className="text-[10px] font-normal text-gray-500">m</span></p>
                </div>
                <div className="p-2 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-800/50">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Minuti tot</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{safeInt(player.summary.minutesTot)}'</p>
                </div>
                {Number(player.summary?.stepsTot) > 0 && (
                  <div className="p-2 rounded-lg border bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border-indigo-200 dark:border-indigo-800/50">
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Passi tot</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{safeInt(player.summary.stepsTot)}</p>
                  </div>
                )}
                <div className="p-2 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800/50">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">ACWR</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{safeDec(player.summary.acwr, 2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessioni' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Sessioni recenti</h4>
              {player.breakdown?.bySession?.length > 0 ? (
                <div className="space-y-2">
                  {player.breakdown.bySession.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{session.date}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{session.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{session.minutes}'</span>
                        <span className="font-medium text-gray-900 dark:text-white">PL: {safeDec(session.PL, 1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nessuna sessione nel periodo selezionato</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'intensita' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Zone di intensità</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 15-20 km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone15_20)} m</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 20-25 km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone20_25)} m</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 25+ km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone25plus)} m</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">HSR Totale</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.hsrTot)} m</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cardio' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Metriche cardiovascolari</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-rose-200 dark:border-rose-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Freq. cardiaca media</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.cardio?.avgHR)} bpm</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Freq. cardiaca max</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.cardio?.maxHR)} bpm</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/30 dark:to-fuchsia-900/30 border-purple-200 dark:border-purple-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">RPE medio</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.cardio?.rpeAvg, 1)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">RPE sessione</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.cardio?.rpeSession)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accdec' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Accelerazioni e decelerazioni</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.acc)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-200 dark:border-sky-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Decelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.dec)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-200 dark:border-violet-800/50 col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impatto stimato</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.impact) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'sprint' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Sprint</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sprint/90</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.sprintPer90, 2)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Velocità max</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.topSpeedMax, 2)} <span className="text-sm font-normal text-gray-500">km/h</span></p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'readiness' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Readiness</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ACWR</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary?.acwr ?? player.readiness?.acwr, 2)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 border-orange-200 dark:border-orange-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monotony</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.readiness?.monotony, 2) || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-200 dark:border-sky-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Freshness</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.readiness?.freshness, 2) || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
        </div>

        </div> {/* Fine contenuto scrollabile */}
        
        {/* Footer - Fisso in basso */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-white/10 flex gap-3 bg-white dark:bg-[#0f1424]">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
            onClick={onClose}
          >
            Chiudi
          </button>
          <button
            onClick={() => {
              navigate(`/app/dashboard/performance/dossier/${playerId}?${buildPerformanceQuery(filters)}`);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <ExternalLink size={16} />
            Apri in pagina
          </button>
        </div>
      </div> {/* Fine drawer */}
    </div>
  );
};

export default DossierDrawer;
