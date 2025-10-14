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
import { apiFetch } from '@/utils/apiClient';
import { useFilters, buildPerformanceQuery } from '@/modules/filters/index.js';
import { FiltersBar } from '@/modules/filters/index.js';
import { formatItalianNumber } from '@/utils/italianNumbers';
import GlobalLoader from '@/components/ui/GlobalLoader';

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
  const [activeTab, setActiveTab] = useState('summary');

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
          url: `/performance/compare?players=${playerIds.join(',')}&${params}`
        });

        const data = await apiFetch(`/performance/compare?players=${playerIds.join(',')}&${params}`);
        
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
            <GlobalLoader />
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

  // Tabs per la tabella di confronto (coerenti con ComparePage)
  const TABS = [
    { id: 'summary', label: 'Panoramica' },
    { id: 'load', label: 'Sessioni' },
    { id: 'intensity', label: 'Intensità' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'acc', label: 'Acc/Dec' },
    { id: 'speed', label: 'Sprint' },
    { id: 'readiness', label: 'Readiness' }
  ];

  // Helpers formattazione sicura (coerenti a CompareOverlay)
  const safeDecLocal = (v, d = 2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/A';
  const safeIntLocal = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';

  const renderCompareTable = (metrics) => {
    if (!players.length) return (
      <div className="text-sm text-gray-600 dark:text-gray-400">Nessun dato disponibile</div>
    );
    
    return (
      <div className="overflow-auto rounded-lg border-2 border-blue-500 dark:border-white/10">
        <table className="min-w-full bg-white dark:bg-transparent">
          <thead className="bg-gray-50 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white/80 w-56">Metrica</th>
              {players.map((p) => (
                <th key={p.id} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white/80 whitespace-nowrap">
                  {p.firstName} {p.lastName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => {
              // Calcola valori numerici per ogni giocatore per questa metrica
              const playerValues = players.map(p => {
                const value = m.getValue(p);
                // Estrai numero dal valore formattato (rimuovi unità, spazi, virgole)
                const numericValue = typeof value === 'string' 
                  ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
                  : (typeof value === 'number' ? value : 0);
                return { player: p, value: numericValue, displayValue: value };
              });
              
              // Trova min e max (per la maggior parte delle metriche, più alto = meglio)
              // Eccezioni: per alcune metriche più basso = meglio (es. ACWR ideale 0.8-1.3)
              const isLowerBetter = m.label.toLowerCase().includes('acwr') || 
                                   m.label.toLowerCase().includes('strain') ||
                                   m.label.toLowerCase().includes('tempo') ||
                                   m.label.toLowerCase().includes('durata');
              
              const sortedValues = [...playerValues].sort((a, b) => 
                isLowerBetter ? a.value - b.value : b.value - a.value
              );
              
              const bestValue = sortedValues[0]?.value;
              const worstValue = sortedValues[sortedValues.length - 1]?.value;
              const secondBestValue = sortedValues.length > 2 ? sortedValues[1]?.value : null;
              
              return (
                <tr key={idx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-white/5 dark:even:bg-white/10">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{m.label}</td>
                  {playerValues.map(({ player, value, displayValue }) => {
                    let bgClass = '';
                    let textClass = '';
                    
                    // Evidenzia solo se ci sono almeno 2 giocatori e valori diversi
                    if (players.length > 1 && bestValue !== worstValue) {
                      if (value === bestValue) {
                        bgClass = 'bg-green-50 dark:bg-green-900/20';
                        textClass = 'text-green-800 dark:text-green-200';
                      } else if (value === worstValue) {
                        bgClass = 'bg-red-50 dark:bg-red-900/20';
                        textClass = 'text-red-800 dark:text-red-200';
                      } else if (secondBestValue !== null && value === secondBestValue && players.length > 2) {
                        bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
                        textClass = 'text-yellow-800 dark:text-yellow-200';
                      }
                    }
                    
                    return (
                      <td 
                        key={player.id} 
                        className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${bgClass} ${textClass || 'text-gray-800 dark:text-white'}`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary': {
        const metrics = [
          { label: 'Sessioni totali', getValue: (p) => safeIntLocal(p.detailed?.totalSessions || 0) },
          { label: 'Durata media sessione', getValue: (p) => `${safeDecLocal(p.detailed?.avgSessionDuration || 0, 1)} min` },
          { label: 'Distanza totale', getValue: (p) => `${safeIntLocal(p.detailed?.totalDistance || 0)} m` },
          { label: 'Player load medio', getValue: (p) => safeDecLocal(p.detailed?.avgSessionLoad || 0, 1) },
          { label: 'Velocità max media', getValue: (p) => `${safeDecLocal(p.detailed?.topSpeedMax || 0, 1)} km/h` }
        ];
        return renderCompareTable(metrics);
      }
      case 'load': {
        const metrics = [
          { label: 'Distanza totale', getValue: (p) => `${safeIntLocal(p.detailed?.totalDistance || 0)} m` },
          { label: 'Player load totale', getValue: (p) => safeIntLocal(p.detailed?.totalPlayerLoad || 0) },
          { label: 'Durata totale', getValue: (p) => `${safeIntLocal(p.detailed?.totalMinutes || 0)} min` },
          { label: 'Carico medio per sessione', getValue: (p) => safeDecLocal(p.detailed?.avgSessionLoad || 0, 1) }
        ];
        return renderCompareTable(metrics);
      }
      case 'intensity': {
        const metrics = [
          { label: 'PL/min', getValue: (p) => safeDecLocal(p.detailed?.plPerMin || 0, 2) },
          { label: 'Velocità media', getValue: (p) => `${safeDecLocal(p.detailed?.avgSpeed || 0, 2)} km/h` },
          { label: "Sprint per 90'", getValue: (p) => safeDecLocal(p.summary?.sprintPer90 || 0, 2) }
        ];
        return renderCompareTable(metrics);
      }
      case 'cardio': {
        const metrics = [
          { label: 'FC media', getValue: (p) => `${safeDecLocal(p.detailed?.avgHeartRate || 0, 1)} bpm` },
          { label: 'FC max', getValue: (p) => `${safeIntLocal(p.detailed?.maxHeartRate || 0)} bpm` }
        ];
        return renderCompareTable(metrics);
      }
      case 'acc': {
        const metrics = [
          { label: 'Accelerazioni totali', getValue: (p) => safeIntLocal(p.detailed?.totalAccelerations || 0) },
          { label: 'Decelerazioni totali', getValue: (p) => safeIntLocal(p.detailed?.totalDecelerations || 0) },
          { label: 'Accel./min', getValue: (p) => safeDecLocal(p.detailed?.accelPerMinute || 0, 2) },
          { label: 'Decel./min', getValue: (p) => safeDecLocal(p.detailed?.decelPerMinute || 0, 2) }
        ];
        return renderCompareTable(metrics);
      }
      case 'speed': {
        const metrics = [
          { label: 'HSR totale', getValue: (p) => `${safeIntLocal(p.detailed?.hsrTotal || 0)} m` },
          { label: 'HSR %', getValue: (p) => `${safeDecLocal(p.detailed?.hsrPercentage || 0, 1)}%` },
          { label: 'Sprint totali', getValue: (p) => safeIntLocal(p.detailed?.sprintCount || 0) },
          { label: 'Top speed', getValue: (p) => `${safeDecLocal(p.detailed?.topSpeedMax || 0, 2)} km/h` }
        ];
        return renderCompareTable(metrics);
      }
      case 'readiness': {
        const metrics = [
          { label: 'ACWR', getValue: (p) => safeDecLocal(p.detailed?.acwr || 0, 2) },
          { label: 'Strain', getValue: (p) => safeDecLocal(p.detailed?.strain || 0, 1) }
        ];
        return renderCompareTable(metrics);
      }
      default:
        return null;
    }
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
            <div className="p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800/50">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Giocatori</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{players.length} <span className="text-[10px] font-normal text-gray-500">confronto</span></p>
            </div>

            <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800/50">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Sessioni</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{compareData.length} <span className="text-[10px] font-normal text-gray-500">totale</span></p>
            </div>

            <div className="p-2 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200 dark:from-purple-900/30 dark:to-violet-900/30 dark:border-purple-800/50">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Periodo</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{filters.period === 'custom' ? 'Personalizzato' : (filters.period || 'Personalizzato')} <span className="text-[10px] font-normal text-gray-500">filtro</span></p>
            </div>

            <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 dark:from-orange-900/30 dark:to-amber-900/30 dark:border-orange-800/50">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Tipo Sessione</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{filters.sessionType === 'all' ? 'Tutti' : (filters.sessionType === 'training' ? 'Allenamento' : (filters.sessionType === 'match' ? 'Partita' : filters.sessionType))} <span className="text-[10px] font-normal text-gray-500">sessione</span></p>
            </div>
          </div>
        </div>

        {/* Tabs per scegliere il gruppo di metriche */}
        <div className="px-6 pt-6">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === t.id
                    ? 'bg-blue-600 dark:bg-blue-600 text-white dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          </div>

        {/* Tabella di comparazione */}
        <div className="overflow-y-auto p-6">
          {renderTabContent()}
          
          {/* Leggenda colori */}
          {players.length > 1 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-blue-500 dark:border-white/10">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-red-400"></div>
                Legenda Performance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"></div>
                  <span className="text-green-800 dark:text-green-200 font-medium">🟢 Performance Migliore</span>
              </div>
                {players.length > 2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"></div>
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">🟡 Seconda Performance</span>
              </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"></div>
                  <span className="text-red-800 dark:text-red-200 font-medium">🔴 Performance Peggiore</span>
          </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                I colori si basano sul confronto tra i {players.length} giocatori selezionati per ogni metrica.
              </p>
            </div>
          )}
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
            onClick={() => {
              // Costruisci l'URL completo con i filtri attuali
              const params = new URLSearchParams();
              params.set('players', playerIds.join(','));
              
              // Aggiungi i filtri attuali
              if (filters.period) params.set('period', filters.period);
              if (filters.sessionType) params.set('sessionType', filters.sessionType);
              if (filters.startDate) params.set('startDate', filters.startDate);
              if (filters.endDate) params.set('endDate', filters.endDate);
              if (filters.roles && filters.roles.length > 0) params.set('roles', filters.roles.join(','));
              if (filters.status) params.set('status', filters.status);
              
              const url = `/app/dashboard/performance/compare?${params.toString()}`;
              window.open(url, '_blank');
            }}
          >
            Apri in pagina
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareDrawer;
