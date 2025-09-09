import React, { useState, useEffect, useCallback } from 'react';

// 🚀 OPTIMIZATION: Funzione debounce per ottimizzare le chiamate API
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 🚀 OPTIMIZATION: Cache semplice per i dati di confronto
const compareCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

const getCacheKey = (playerIds, filters) => {
  return `${playerIds.join(',')}-${JSON.stringify(filters)}`;
};
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { apiFetch } from '../../utils/http';
import { useFilters } from '../../modules/filters/index.js';
import { FiltersBar } from '../../modules/filters/index.js';

import '../../styles/performance-players-list.css';

const CompareOverlay = ({ 
  playerIds, 
  filters, 
  onClose
}) => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isExpanded, setIsExpanded] = useState(false); // Nuovo stato per espansione
  const [timeSeriesData, setTimeSeriesData] = useState(null); // Dati temporali per i grafici

  // Helper per formattazione sicura
  const safeDec = (v, d=2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits:d, maximumFractionDigits:d }) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';

  // Helper per i grafici
  const toChartData = (label, accessor) => {
    return players.map((p, idx) => {
      const rawValue = accessor(p);
      // Converti il valore in numero, rimuovendo eventuali unità di misura
      let numericValue = 0;
      if (typeof rawValue === 'number') {
        numericValue = rawValue;
      } else if (typeof rawValue === 'string') {
        // Rimuovi unità di misura e spazi, poi converti in numero
        const cleanValue = rawValue.replace(/[^\d.,]/g, '').replace(',', '.');
        numericValue = parseFloat(cleanValue) || 0;
      }
      
      return { 
        name: `${p.firstName} ${p.lastName}`, 
        value: numericValue,
        color: playerColors[idx % playerColors.length]
      };
    });
  };

  // Helper per grafici a torta
  const toPieChartData = (label, accessor) => {
    return players.map((p, idx) => {
      const rawValue = accessor(p);
      let numericValue = 0;
      if (typeof rawValue === 'number') {
        numericValue = rawValue;
      } else if (typeof rawValue === 'string') {
        const cleanValue = rawValue.replace(/[^\d.,]/g, '').replace(',', '.');
        numericValue = parseFloat(cleanValue) || 0;
      }
      
      return { 
        name: `${p.firstName} ${p.lastName}`, 
        value: numericValue,
        fill: playerColors[idx % playerColors.length]
      };
    });
  };

  // Helper per grafici a linea
  const toLineChartData = (label, accessor) => {
    return players.map((p, idx) => {
      const rawValue = accessor(p);
      let numericValue = 0;
      if (typeof rawValue === 'number') {
        numericValue = rawValue;
      } else if (typeof rawValue === 'string') {
        const cleanValue = rawValue.replace(/[^\d.,]/g, '').replace(',', '.');
        numericValue = parseFloat(cleanValue) || 0;
      }
      
      return { 
        name: `${p.firstName} ${p.lastName}`, 
        value: numericValue,
        stroke: playerColors[idx % playerColors.length]
      };
    });
  };

  // Helper per grafici radar
  const toRadarChartData = () => {
    if (players.length === 0) return [];
    
    const metrics = [
      { key: 'Sessioni', accessor: (p) => p.detailed?.totalSessions || 0 },
      { key: 'Distanza', accessor: (p) => p.detailed?.totalDistance || 0 },
      { key: 'Player Load', accessor: (p) => p.detailed?.avgSessionLoad || 0 },
      { key: 'Velocità Media', accessor: (p) => p.detailed?.avgSpeed || 0 },
      { key: 'HSR %', accessor: (p) => p.detailed?.hsrPercentage || 0 },
      { key: 'Sprint', accessor: (p) => p.detailed?.sprintCount || 0 }
    ];

    return players.map((p, idx) => {
      const data = metrics.map(metric => ({
        metric: metric.key,
        value: metric.accessor(p),
        fullMark: 100 // Valore massimo per normalizzazione
      }));

      return {
        name: `${p.firstName} ${p.lastName}`,
        data: data,
        fill: playerColors[idx % playerColors.length],
        stroke: playerColors[idx % playerColors.length]
      };
    });
  };

  // Helper per convertire dati temporali in grafici a linea
  const toTimeSeriesLineData = (metricKey) => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    
    return timeSeriesData.map((player, index) => {
      // Trova il giocatore corrispondente nella lista principale per ottenere il colore corretto
      const mainPlayer = players.find(p => p.id === player.id);
      const correctColor = mainPlayer ? playerColors[players.indexOf(mainPlayer) % playerColors.length] : playerColors[index % playerColors.length];
      
      console.log(`🎨 Colore per ${player.name}:`, {
        playerId: player.id,
        apiColor: player.color,
        correctColor: correctColor,
        mainPlayerFound: !!mainPlayer
      });
      
      return {
        name: player.name,
        color: correctColor, // Usa il colore corretto dalla lista principale
        data: player.timeSeries.map(point => ({
          date: point.date,
          value: point[metricKey] || 0
        }))
      };
    });
  };

  // Helper per convertire dati temporali in grafici a barre aggregate
  const toTimeSeriesBarData = (metricKey, aggregateBy = 'week') => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    
    return timeSeriesData.map(player => {
      // Aggrega i dati per settimana
      const aggregated = {};
      player.timeSeries.forEach(point => {
        const date = new Date(point.date);
        const weekKey = aggregateBy === 'week' 
          ? `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`
          : point.date;
        
        if (!aggregated[weekKey]) {
          aggregated[weekKey] = { total: 0, count: 0 };
        }
        aggregated[weekKey].total += point[metricKey] || 0;
        aggregated[weekKey].count += 1;
      });

      return {
        name: player.name,
        color: player.color,
        data: Object.entries(aggregated).map(([period, values]) => ({
          period,
          value: values.total / values.count // Media
        }))
      };
    });
  };

  const ChartCard = ({ title, data, unit }) => (
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [`${value}${unit || ''}`, name]} />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}
                </span>
              )}
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Componente per grafici a torta
  const PieChartCard = ({ title, data, unit }) => (
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}${unit || ''}`, 'Valore']} />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Componente per grafici a linea
  const LineChartCard = ({ title, data, unit }) => (
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [`${value}${unit || ''}`, name]} />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}
                </span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Componente per grafici radar
  const RadarChartCard = ({ title, data }) => (
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Giocatore"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Componente per grafici a barre orizzontali
  const HorizontalBarChartCard = ({ title, data, unit }) => (
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip formatter={(value, name) => [`${value}${unit || ''}`, name]} />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {value}
                </span>
              )}
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Componente per grafici a linea temporali
  const TimeSeriesLineChartCard = ({ title, timeSeriesData, metricKey, unit }) => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return (
        <div className="chart-card">
          <div className="chart-header"><h4>{title}</h4></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
            <p>Caricamento dati temporali...</p>
          </div>
        </div>
      );
    }

    // Prepara i dati per il grafico a linea
    const chartData = [];
    const allDates = new Set();
    
    timeSeriesData.forEach(player => {
      player.data.forEach(point => {
        allDates.add(point.date);
      });
    });

    const sortedDates = Array.from(allDates).sort();
    
    sortedDates.forEach(date => {
      const dataPoint = { date };
      timeSeriesData.forEach(player => {
        const point = player.data.find(p => p.date === date);
        dataPoint[player.name] = point ? point.value : 0;
      });
      chartData.push(dataPoint);
    });

    return (
      <div className="chart-card">
        <div className="chart-header"><h4>{title}</h4></div>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${value}${unit || ''}`, name]}
                labelFormatter={(value) => new Date(value).toLocaleDateString('it-IT')}
              />
              <Legend 
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}
                  </span>
                )}
              />
              {timeSeriesData.map((player, index) => {
                // Usa il colore specifico del giocatore, fallback ai colori predefiniti
                const playerColor = player.color || playerColors[index % playerColors.length];
                
                return (
                  <Line 
                    key={player.name}
                    type="monotone" 
                    dataKey={player.name}
                    stroke={playerColor}
                    strokeWidth={3}
                    dot={{ fill: playerColor, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: playerColor, stroke: '#fff', strokeWidth: 2 }}
                    name={player.name}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Helper per role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'POR': return <Shield size={16} />;
      case 'DIF': return <Target size={16} />;
      case 'CEN': return <Activity size={16} />;
      case 'ATT': return <ArrowUpRight size={16} />;
      default: return <Users size={16} />;
    }
  };

  // Configurazione tab identiche a Vista Giocatori
  const TABS = [
    {
      id: 'summary',
      title: 'Panoramica',
      icon: BarChart3,
      color: '#3B82F6'
    },
    {
      id: 'load',
      title: 'Sessioni',
      icon: Calendar,
      color: '#10B981'
    },
    {
      id: 'intensity',
      title: 'Intensità',
      icon: Zap,
      color: '#F59E0B'
    },
    {
      id: 'cardio',
      title: 'Cardio',
      icon: Heart,
      color: '#EF4444'
    },
    {
      id: 'acc',
      title: 'Acc/Dec',
      icon: ArrowLeftRight,
      color: '#8B5CF6'
    },
    {
      id: 'speed',
      title: 'Sprint',
      icon: ArrowUpRight,
      color: '#F59E0B'
    },
    {
      id: 'readiness',
      title: 'Readiness',
      icon: Shield,
      color: '#EC4899'
    }
  ];

  // 🚀 OPTIMIZATION: Debouncing per evitare chiamate eccessive
  const debouncedFetchCompareData = useCallback(
    debounce(async () => {
      if (!playerIds || playerIds.length === 0) return;

      const fetchCompareData = async () => {
      try {
        const ids = Array.from(new Set(
          (playerIds || [])
            .map(p => Number(p?.id ?? p))
            .filter(Number.isFinite)
        ));

        if (ids.length === 0) {
          setError('Seleziona almeno un giocatore da confrontare.');
          setPlayers([]);
          return;
        }

        // 🚀 OPTIMIZATION: Controlla cache prima di fare la chiamata API
        const cacheKey = getCacheKey(ids, filters);
        const cached = compareCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          console.log('✅ Dati dalla cache:', cached.data.players.length, 'giocatori');
          setPlayers(cached.data.players);
          if (cached.data.timeSeriesData) {
            setTimeSeriesData(cached.data.timeSeriesData);
          }
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        const qs = new URLSearchParams();
        qs.set('players', ids.join(','));
        
        if (filters.period) qs.set('period', filters.period);
        if (filters.sessionType) qs.set('sessionType', filters.sessionType);
        if (filters.roles && filters.roles.length > 0) qs.set('roles', filters.roles.join(','));
        if (filters.status) qs.set('status', filters.status);
        if (filters.startDate) qs.set('startDate', filters.startDate);
        if (filters.endDate) qs.set('endDate', filters.endDate);

        const url = `/api/performance/compare?${qs.toString()}`;
        console.log('🔵 CompareOverlay: fetch URL:', url);
        console.log('🔍 CompareOverlay: filtri ricevuti:', {
          period: filters.period,
          sessionType: filters.sessionType,
          roles: filters.roles,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate
        });

        const response = await apiFetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('🟢 CompareOverlay: dati ricevuti:', data);
        // Debug struttura dati più semplice
        if (data.players?.[0]) {
          console.log('🔍 CompareOverlay: primo giocatore ha detailed?', !!data.players[0].detailed);
          console.log('🔍 CompareOverlay: chiavi primo giocatore:', Object.keys(data.players[0]));
        }
        
        // Gestisci la struttura dati
        const playersData = data.players || data || [];
        setPlayers(playersData);

        // 🚀 OPTIMIZATION: Salva in cache solo i dati della tabella
        compareCache.set(cacheKey, {
          data: { players: playersData },
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('🔴 CompareOverlay: errore nel caricamento confronto:', err);
        setError('Errore nel caricamento: ' + err.message);
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

      fetchCompareData();
    }, 300), // 300ms di debounce
    [playerIds, filters]
  );

  // Chiama la funzione debounced quando cambiano i parametri
  useEffect(() => {
    debouncedFetchCompareData();
  }, [debouncedFetchCompareData]);

  // Gestione ESC per chiudere
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 🚀 OPTIMIZATION: Carica dati temporali separatamente per i grafici
  const loadTimeSeriesData = useCallback(async () => {
    if (!playerIds || playerIds.length === 0) return;
    
    try {
      console.log('📊 Caricamento dati temporali...');
      const params = new URLSearchParams();
      params.set('players', playerIds.join(','));
      
      // Usa i filtri attuali
      if (filters.period) params.set('period', filters.period);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.sessionType) params.set('sessionType', filters.sessionType);
      
      const response = await apiFetch(`/api/performance/compare/charts-data?${params}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setTimeSeriesData(data.data);
        console.log('✅ Dati temporali caricati:', data.data.length, 'giocatori');
      }
    } catch (error) {
      console.error('❌ Errore caricamento dati temporali:', error);
    }
  }, [playerIds, filters]);

  // Carica dati temporali quando il drawer si espande
  useEffect(() => {
    if (isExpanded) {
      loadTimeSeriesData();
    }
  }, [isExpanded, loadTimeSeriesData]);

  // Debug per i colori dei giocatori
  useEffect(() => {
    if (players.length > 0) {
      console.log('🎨 Colori giocatori principali:', players.map((p, idx) => ({
        name: `${p.firstName} ${p.lastName}`,
        id: p.id,
        color: playerColors[idx % playerColors.length]
      })));
    }
  }, [players]);

  // Debug per i filtri
  useEffect(() => {
    console.log('🔄 CompareOverlay: filtri cambiati:', {
      period: filters.period,
      sessionType: filters.sessionType,
      roles: filters.roles,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  }, [filters]);

  if (isLoading) {
    return (
      <div className="compare-overlay">
        <div className="compare-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="compare-content">
          <div className="loading-skeleton">
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !players || players.length === 0) {
    return (
      <div className="compare-overlay">
        <div className="compare-header">
          <h3>Errore Confronto</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="compare-content">
          <div className="error-state">
            <p>Errore nel caricamento: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcola valori massimi per normalizzazione grafici
  const getMaxValues = () => {
    if (!players.length) return {};
    
    return {
      plPerMin: Math.max(...players.map(p => Number(p.summary?.plPerMin) || 0)),
      hsrTot: Math.max(...players.map(p => Number(p.summary?.hsrTot) || 0)),
      sprintPer90: Math.max(...players.map(p => Number(p.summary?.sprintPer90) || 0)),
      topSpeedMax: Math.max(...players.map(p => Number(p.summary?.topSpeedMax) || 0)),
      acwr: Math.max(...players.map(p => Number(p.summary?.acwr) || 0)),
      sessions: Math.max(...players.map(p => Number(p.sessions?.length) || 0))
    };
  };

  const maxValues = getMaxValues();

  // Colori per giocatori
  const playerColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316',
    '#06b6d4', '#22c55e', '#eab308', '#a855f7', '#fb7185', '#0ea5e9'
  ];

  // Tabella comparativa dinamica (prima colonna titoli, poi una colonna per giocatore)
  const renderCompareTable = (metrics) => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content compare-table-container">
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {players.map((p, idx) => (
                <th key={p.id} style={{ color: playerColors[idx % playerColors.length], textAlign: 'center' }}>
                  {p.firstName} {p.lastName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i}>
                <td className="metric-label">{m.label}</td>
                {players.map((p, idx) => (
                  <td key={p.id} className="metric-value">
                    <span style={{ color: playerColors[idx % playerColors.length] }}>{m.getValue(p)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Funzioni di rendering per ogni tab (identiche a Vista Giocatori)
  const renderSummaryTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    const metrics = [
      { label: 'Sessioni totali', getValue: (p) => safeInt(p.detailed?.totalSessions || 0) },
      { label: 'Durata media sessione', getValue: (p) => `${safeDec(p.detailed?.avgSessionDuration || 0, 1)} min` },
      { label: 'Distanza totale', getValue: (p) => `${safeInt(p.detailed?.totalDistance || 0)} m` },
      { label: 'Player load medio', getValue: (p) => safeDec(p.detailed?.avgSessionLoad || 0, 1) },
      { label: 'Velocità max media', getValue: (p) => `${safeDec(p.detailed?.topSpeedMax || 0, 1)} km/h` },
    ];
    return renderCompareTable(metrics);
  };

  const renderLoadTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    const metrics = [
      { label: 'Distanza totale', getValue: (p) => `${safeInt(p.detailed?.totalDistance || 0)} m` },
      { label: 'Player load totale', getValue: (p) => safeInt(p.detailed?.totalPlayerLoad || 0) },
      { label: 'Durata totale', getValue: (p) => `${safeInt(p.detailed?.totalMinutes || 0)} min` },
      { label: 'Carico medio per sessione', getValue: (p) => safeDec(p.detailed?.avgSessionLoad || 0, 1) },
    ];
    return renderCompareTable(metrics);
  };

  const renderIntensityTab = () => {
    const metrics = [
      { label: 'PL/min', getValue: (p) => safeDec(p.detailed?.plPerMin || 0, 2) },
      { label: 'Velocità media', getValue: (p) => `${safeDec(p.detailed?.avgSpeed || 0, 2)} km/h` },
      { label: "Sprint per 90'", getValue: (p) => safeDec(p.summary?.sprintPer90 || 0, 2) },
    ];
    return renderCompareTable(metrics);
  };

  const renderCardioTab = () => {
    const metrics = [
      { label: 'FC media', getValue: (p) => `${safeDec(p.detailed?.avgHeartRate || 0, 1)} bpm` },
      { label: 'FC max', getValue: (p) => `${safeInt(p.detailed?.maxHeartRate || 0)} bpm` },
    ];
    return renderCompareTable(metrics);
  };

  const renderAccTab = () => {
    const metrics = [
      { label: 'Accelerazioni totali', getValue: (p) => safeInt(p.detailed?.totalAccelerations || 0) },
      { label: 'Decelerazioni totali', getValue: (p) => safeInt(p.detailed?.totalDecelerations || 0) },
      { label: 'Accel./min', getValue: (p) => safeDec(p.detailed?.accelPerMinute || 0, 2) },
      { label: 'Decel./min', getValue: (p) => safeDec(p.detailed?.decelPerMinute || 0, 2) },
    ];
    return renderCompareTable(metrics);
  };

  const renderSpeedTab = () => {
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

  const renderReadinessTab = () => {
    const metrics = [
      { label: 'ACWR', getValue: (p) => safeDec(p.detailed?.acwr || 0, 2) },
      { label: 'Strain', getValue: (p) => safeDec(p.detailed?.strain || 0, 1) },
    ];
    return renderCompareTable(metrics);
  };

  // Funzioni per i grafici (quando espanso)
  const renderSummaryCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafico a linea temporale - Player Load */}
        <TimeSeriesLineChartCard 
          title="Player Load nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('playerLoad')}
          metricKey="playerLoad"
        />
        
        {/* Grafico a linea temporale - Distanza */}
        <TimeSeriesLineChartCard 
          title="Distanza nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('distance')}
          metricKey="distance"
          unit="m"
        />
        
        {/* Grafico a linea temporale - Durata */}
        <TimeSeriesLineChartCard 
          title="Durata Sessioni nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('duration')}
          metricKey="duration"
          unit="min"
        />
        
        {/* Grafico a barre - Confronto totale */}
        <ChartCard 
          title="Confronto Totale" 
          data={toChartData('Sessioni', p => p.detailed?.totalSessions || 0)}
        />
      </div>
    );
  };

  const renderLoadCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Player Load nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('playerLoad')}
          metricKey="playerLoad"
        />
        <TimeSeriesLineChartCard 
          title="Distanza nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('distance')}
          metricKey="distance"
          unit="m"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="Player load totale" data={toChartData('PL', (p) => p.detailed?.totalPlayerLoad || 0)} />
        <ChartCard title="Carico medio per sessione" data={toChartData('PL medio', (p) => p.detailed?.avgSessionLoad || 0)} />
      </div>
    );
  };

  const renderIntensityCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Velocità Media nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('avgSpeed')}
          metricKey="avgSpeed"
          unit="km/h"
        />
        <TimeSeriesLineChartCard 
          title="Corsa ad Alta Intensità nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('highIntensityRuns')}
          metricKey="highIntensityRuns"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="PL/min" data={toChartData('PL/min', (p) => p.detailed?.plPerMin || 0)} />
        <ChartCard title="Sprint per 90'" data={toChartData('Sprint90', (p) => p.summary?.sprintPer90 || 0)} />
      </div>
    );
  };

  const renderCardioCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Frequenza Cardiaca Media nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('avgHeartRate')}
          metricKey="avgHeartRate"
          unit="bpm"
        />
        <TimeSeriesLineChartCard 
          title="Frequenza Cardiaca Max nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('maxHeartRate')}
          metricKey="maxHeartRate"
          unit="bpm"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="FC media - Confronto" data={toChartData('FC media', (p) => p.detailed?.avgHeartRate || 0)} unit="bpm" />
        <ChartCard title="FC max - Confronto" data={toChartData('FC max', (p) => p.detailed?.maxHeartRate || 0)} unit="bpm" />
      </div>
    );
  };

  const renderAccCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Accelerazioni nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('accEventsPerMinOver2Ms2')}
          metricKey="accEventsPerMinOver2Ms2"
          unit="/min"
        />
        <TimeSeriesLineChartCard 
          title="Decelerazioni nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('decEventsPerMinOverMinus2Ms2')}
          metricKey="decEventsPerMinOverMinus2Ms2"
          unit="/min"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="Accelerazioni totali" data={toChartData('Acc', (p) => p.detailed?.totalAccelerations || 0)} />
        <ChartCard title="Decelerazioni totali" data={toChartData('Dec', (p) => p.detailed?.totalDecelerations || 0)} />
      </div>
    );
  };

  const renderSpeedCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Distanza Sprint nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('sprintDistance')}
          metricKey="sprintDistance"
          unit="m"
        />
        <TimeSeriesLineChartCard 
          title="Velocità Media nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('avgSpeed')}
          metricKey="avgSpeed"
          unit="km/h"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="HSR %" data={toChartData('HSR%', (p) => p.detailed?.hsrPercentage || 0)} unit="%" />
        <ChartCard title="Sprint totali" data={toChartData('Sprint', (p) => p.detailed?.sprintCount || 0)} />
      </div>
    );
  };

  const renderReadinessCharts = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="charts-grid">
        {/* Grafici temporali */}
        <TimeSeriesLineChartCard 
          title="Player Load nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('playerLoad')}
          metricKey="playerLoad"
          unit=""
        />
        <TimeSeriesLineChartCard 
          title="Durata Sessioni nel Tempo" 
          timeSeriesData={toTimeSeriesLineData('duration')}
          metricKey="duration"
          unit="min"
        />
        
        {/* Grafici statici per confronto */}
        <ChartCard title="ACWR - Confronto" data={toChartData('ACWR', (p) => p.detailed?.acwr || 0)} />
        <ChartCard title="Strain - Confronto" data={toChartData('Strain', (p) => p.detailed?.strain || 0)} />
      </div>
    );
  };


  const renderTabContent = () => {
    if (isExpanded) {
      // Quando espanso, mostra i grafici
      switch (activeTab) {
        case 'summary':
          return renderSummaryCharts();
        case 'load':
          return renderLoadCharts();
        case 'intensity':
          return renderIntensityCharts();
        case 'cardio':
          return renderCardioCharts();
        case 'acc':
          return renderAccCharts();
        case 'speed':
          return renderSpeedCharts();
        case 'readiness':
          return renderReadinessCharts();
        default:
          return renderSummaryCharts();
      }
    } else {
      // Quando non espanso, mostra le tabelle
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
    }
  };

  return (
    <div className={`dossier-drawer ${isExpanded ? 'expanded' : ''}`} style={{ zIndex: 1000 }}>
      
      {/* Header drawer style */}
      <div className="dossier-header">
        <div className="player-info">
          <div className="player-avatar">
            <div className="avatar-placeholder">
              <GitCompare size={24} />
            </div>
          </div>
          <div className="player-details">
            <h3>Confronto Giocatori ({players.length})</h3>
            <p>
              {players.map((player, index) => (
                <span key={player.id} style={{ color: playerColors[index] }}>
                  {player.firstName} {player.lastName}
                  {index < players.length - 1 && <span style={{ color: '#6b7280' }}> • </span>}
                </span>
              ))}
            </p>
          </div>
        </div>
        
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
                showSort={true}
                mode="compact"
              />
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* KPI header rimosso: non più necessario */}

      {/* Legenda giocatori */}
      <div className="compare-legend">
        <h4>Giocatori</h4>
        <div className="legend-items">
          {players.map((player, index) => (
            <div key={player.id} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: playerColors[index] }}
              ></div>
              <span style={{ textAlign: 'center', display: 'block' }}>{player.firstName} {player.lastName}</span>
              <span className="legend-role">{getRoleIcon(player.position)} {(() => {
                const map = { 
                  POR: 'Portiere', DIF: 'Difensore', CEN: 'Centrocampista', ATT: 'Attaccante',
                  GOALKEEPER: 'Portiere', DEFENDER: 'Difensore', MIDFIELDER: 'Centrocampista', FORWARD: 'Attaccante'
                };
                return map[player.position] || player.position;
              })()} #{player.shirtNumber}</span>
          </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="drawer-tabs">
        {TABS.map((tab) => (
        <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <tab.icon size={16} />
            {tab.title}
        </button>
        ))}
      </div>

      {/* Contenuto tab con grafici */}
      <div className="drawer-content">
        {renderTabContent()}
      </div>

      {/* Footer drawer style */}
      <div className="drawer-footer">
        <div className="drawer-footer__left">
          <button type="button" className="btn ghost" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div className="drawer-footer__right">
          {!isExpanded && (
            <button
              type="button"
              className="btn primary"
              onClick={() => setIsExpanded(true)}
            >
              <BarChart3 size={16} />
              Dettagli Grafici
            </button>
          )}
          {isExpanded && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setIsExpanded(false)}
            >
              <ArrowLeft size={16} />
              Torna alla Tabella
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareOverlay;