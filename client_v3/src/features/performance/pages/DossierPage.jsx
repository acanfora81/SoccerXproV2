import { useEffect, useMemo, useState } from 'react';
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
  Filter,
  BarChart3
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '@/modules/filters/index.js';
import { apiFetch } from '@/utils/http';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ComposedChart,
  BarChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

export default function DossierPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'charts'

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
        console.log('🟢 DossierPage: dati ricevuti:', data);
        setPlayer(data);
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
      <div className="min-h-screen bg-white dark:bg-[#0f1424] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1424] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Errore</h3>
            <button 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate('/app/performance/players')}
            >
              ← Torna alla Lista
            </button>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-700 dark:text-red-300">{error || 'Giocatore non trovato o nessun dato disponibile'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1424]">
      {/* Header con player info */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1424] border-b border-gray-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* 🔧 Indicatore refresh discreto */}
          {isRefreshing && (
            <div className="absolute top-4 right-6 flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-sm text-blue-700 dark:text-blue-300">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Aggiornamento...</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {player.player.avatar ? (
                  <img src={player.player.avatar} alt={player.player.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  player.player.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                )}
              </div>
              {/* Player details */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{player.player.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{player.player.role} #{player.player.number}</p>
              </div>
            </div>
            
            {/* Header actions */}
            <button 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate('/app/performance/players')}
            >
              ← Torna alla Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filtri unificati */}
      <div className="bg-gray-50 dark:bg-[#0b1220] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <FiltersBar 
            mode="dossier"
            showSort={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Toggle Vista */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
               viewMode === 'cards'
                 ? 'bg-blue-600 dark:bg-blue-600 text-white dark:text-white shadow-sm'
                 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
             }`}
          >
            <BarChart3 className="w-4 h-4" />
            Vista Cards
          </button>
          <button
            onClick={() => setViewMode('charts')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
               viewMode === 'charts'
                 ? 'bg-blue-600 dark:bg-blue-600 text-white dark:text-white shadow-sm'
                 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
             }`}
          >
            <TrendingUp className="w-4 h-4" />
            Vista Grafici
          </button>
        </div>
      </div>
        {/* KPI Header - colorate come nel drawer */}
        {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI Card 1: PL/min */}
          <div className="rounded-lg p-4 shadow-sm border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-800/50">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
              <Zap size={14} className="text-yellow-500" />
              <span>PL/min</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary.plPerMin, 2)}</span>
              <span className="inline-flex items-center gap-1 text-sm">
                {getTrendIcon(safePct(player.summary.trend?.plPerMin))}
                <span className={safePct(player.summary.trend?.plPerMin) > 0 ? 'text-green-500' : safePct(player.summary.trend?.plPerMin) < 0 ? 'text-red-500' : 'text-gray-400'}>
                  {safePct(player.summary.trend?.plPerMin) !== null ? `${Math.abs(safePct(player.summary.trend?.plPerMin))}%` : ''}
                </span>
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">P{Math.round((player.percentiles?.plPerMin || 0) * 100)} ruolo</div>
          </div>

          {/* KPI Card 2: HSR */}
          <div className="rounded-lg p-4 shadow-sm border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
              <Activity size={14} className="text-blue-500" />
              <span>HSR</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.hsrTot)} <span className="text-sm font-normal text-gray-500">m</span></span>
              <span className="inline-flex items-center gap-1 text-sm">
                {getTrendIcon(safePct(player.summary.trend?.hsrTot))}
                <span className={safePct(player.summary.trend?.hsrTot) > 0 ? 'text-green-500' : safePct(player.summary.trend?.hsrTot) < 0 ? 'text-red-500' : 'text-gray-400'}>
                  {safePct(player.summary.trend?.hsrTot) !== null ? `${Math.abs(safePct(player.summary.trend?.hsrTot))}%` : ''}
                </span>
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">P{Math.round((player.percentiles?.hsrTot || 0) * 100)} ruolo</div>
          </div>

          {/* KPI Card 3: Sprint/90 */}
          <div className="rounded-lg p-4 shadow-sm border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800/50">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
              <ArrowUpRight size={14} className="text-green-500" />
              <span>Sprint/90</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary.sprintPer90, 2)}</span>
              <span className="inline-flex items-center gap-1 text-sm">
                {getTrendIcon(safePct(player.summary.trend?.sprintPer90))}
                <span className={safePct(player.summary.trend?.sprintPer90) > 0 ? 'text-green-500' : safePct(player.summary.trend?.sprintPer90) < 0 ? 'text-red-500' : 'text-gray-400'}>
                  {safePct(player.summary.trend?.sprintPer90) !== null ? `${Math.abs(safePct(player.summary.trend?.sprintPer90))}%` : ''}
                </span>
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">P{Math.round((player.percentiles?.sprintPer90 || 0) * 100)} ruolo</div>
          </div>

          {/* KPI Card 4: Vel. max */}
          <div className="rounded-lg p-4 shadow-sm border bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-800/50">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
              <Target size={14} className="text-red-500" />
              <span>Vel. max</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary.topSpeedMax, 2)} <span className="text-sm font-normal text-gray-500">km/h</span></span>
              <span className="inline-flex items-center gap-1 text-sm">
                {getTrendIcon(safePct(player.summary.trend?.topSpeedMax))}
                <span className={safePct(player.summary.trend?.topSpeedMax) > 0 ? 'text-green-500' : safePct(player.summary.trend?.topSpeedMax) < 0 ? 'text-red-500' : 'text-gray-400'}>
                  {safePct(player.summary.trend?.topSpeedMax) !== null ? `${Math.abs(safePct(player.summary.trend?.topSpeedMax))}%` : ''}
                </span>
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">P{Math.round((player.percentiles?.topSpeedMax || 0) * 100)} ruolo</div>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10 overflow-x-auto">
          <button 
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'panoramica' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('panoramica')}
          >
            <Gauge size={16} /> Panoramica
          </button>
          <button 
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sessioni' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('sessioni')}
          >
            <Calendar size={16} /> Sessioni
          </button>
          <button 
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'intensita' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('intensita')}
          >
            <Activity size={16} /> Intensità
          </button>
          <button 
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cardio' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('cardio')}
          >
            <Heart size={16} /> Cardio
          </button>
          <button 
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'accdec' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('accdec')}
          >
            <ArrowUpRight size={16} /> Acc/Dec
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-6">
          {viewMode === 'charts' && (
            <ChartsSection player={player} activeTab={activeTab} />
          )}
          {viewMode === 'cards' && (
          <>
          {activeTab === 'panoramica' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Panoramica Periodo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Distanza totale</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.distTot)} m</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minuti totali</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.minutesTot)}'</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border-indigo-200 dark:border-indigo-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Passi totali</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.stepsTot)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ACWR</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.summary.acwr, 2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessioni' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sessioni recenti</h4>
              {player.breakdown?.bySession?.length > 0 ? (
                <div className="space-y-2">
                  {player.breakdown.bySession.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{session.date}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{session.type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{session.minutes}'</span>
                        <span className="font-medium text-gray-900 dark:text-white">PL: {safeDec(session.PL, 1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nessuna sessione nel periodo selezionato</p>
                  <p className="text-sm mt-1">Modifica i filtri sopra per vedere le sessioni</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'intensita' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Zone di intensità</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metriche cardiovascolari</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accelerazioni e decelerazioni</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.acc)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-200 dark:border-sky-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Decelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.dec)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-200 dark:border-violet-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impatto stimato</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.impact) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

// Sezione Grafici (riuso semplice dei dati sessioni del dossier)
function ChartsSection({ player, activeTab }) {
  const sessionData = useMemo(() => {
    const rows = player?.breakdown?.bySession || [];
    console.log('🔍 [ChartsSection] Dati sessioni ricevuti:', rows);
    const mapped = rows.map((s) => ({
      date: s.date,
      // Panoramica
      total_distance_m: s.total_distance_m ?? 0,
      PL: s.PL ?? 0,
      minutes: s.minutes ?? 0,
      // Intensità
      zone15_20: s.zone15_20 ?? 0,
      zone20_25: s.zone20_25 ?? 0,
      zone25plus: s.zone25plus ?? 0,
      hsr: s.hsr ?? 0,
      // Cardio
      avgHR: s.avgHR ?? 0,
      maxHR: s.maxHR ?? 0,
      rpe: s.rpe ?? 0,
      sRPE: s.sRPE ?? 0,
      // Acc/Dec
      acc: s.acc ?? 0,
      dec: s.dec ?? 0,
      // Altri
      sprint_distance_m: s.sprint_distance_m ?? 0,
      top_speed_kmh: s.top_speed_kmh ?? s.topSpeed ?? 0,
      // Nuovi KPI dal backend
      metabolic_efficiency: s.metabolic_efficiency ?? 0,
      distance_per_min: s.distance_per_min ?? 0,
      intensity_ratio: s.intensity_ratio ?? 0,
      cardio_effort_index: s.cardio_effort_index ?? 0,
    }));
    console.log('🔍 [ChartsSection] Dati mappati per grafici:', mapped);
    console.log('🔍 [ChartsSection] Tab attiva:', activeTab);
    
    // Debug per i nuovi KPI
    if (mapped.length > 0) {
      const firstSession = mapped[0];
      console.log('🔍 [KPI Debug] Prima sessione KPI:', {
        metabolic_efficiency: firstSession.metabolic_efficiency,
        distance_per_min: firstSession.distance_per_min,
        intensity_ratio: firstSession.intensity_ratio,
        cardio_effort_index: firstSession.cardio_effort_index
      });
    }
    // Ordina per data decrescente (da più recente a più vecchia)
    const parseItDate = (d) => {
      // atteso formato dd/mm/yyyy
      if (!d || typeof d !== 'string') return 0;
      const parts = d.split('/');
      if (parts.length !== 3) return 0;
      const [dd, mm, yyyy] = parts.map(Number);
      const dt = new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
      return Number.isFinite(dt) ? dt : 0;
    };
    // Ordinamento crescente: dal più vecchio (sinistra) al più recente (destra)
    return [...mapped].sort((a, b) => parseItDate(a.date) - parseItDate(b.date));
  }, [player, activeTab]);

  if (!sessionData.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-semibold mb-2">Nessun dato disponibile</p>
        <p className="text-sm">Non ci sono sessioni nel periodo selezionato per costruire i grafici</p>
      </div>
    );
  }

  // Renderizza grafici in base alla tab attiva
  if (activeTab === 'panoramica') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Distanza totale per sessione</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="total_distance_m" name="Distanza (m)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Player Load per sessione</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="PL" name="Player Load" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Efficienza Metabolica</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [value?.toLocaleString('it-IT') + ' m/unità', 'Efficienza Metabolica']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="metabolic_efficiency" name="Efficienza Metabolica" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (activeTab === 'intensita') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Zone di intensità per sessione</h4>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="zone15_20" name="15-20 km/h (m)" stackId="1" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.5)" strokeWidth={1} />
              <Area type="monotone" dataKey="zone20_25" name="20-25 km/h (m)" stackId="1" stroke="#F97316" fill="rgba(249, 115, 22, 0.5)" strokeWidth={1} />
              <Area type="monotone" dataKey="zone25plus" name="25+ km/h (m)" stackId="1" stroke="#EF4444" fill="rgba(239, 68, 68, 0.5)" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">High Speed Running per sessione</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="hsr" name="HSR (m)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">% Alta Intensità</h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart 
              innerRadius="70%" 
              outerRadius="100%" 
              data={[{ name: "Intensità", value: sessionData.reduce((sum, s) => sum + (s.intensity_ratio || 0), 0) / (sessionData.length || 1) }]} 
              startAngle={90} 
              endAngle={-270}
            >
              <RadialBar minAngle={15} background clockWise dataKey="value" fill="#3B82F6" />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip formatter={(value) => [value?.toFixed(1) + ' %', 'Alta Intensità']} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (activeTab === 'cardio') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Frequenza cardiaca per sessione</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="avgHR" name="HR Media (bpm)" stroke="#EC4899" strokeWidth={2} dot={{ r: 3, fill: '#EC4899' }} />
              <Line type="monotone" dataKey="maxHR" name="HR Max (bpm)" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">RPE e sRPE per sessione</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="rpe" name="RPE" stroke="#A855F7" fill="rgba(168, 85, 247, 0.3)" strokeWidth={2} />
              <Area type="monotone" dataKey="sRPE" name="sRPE" stroke="#6366F1" fill="rgba(99, 102, 241, 0.3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Indice Sforzo Cardiaco</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [value?.toFixed(1) + ' %', 'Indice Sforzo Cardiaco']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="cardio_effort_index" name="Indice Sforzo Cardiaco" stroke="#8B5CF6" fill="rgba(139,92,246,0.25)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (activeTab === 'accdec') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Accelerazioni e Decelerazioni per sessione</h4>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="acc" name="Accelerazioni" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="dec" name="Decelerazioni" fill="#0EA5E9" radius={[4,4,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Tab sessioni: mostra distanza + minuti con istogramma + linea, e velocità max
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Distanza e Minuti per sessione</h4>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            {/* Asse sinistro per distanza */}
            <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            {/* Asse destro per minuti */}
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {/* Distanza come colonne */}
            <Bar yAxisId="left" dataKey="total_distance_m" name="Distanza (m)" fill="#3B82F6" radius={[4,4,0,0]} />
            {/* Minuti come linea sull'asse destro */}
            <Line yAxisId="right" type="monotone" dataKey="minutes" name="Minuti" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Velocità massima per sessione</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line type="monotone" dataKey="top_speed_kmh" name="Vel. max (km/h)" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Distanza per Minuto</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.5)', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [value?.toLocaleString('it-IT') + ' m/min', 'Distanza per Minuto']}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="distance_per_min" name="Distanza per Minuto" fill="#8B5CF6" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
