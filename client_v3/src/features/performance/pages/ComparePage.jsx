// src/pages/performance/ComparePage.jsx
// 🏆 PAGINA CONFRONTO MULTI-GIOCATORE - Completamente Tailwind

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, 
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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, updateFilter } = useFilters();
  
  // Stati principali
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [viewMode, setViewMode] = useState('tables'); // Nuovo: 'tables' o 'charts'
  
  // Estrai parametri dalla URL
  const playerIds = searchParams.get('players')?.split(',').filter(Boolean).map(Number) || [];
  
  // Sincronizza i filtri dalla URL solo una volta al caricamento
  useEffect(() => {
    const period = searchParams.get('period');
    const sessionType = searchParams.get('sessionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roles = searchParams.get('roles')?.split(',') || [];
    const status = searchParams.get('status');
    
    if (period) updateFilter('period', period);
    if (sessionType) updateFilter('sessionType', sessionType);
    if (startDate) updateFilter('startDate', startDate);
    if (endDate) updateFilter('endDate', endDate);
    if (roles.length > 0) updateFilter('roles', roles);
    if (status) updateFilter('status', status);
  }, []); // Solo al mount, non dipende da searchParams per evitare loop
  
  // Tab identiche a CompareOverlay
  const TABS = [
    { id: 'summary', label: 'Panoramica', icon: <BarChart3 size={14} /> },
    { id: 'load', label: 'Carico & Volumi', icon: <Zap size={14} /> },
    { id: 'intensity', label: 'Intensità', icon: <Activity size={14} /> },
    { id: 'cardio', label: 'Energetico', icon: <Heart size={14} /> },
    { id: 'acc', label: 'Acc/Dec', icon: <ArrowUpRight size={14} /> },
    { id: 'speed', label: 'Velocità', icon: <Target size={14} /> },
    { id: 'readiness', label: 'Readiness', icon: <Shield size={14} /> }
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
      <div>
        <div className="overflow-x-auto border-2 border-blue-500 dark:border-white/10 rounded-lg">
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
              {metrics.map((m, i) => {
                // Calcola i valori per l'evidenziazione
                const playerValues = players.map(p => {
                  const value = m.getValue(p);
                  const numericValue = typeof value === 'string' 
                    ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
                    : (typeof value === 'number' ? value : 0);
                  return { player: p, value: numericValue, displayValue: value };
                });
                
                // Determina se valori più bassi sono migliori
                const isLowerBetter = m.label.toLowerCase().includes('acwr') || 
                                      m.label.toLowerCase().includes('strain') ||
                                      m.label.toLowerCase().includes('tempo') ||
                                      m.label.toLowerCase().includes('durata');
                
                // Ordina i valori
                const sortedValues = [...playerValues].sort((a, b) => 
                  isLowerBetter ? a.value - b.value : b.value - a.value
                );
                
                const bestValue = sortedValues[0]?.value;
                const worstValue = sortedValues[sortedValues.length - 1]?.value;
                const secondBestValue = sortedValues.length > 2 ? sortedValues[1]?.value : null;
                
                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#0b1220] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.label}</td>
                    {playerValues.map(({ player, value, displayValue }) => {
                      let bgClass = '';
                      let textClass = '';
                      
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
                          className={`px-4 py-3 text-center transition-colors ${bgClass} ${textClass || 'text-gray-700 dark:text-gray-300'}`}
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
        
        {/* Legenda */}
        {players.length > 1 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-blue-500 dark:border-white/10">
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
    );
  };

  // Helper per creare dati temporali per i grafici
  const toTimeSeriesData = (metricAccessor) => {
    // Raccoglie tutte le date uniche da tutti i giocatori
    const allDates = new Set();
    players.forEach(player => {
      if (player.sessions) {
        player.sessions.forEach(session => {
          if (session.session_date) {
            allDates.add(session.session_date);
          }
        });
      }
    });
    
    // Converte le date in array e le ordina
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
    
    // Crea un oggetto per ogni data con i valori di tutti i giocatori
    return sortedDates.map(date => {
      const dataPoint = { date: new Date(date).toLocaleDateString('it-IT') };
      
      players.forEach((player, index) => {
        const playerName = `${player.firstName} ${player.lastName}`;
        const playerSession = player.sessions?.find(s => s.session_date === date);
        const value = playerSession ? metricAccessor(playerSession) : 0;
        
        // Normalizza il valore a numero
        let numeric = 0;
        if (typeof value === 'number') {
          numeric = Number.isFinite(value) ? value : 0;
        } else if (typeof value === 'string') {
          const norm = value.replace(',', '.').replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(norm);
          numeric = Number.isFinite(parsed) ? parsed : 0;
        }
        
        dataPoint[playerName] = numeric;
      });
      
      return dataPoint;
    });
  };

  const ChartCard = ({ title, data, unit }) => (
      <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(v) => `${v}${unit ? ' ' + unit : ''}`} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              {players.map((player, index) => {
                const playerName = `${player.firstName} ${player.lastName}`;
                return (
                  <Line 
                    key={player.id}
                    type="monotone" 
                    dataKey={playerName} 
                    stroke={playerColors[index % playerColors.length]} 
                    strokeWidth={3}
                    dot={{ fill: playerColors[index % playerColors.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: playerColors[index % playerColors.length], strokeWidth: 2 }}
                    name={playerName}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

  // Render functions con grafici comparativi
  const renderSummaryTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Durata sessione" data={toTimeSeriesData((s) => s.duration_minutes || 0)} unit="min" />
        <ChartCard title="Distanza sessione" data={toTimeSeriesData((s) => s.total_distance_m || 0)} unit="m" />
        <ChartCard title="Player load sessione" data={toTimeSeriesData((s) => s.player_load || 0)} />
        <ChartCard title="Velocità max sessione" data={toTimeSeriesData((s) => s.top_speed_kmh || 0)} unit="km/h" />
      </div>
    );
  };

  const renderLoadTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Distanza per sessione" data={toTimeSeriesData((s) => s.total_distance_m || 0)} unit="m" />
        <ChartCard title="Player load per sessione" data={toTimeSeriesData((s) => s.player_load || 0)} />
        <ChartCard title="Durata per sessione" data={toTimeSeriesData((s) => s.duration_minutes || 0)} unit="min" />
        <ChartCard title="PL per minuto" data={toTimeSeriesData((s) => s.duration_minutes > 0 ? (s.player_load || 0) / s.duration_minutes : 0)} />
      </div>
    );
  };

  const renderIntensityTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="PL per minuto" data={toTimeSeriesData((s) => s.duration_minutes > 0 ? (s.player_load || 0) / s.duration_minutes : 0)} />
        <ChartCard title="Velocità media" data={toTimeSeriesData((s) => s.avg_speed_kmh || 0)} unit="km/h" />
        <ChartCard title="Sprint per sessione" data={toTimeSeriesData((s) => s.sprint_distance_m || 0)} unit="m" />
      </div>
    );
  };

  const renderCardioTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="FC media per sessione" data={toTimeSeriesData((s) => s.avg_heart_rate || 0)} unit="bpm" />
        <ChartCard title="FC max per sessione" data={toTimeSeriesData((s) => s.max_heart_rate || 0)} unit="bpm" />
      </div>
    );
  };

  const renderAccTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Accelerazioni per sessione" data={toTimeSeriesData((s) => s.num_acc_over_3_ms2 || 0)} />
        <ChartCard title="Decelerazioni per sessione" data={toTimeSeriesData((s) => s.num_dec_over_minus3_ms2 || 0)} />
        <ChartCard title="Accel./min per sessione" data={toTimeSeriesData((s) => s.duration_minutes > 0 ? (s.num_acc_over_3_ms2 || 0) / s.duration_minutes : 0)} />
        <ChartCard title="Decel./min per sessione" data={toTimeSeriesData((s) => s.duration_minutes > 0 ? (s.num_dec_over_minus3_ms2 || 0) / s.duration_minutes : 0)} />
      </div>
    );
  };

  const renderSpeedTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="HSR per sessione" data={toTimeSeriesData((s) => s.distance_over_20_kmh_m || 0)} unit="m" />
        <ChartCard title="Sprint per sessione" data={toTimeSeriesData((s) => s.sprint_distance_m || 0)} unit="m" />
        <ChartCard title="Top speed per sessione" data={toTimeSeriesData((s) => s.top_speed_kmh || 0)} unit="km/h" />
        <ChartCard title="Dist. 15-20 km/h per sessione" data={toTimeSeriesData((s) => s.distance_15_20_kmh_m || 0)} unit="m" />
        <ChartCard title="Dist. 20-25 km/h per sessione" data={toTimeSeriesData((s) => s.distance_20_25_kmh_m || 0)} unit="m" />
        <ChartCard title="Dist. > 25 km/h per sessione" data={toTimeSeriesData((s) => s.distance_over_25_kmh_m || 0)} unit="m" />
      </div>
    );
  };

  const renderReadinessTab = () => {
    if (!players.length) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun dato disponibile</div>;

    return (
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Player load per sessione" data={toTimeSeriesData((s) => s.player_load || 0)} />
        <ChartCard title="Training load per sessione" data={toTimeSeriesData((s) => s.training_load || 0)} />
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
    if (viewMode === 'charts') {
      // Modalità grafici
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
      // Modalità tabelle
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
              onClick={() => navigate('/app/dashboard/performance/players')}
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
              onClick={() => navigate('/app/dashboard/performance/players')}
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
        {/* Toggle Tabelle/Grafici */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tables')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'tables'
                  ? 'bg-blue-600 dark:bg-blue-600 text-white dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Tabelle
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
              Grafici
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-white/10">
          {TABS.map((tab) => (
            <button 
              key={tab.id}
              className={`flex-1 px-3 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors text-sm ${
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
        <div className="flex justify-end items-center mt-6">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/app/dashboard/performance/players')}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
