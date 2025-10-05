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
  GitCompare,
  Users,
  BarChart3
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/utils/http';
import { useFilters, buildPerformanceQuery } from '@/modules/filters/index.js';
import { FiltersBar } from '@/modules/filters/index.js';
import { formatItalianNumber } from '@/utils/italianNumbers';

// Import di tutte le sezioni di AnalyticsAdvanced
import CaricoVolumi from './sections/CaricoVolumi';
import Intensita from './sections/Intensita';
import AltaVelocita from './sections/AltaVelocita';
import Accelerazioni from './sections/Accelerazioni';
import Energetico from './sections/Energetico';
import RischioRecupero from './sections/RischioRecupero';
import Comparazioni from './sections/Comparazioni';
import ReportCoach from './sections/ReportCoach';

const CompareDrawer = ({ 
  playerIds, 
  onClose 
}) => {
  const { filters } = useFilters();
  
  const [compareData, setCompareData] = useState([]);
  const [players, setPlayers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('🟢 CompareDrawer: apertura drawer per confronto', playerIds.length, 'giocatori');

  // Helper per formattazione sicura
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const safePct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;
  const safeDec = (v, d=2) => Number.isFinite(v) ? formatItalianNumber(Number(v)) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? formatItalianNumber(Math.round(v)) : 'N/A';

  // Helper per trend
  const getTrendIcon = (trend) => {
    if (trend === null || trend === 0) return <Minus size={12} className="text-gray-400" />;
    return trend > 0 
      ? <TrendingUp size={12} className="text-green-500" />
      : <TrendingDown size={12} className="text-red-500" />;
  };

  // === Fetch dati confronto ===
  useEffect(() => {
    if (!playerIds || playerIds.length === 0) return;

    const fetchCompareData = async () => {
      try {
        // Distingui tra primo caricamento e refresh filtri
        if (compareData.length === 0) {
          setInitialLoading(true);
          console.log('🔵 CompareDrawer: primo caricamento confronto', playerIds);
        } else {
          setIsRefreshing(true);
          console.log('🔵 CompareDrawer: refresh confronto per cambio filtri', playerIds);
        }
        setError(null);

        const params = buildPerformanceQuery(filters);
        
        console.log('🔵 CompareDrawer: fetch dati confronto', { 
          playerIds, 
          filters,
          url: `/api/performance/compare?players=${playerIds.join(',')}&${params}`
        });

        const response = await apiFetch(`/api/performance/compare?players=${playerIds.join(',')}&${params}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('🟢 CompareDrawer: dati confronto caricati', { 
          giocatori: data.players?.length || 0, 
          sessioni: data.allSessions?.length || 0 
        });

        setCompareData(data.allSessions || []);
        setPlayers(data.players || []);
        
      } catch (error) {
        console.error('❌ CompareDrawer: errore fetch dati confronto', error);
        setError(error.message);
      } finally {
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchCompareData();
  }, [playerIds, filters]);

  // === Loading e Error States ===
  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative ml-auto w-full max-w-4xl h-full bg-white dark:bg-[#0f1424] shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <GitCompare size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confronto Giocatori</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caricamento...</p>
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Caricamento dati confronto...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative ml-auto w-full max-w-4xl h-full bg-white dark:bg-[#0f1424] shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white">
                <GitCompare size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confronto Giocatori</h3>
                <p className="text-sm text-red-600 dark:text-red-400">Errore caricamento</p>
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Errore caricamento dati
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.location.reload()}
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Props comuni per tutte le sezioni
  const sectionProps = {
    data: compareData,
    players,
    filters,
    viewMode: 'charts',
    isCompareMode: true
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className={`fixed inset-0 transition-colors duration-300 ${
          isExpanded ? 'bg-black/70' : 'bg-black/50'
        }`} 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className={`relative ml-auto h-full bg-white dark:bg-[#0f1424] shadow-xl transition-all duration-300 ${
        isExpanded ? 'w-full' : 'w-full max-w-4xl'
      }`}>
        {/* Indicatore refresh discreto */}
        {isRefreshing && (
          <div className="absolute top-4 right-20 z-10 flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Aggiornamento...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <GitCompare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confronto Giocatori</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{players.length} giocatori selezionati</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Riduci" : "Espandi"}
            >
              <Maximize2 size={20} />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* FilterBar */}
        <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
          <FiltersBar 
            showSort={true}
            mode="compact"
          />
        </div>

        {/* KPI Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Users size={14} /> Giocatori
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {players.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Confronto attivo</div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Calendar size={14} /> Sessioni
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {compareData.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Totale periodo</div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Clock size={14} /> Periodo
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filters.period}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Filtro attivo</div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Activity size={14} /> Tipo
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filters.sessionType === 'all' ? 'Tutti' : filters.sessionType}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sessione</div>
            </div>
          </div>
        </div>

        {/* Contenuto completo con tutti i grafici */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Sezione Carico & Volumi */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Carico & Volumi</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distanze, volumi e carichi di lavoro</p>
              </div>
            </div>
            <CaricoVolumi {...sectionProps} />
          </div>

          {/* Sezione Intensità */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Intensità</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Velocità, potenza metabolica e zone di intensità</p>
              </div>
            </div>
            <Intensita {...sectionProps} />
          </div>

          {/* Sezione Alta Velocità & Sprint */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alta Velocità & Sprint</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sprint, HSR e velocità massime</p>
              </div>
            </div>
            <AltaVelocita {...sectionProps} />
          </div>

          {/* Sezione Accelerazioni & Decelerazioni */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Gauge size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accelerazioni & Decelerazioni</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Acc/Dec, stress meccanico e densità azioni</p>
              </div>
            </div>
            <Accelerazioni {...sectionProps} />
          </div>

          {/* Sezione Energetico */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Energetico</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Consumi energetici e zone metaboliche</p>
              </div>
            </div>
            <Energetico {...sectionProps} />
          </div>

          {/* Sezione Rischio & Recupero */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <Heart size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rischio & Recupero</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">ACWR, readiness e gestione carichi</p>
              </div>
            </div>
            <RischioRecupero {...sectionProps} />
          </div>

          {/* Sezione Comparazioni */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <GitCompare size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comparazioni</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confronti diretti tra giocatori</p>
              </div>
            </div>
            <Comparazioni {...sectionProps} />
          </div>

          {/* Sezione Report Coach */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Target size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Coach</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sintesi per staff tecnico</p>
              </div>
            </div>
            <ReportCoach {...sectionProps} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 dark:border-white/10 flex gap-3">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Chiudi
          </button>
          <button 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.open(`/performance/compare?players=${playerIds.join(',')}`, '_blank')}
          >
            Apri in pagina
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareDrawer;
