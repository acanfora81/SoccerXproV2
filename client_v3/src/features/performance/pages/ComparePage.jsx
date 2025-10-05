// src/pages/performance/ComparePage.jsx
// 🏆 PAGINA CONFRONTO MULTI-GIOCATORE - Completamente Tailwind

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, 
  ArrowLeft,
  Maximize2, 
  Minimize2,
  GitCompare,
  Filter,
  ChevronUp,
  ChevronDown,
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
  Users,
  Shield,
  BarChart3,
  ArrowLeftRight
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '@/modules/filters/index.js';
import { apiFetch } from '@/utils/http';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, updateFilter } = useFilters();
  
  // Stati principali
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isExpanded, setIsExpanded] = useState(false); // Nuovo stato per espansione
  
  // Estrai parametri dalla URL
  const playerIds = searchParams.get('players')?.split(',').filter(Boolean).map(Number) || [];
  
  // Tab identiche a CompareOverlay
  const TABS = [
    { id: 'summary', label: 'Panoramica Generale', icon: <BarChart3 size={14} /> },
    { id: 'load', label: 'Carico & Volumi', icon: <Zap size={14} /> },
    { id: 'intensity', label: 'Intensità', icon: <Activity size={14} /> },
    { id: 'cardio', label: 'Energetico & Metabolico', icon: <Heart size={14} /> },
    { id: 'acc', label: 'Accelerazioni & Decelerazioni', icon: <ArrowUpRight size={14} /> },
    { id: 'speed', label: 'Alta Velocità & Sprint', icon: <Target size={14} /> },
    { id: 'readiness', label: 'Rischio & Recupero', icon: <Shield size={14} /> }
  ];
  
  // Colori per i giocatori
  const playerColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
  
  // Helper functions
  const safeDec = (value, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : '0.00';
  };
  
  const safeInt = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.round(num) : 0;
  };

  // Fetch dei dati
  const fetchCompareData = async () => {
    if (playerIds.length === 0) {
      setError('Nessun giocatore selezionato');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const query = buildPerformanceQuery(filters);
      const url = `/api/performance/compare?players=${playerIds.join(',')}&${query}`;
      
      console.log('🔵 ComparePage: fetch URL:', url);

      const response = await apiFetch(url);
        
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🟢 ComparePage: dati ricevuti:', data);
      
      const playersData = data.players || data || [];
      setPlayers(playersData);
        
    } catch (err) {
      console.error('🔴 ComparePage: errore fetch:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect per caricare i dati
  useEffect(() => {
    fetchCompareData();
  }, [playerIds.join(','), JSON.stringify(filters)]);

  // Tabella comparativa dinamica
  const renderCompareTable = (metrics) => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#0b1220] border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold"></th>
              {players.map((p, idx) => (
                <th key={p.id} className="px-4 py-3 text-center font-semibold" style={{ color: playerColors[idx % playerColors.length] }}>
                  {p.firstName} {p.lastName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {metrics.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#0b1220] transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.label}</td>
                {players.map((p, idx) => (
                  <td key={p.id} className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {m.getValue(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helpers grafici
  const toChartData = (label, accessor) => {
    return players.map((p) => ({ name: `${p.firstName} ${p.lastName}`, value: accessor(p) }));
  };

  const ChartCard = ({ title, data, color = '#3B82F6', unit }) => (
    <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
            <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip formatter={(v) => `${v}${unit ? ' ' + unit : ''}`} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Render functions con grafici comparativi
  const renderSummaryTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Sessioni totali" data={toChartData('Sessioni totali', (p) => safeInt(p.detailed?.totalSessions || 0))} />
        <ChartCard title="Durata media sessione" data={toChartData('Durata media', (p) => Number(safeDec(p.detailed?.avgSessionDuration || 0, 1)))} unit="min" color="#10B981" />
        <ChartCard title="Distanza totale" data={toChartData('Distanza totale', (p) => safeInt(p.detailed?.totalDistance || 0))} unit="m" color="#8B5CF6" />
        <ChartCard title="Player load medio" data={toChartData('PL medio', (p) => Number(safeDec(p.detailed?.avgSessionLoad || 0, 1)))} color="#F59E0B" />
        <ChartCard title="Velocità max" data={toChartData('Velocità max', (p) => Number(safeDec(p.detailed?.topSpeedMax || 0, 1)))} unit="km/h" color="#EF4444" />
      </div>
    );
  };

  const renderLoadTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Distanza totale" data={toChartData('Distanza', (p) => safeInt(p.detailed?.totalDistance || 0))} unit="m" />
        <ChartCard title="Player load totale" data={toChartData('PL', (p) => safeInt(p.detailed?.totalPlayerLoad || 0))} color="#F59E0B" />
        <ChartCard title="Durata totale" data={toChartData('Minuti', (p) => safeInt(p.detailed?.totalMinutes || 0))} unit="min" color="#10B981" />
        <ChartCard title="Carico medio per sessione" data={toChartData('PL medio', (p) => Number(safeDec(p.detailed?.avgSessionLoad || 0, 1)))} color="#8B5CF6" />
      </div>
    );
  };

  const renderIntensityTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="PL/min" data={toChartData('PL/min', (p) => Number(safeDec(p.detailed?.plPerMin || 0, 2)))} color="#F59E0B" />
        <ChartCard title="Velocità media" data={toChartData('Velocità media', (p) => Number(safeDec(p.detailed?.avgSpeed || 0, 2)))} unit="km/h" />
        <ChartCard title="Sprint per 90'" data={toChartData('Sprint90', (p) => Number(safeDec(p.summary?.sprintPer90 || 0, 2)))} color="#EF4444" />
      </div>
    );
  };

  const renderCardioTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="FC media" data={toChartData('FC media', (p) => Number(safeDec(p.detailed?.avgHeartRate || 0, 1)))} unit="bpm" />
        <ChartCard title="FC max" data={toChartData('FC max', (p) => safeInt(p.detailed?.maxHeartRate || 0))} unit="bpm" color="#EF4444" />
      </div>
    );
  };

  const renderAccTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Accelerazioni totali" data={toChartData('Acc', (p) => safeInt(p.detailed?.totalAccelerations || 0))} />
        <ChartCard title="Decelerazioni totali" data={toChartData('Dec', (p) => safeInt(p.detailed?.totalDecelerations || 0))} />
        <ChartCard title="Accel./min" data={toChartData('Acc/min', (p) => Number(safeDec(p.detailed?.accelPerMinute || 0, 2)))} />
        <ChartCard title="Decel./min" data={toChartData('Dec/min', (p) => Number(safeDec(p.detailed?.decelPerMinute || 0, 2)))} />
      </div>
    );
  };

  const renderSpeedTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="HSR totale" data={toChartData('HSR', (p) => safeInt(p.detailed?.hsrTotal || 0))} unit="m" />
        <ChartCard title="Sprint totali" data={toChartData('Sprint', (p) => safeInt(p.detailed?.sprintCount || 0))} color="#F59E0B" />
        <ChartCard title="Top speed" data={toChartData('Top speed', (p) => Number(safeDec(p.detailed?.topSpeedMax || 0, 2)))} unit="km/h" color="#EF4444" />
        <ChartCard title="Dist. 15-20 km/h" data={toChartData('15-20', (p) => safeInt(p.detailed?.distance15_20 || 0))} unit="m" />
        <ChartCard title="Dist. 20-25 km/h" data={toChartData('20-25', (p) => safeInt(p.detailed?.distance20_25 || 0))} unit="m" />
        <ChartCard title="Dist. > 25 km/h" data={toChartData('>25', (p) => safeInt(p.detailed?.distanceOver25 || 0))} unit="m" />
      </div>
    );
  };

  const renderReadinessTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="ACWR" data={toChartData('ACWR', (p) => Number(safeDec(p.detailed?.acwr || 0, 2)))} />
        <ChartCard title="Strain" data={toChartData('Strain', (p) => Number(safeDec(p.detailed?.strain || 0, 1)))} color="#8B5CF6" />
      </div>
    );
  };

  // Funzioni per le tabelle (quando non espanso)
  const renderSummaryTable = () => {
    const metrics = [
      { label: 'Sessioni totali', getValue: (p) => safeInt(p.detailed?.totalSessions || 0) },
      { label: 'Durata media sessione', getValue: (p) => `${safeDec(p.detailed?.avgSessionDuration || 0, 1)} min` },
      { label: 'Distanza totale', getValue: (p) => `${safeInt(p.detailed?.totalDistance || 0)} m` },
      { label: 'Player load medio', getValue: (p) => safeDec(p.detailed?.avgSessionLoad || 0, 1) },
      { label: 'Velocità max media', getValue: (p) => `${safeDec(p.detailed?.topSpeedMax || 0, 1)} km/h` },
    ];
    return renderCompareTable(metrics);
  };

  const renderLoadTable = () => {
    const metrics = [
      { label: 'Distanza totale', getValue: (p) => `${safeInt(p.detailed?.totalDistance || 0)} m` },
      { label: 'Player load totale', getValue: (p) => safeInt(p.detailed?.totalPlayerLoad || 0) },
      { label: 'Durata totale', getValue: (p) => `${safeInt(p.detailed?.totalMinutes || 0)} min` },
      { label: 'Carico medio per sessione', getValue: (p) => safeDec(p.detailed?.avgSessionLoad || 0, 1) },
    ];
    return renderCompareTable(metrics);
  };

  const renderIntensityTable = () => {
    const metrics = [
      { label: 'PL/min', getValue: (p) => safeDec(p.detailed?.plPerMin || 0, 2) },
      { label: 'Velocità media', getValue: (p) => `${safeDec(p.detailed?.avgSpeed || 0, 2)} km/h` },
      { label: "Sprint per 90'", getValue: (p) => safeDec(p.summary?.sprintPer90 || 0, 2) },
    ];
    return renderCompareTable(metrics);
  };

  const renderCardioTable = () => {
    const metrics = [
      { label: 'FC media', getValue: (p) => `${safeDec(p.detailed?.avgHeartRate || 0, 1)} bpm` },
      { label: 'FC max', getValue: (p) => `${safeInt(p.detailed?.maxHeartRate || 0)} bpm` },
    ];
    return renderCompareTable(metrics);
  };

  const renderAccTable = () => {
    const metrics = [
      { label: 'Accelerazioni totali', getValue: (p) => safeInt(p.detailed?.totalAccelerations || 0) },
      { label: 'Decelerazioni totali', getValue: (p) => safeInt(p.detailed?.totalDecelerations || 0) },
      { label: 'Accel./min', getValue: (p) => safeDec(p.detailed?.accelPerMinute || 0, 2) },
      { label: 'Decel./min', getValue: (p) => safeDec(p.detailed?.decelPerMinute || 0, 2) },
    ];
    return renderCompareTable(metrics);
  };

  const renderSpeedTable = () => {
    const metrics = [
      { label: 'HSR totale', getValue: (p) => `${safeInt(p.detailed?.hsrTotal || 0)} m` },
      { label: 'HSR %', getValue: (p) => `${safeDec(p.detailed?.hsrPercentage || 0, 1)}%` },
      { label: 'Sprint totali', getValue: (p) => safeInt(p.detailed?.sprintCount || 0) },
      { label: 'Top speed', getValue: (p) => `${safeDec(p.detailed?.topSpeedMax || 0, 2)} km/h` },
      { label: 'Dist. 15-20 km/h', getValue: (p) => `${safeInt(p.detailed?.distance15_20 || 0)} m` },
      { label: 'Dist. 20-25 km/h', getValue: (p) => `${safeInt(p.detailed?.distance20_25 || 0)} m` },
      { label: 'Dist. > 25 km/h', getValue: (p) => `${safeInt(p.detailed?.distanceOver25 || 0)} m` },
    ];
    return renderCompareTable(metrics);
  };

  const renderReadinessTable = () => {
    const metrics = [
      { label: 'ACWR', getValue: (p) => safeDec(p.detailed?.acwr || 0, 2) },
      { label: 'Strain', getValue: (p) => safeDec(p.detailed?.strain || 0, 1) },
    ];
    return renderCompareTable(metrics);
  };

  // Render del contenuto tab
  const renderTabContent = () => {
    if (isExpanded) {
      // Quando espanso, mostra i grafici
      switch (activeTab) {
        case 'summary':
          return renderSummaryTab();
        case 'load':
          return renderLoadTab();
        case 'intensity':
          return renderIntensityTab();
        case 'cardio':
          return renderCardioTab();
        case 'acc':
          return renderAccTab();
        case 'speed':
          return renderSpeedTab();
        case 'readiness':
          return renderReadinessTab();
        default:
          return renderSummaryTab();
      }
    } else {
      // Quando non espanso, mostra le tabelle
      switch (activeTab) {
        case 'summary':
          return renderSummaryTable();
        case 'load':
          return renderLoadTable();
        case 'intensity':
          return renderIntensityTable();
        case 'cardio':
          return renderCardioTable();
        case 'acc':
          return renderAccTable();
        case 'speed':
          return renderSpeedTable();
        case 'readiness':
          return renderReadinessTable();
        default:
          return renderSummaryTable();
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1424] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !players || players.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1424] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Errore Confronto</h3>
            <button 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-700 dark:text-red-300">{error || 'Nessun giocatore selezionato per il confronto'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1424]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1424] border-b border-gray-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GitCompare size={24} className="text-blue-500" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Confronto Multi-Giocatore</h3>
                <div className="flex items-center gap-2 mt-1">
                  {players.map((player, index) => (
                    <React.Fragment key={player.id}>
                      <span className="text-sm font-medium" style={{ color: playerColors[index] }}>
                        {player.firstName} {player.lastName}
                      </span>
                      {index < players.length - 1 && <span className="text-gray-400">VS</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-gray-50 dark:bg-[#0b1220] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <FiltersBar />
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10 overflow-x-auto">
          {TABS.map((tab) => (
            <button 
              key={tab.id}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      
        {/* Tab content */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-6">
          {renderTabContent()}
        </div>

        {/* Footer con azioni */}
        <div className="flex justify-between items-center mt-6">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate(-1)}
          >
            Chiudi
          </button>
          <div className="flex gap-3">
            {!isExpanded && (
              <button 
                type="button" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsExpanded(true)}
              >
                <BarChart3 size={16} />
                Visualizza Grafici
              </button>
            )}
            {isExpanded && (
              <button 
                type="button" 
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => setIsExpanded(false)}
              >
                <ArrowLeft size={16} />
                Torna alle Tabelle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
