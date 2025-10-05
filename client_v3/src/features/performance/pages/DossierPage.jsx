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
import { useFilters, buildPerformanceQuery, FiltersBar } from '@/modules/filters/index.js';
import { apiFetch } from '@/utils/http';
import Segmented from '@/components/ui/Segmented';

export default function DossierPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');

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
        {/* KPI Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI Card 1: PL/min */}
          <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
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
          <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
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
          <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
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
          <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
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
          {activeTab === 'panoramica' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Panoramica Periodo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Distanza totale</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.distTot)} m</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minuti totali</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.minutesTot)}'</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Passi totali</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.summary.stepsTot)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
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
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 15-20 km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone15_20)} m</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 20-25 km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone20_25)} m</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zona 25+ km/h</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.intensity?.zone25plus)} m</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
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
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Freq. cardiaca media</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.cardio?.avgHR)} bpm</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Freq. cardiaca max</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.cardio?.maxHR)} bpm</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">RPE medio</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeDec(player.cardio?.rpeAvg, 1)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
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
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.acc)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Decelerazioni</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.dec)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0f1424] rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impatto stimato</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{safeInt(player.accDec?.impact) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
