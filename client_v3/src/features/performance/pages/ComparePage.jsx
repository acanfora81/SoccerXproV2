// src/pages/performance/ComparePage.jsx
// 🏆 PAGINA CONFRONTO MULTI-GIOCATORE - Replica di CompareOverlay in formato pagina

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
import '@/modules/filters/filters.css';

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
  
  // Helper functions (identiche a CompareOverlay)
  const safeDec = (value, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : '0.00';
  };
  
  const safeInt = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.round(num) : 0;
  };

  // Fetch dei dati (identico a CompareOverlay)
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
      console.log('🔍 ComparePage: struttura dati:', {
        hasPlayers: !!data.players,
        playersLength: data.players?.length || 0,
        firstPlayer: data.players?.[0],
        sampleDetailed: data.players?.[0]?.detailed,
        firstPlayerKeys: data.players?.[0] ? Object.keys(data.players[0]) : []
      });
      
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

  // Tabella comparativa dinamica (identica a CompareOverlay)
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
                  <td key={p.id} style={{ textAlign: 'center' }}>
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
    <div className="chart-card">
      <div className="chart-header"><h4>{title}</h4></div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v) => `${v}${unit ? ' ' + unit : ''}`} />
            <Legend />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Render functions con grafici comparativi
  const renderSummaryTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="Sessioni totali" data={toChartData('Sessioni totali', (p) => safeInt(p.detailed?.totalSessions || 0))} />
          <ChartCard title="Durata media sessione" data={toChartData('Durata media', (p) => Number(safeDec(p.detailed?.avgSessionDuration || 0, 1)))} unit="min" color="#10B981" />
          <ChartCard title="Distanza totale" data={toChartData('Distanza totale', (p) => safeInt(p.detailed?.totalDistance || 0))} unit="m" color="#8B5CF6" />
          <ChartCard title="Player load medio" data={toChartData('PL medio', (p) => Number(safeDec(p.detailed?.avgSessionLoad || 0, 1)))} color="#F59E0B" />
          <ChartCard title="Velocità max" data={toChartData('Velocità max', (p) => Number(safeDec(p.detailed?.topSpeedMax || 0, 1)))} unit="km/h" color="#EF4444" />
        </div>
      </div>
    );
  };

  const renderLoadTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

      return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="Distanza totale" data={toChartData('Distanza', (p) => safeInt(p.detailed?.totalDistance || 0))} unit="m" />
          <ChartCard title="Player load totale" data={toChartData('PL', (p) => safeInt(p.detailed?.totalPlayerLoad || 0))} color="#F59E0B" />
          <ChartCard title="Durata totale" data={toChartData('Minuti', (p) => safeInt(p.detailed?.totalMinutes || 0))} unit="min" color="#10B981" />
          <ChartCard title="Carico medio per sessione" data={toChartData('PL medio', (p) => Number(safeDec(p.detailed?.avgSessionLoad || 0, 1)))} color="#8B5CF6" />
              </div>
            </div>
    );
  };

  const renderIntensityTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="PL/min" data={toChartData('PL/min', (p) => Number(safeDec(p.detailed?.plPerMin || 0, 2)))} color="#F59E0B" />
          <ChartCard title="Velocità media" data={toChartData('Velocità media', (p) => Number(safeDec(p.detailed?.avgSpeed || 0, 2)))} unit="km/h" />
          <ChartCard title="Sprint per 90'" data={toChartData('Sprint90', (p) => Number(safeDec(p.summary?.sprintPer90 || 0, 2)))} color="#EF4444" />
          </div>
        </div>
      );
  };

  const renderCardioTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="FC media" data={toChartData('FC media', (p) => Number(safeDec(p.detailed?.avgHeartRate || 0, 1)))} unit="bpm" />
          <ChartCard title="FC max" data={toChartData('FC max', (p) => safeInt(p.detailed?.maxHeartRate || 0))} unit="bpm" color="#EF4444" />
        </div>
      </div>
    );
  };

  const renderAccTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="Accelerazioni totali" data={toChartData('Acc', (p) => safeInt(p.detailed?.totalAccelerations || 0))} />
          <ChartCard title="Decelerazioni totali" data={toChartData('Dec', (p) => safeInt(p.detailed?.totalDecelerations || 0))} />
          <ChartCard title="Accel./min" data={toChartData('Acc/min', (p) => Number(safeDec(p.detailed?.accelPerMinute || 0, 2)))} />
          <ChartCard title="Decel./min" data={toChartData('Dec/min', (p) => Number(safeDec(p.detailed?.decelPerMinute || 0, 2)))} />
        </div>
      </div>
    );
  };

  const renderSpeedTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

        return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="HSR totale" data={toChartData('HSR', (p) => safeInt(p.detailed?.hsrTotal || 0))} unit="m" />
          <ChartCard title="Sprint totali" data={toChartData('Sprint', (p) => safeInt(p.detailed?.sprintCount || 0))} color="#F59E0B" />
          <ChartCard title="Top speed" data={toChartData('Top speed', (p) => Number(safeDec(p.detailed?.topSpeedMax || 0, 2)))} unit="km/h" color="#EF4444" />
          <ChartCard title="Dist. 15-20 km/h" data={toChartData('15-20', (p) => safeInt(p.detailed?.distance15_20 || 0))} unit="m" />
          <ChartCard title="Dist. 20-25 km/h" data={toChartData('20-25', (p) => safeInt(p.detailed?.distance20_25 || 0))} unit="m" />
          <ChartCard title="Dist. > 25 km/h" data={toChartData('>25', (p) => safeInt(p.detailed?.distanceOver25 || 0))} unit="m" />
                </div>
              </div>
    );
  };

  const renderReadinessTab = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

    return (
      <div className="tab-content">
        <div className="charts-grid">
          <ChartCard title="ACWR" data={toChartData('ACWR', (p) => Number(safeDec(p.detailed?.acwr || 0, 2)))} />
          <ChartCard title="Strain" data={toChartData('Strain', (p) => Number(safeDec(p.detailed?.strain || 0, 1)))} color="#8B5CF6" />
            </div>
          </div>
        );
  };

  // Funzioni per le tabelle (quando non espanso)
  const renderSummaryTable = () => {
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

  const renderLoadTable = () => {
    if (!players.length) return <div>Nessun dato disponibile</div>;

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
      <div className="compare-page-drawer">
        <div className="compare-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
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

  // Error state
  if (error || !players || players.length === 0) {
    return (
      <div className="compare-page-drawer">
        <div className="compare-header">
              <h3>Errore Confronto</h3>
          <button className="close-btn" onClick={handleClose}>
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

  const handleClose = () => {
    navigate(-1); // Torna indietro nella cronologia
  };


  return (
    <div className={`compare-page-drawer ${isExpanded ? 'expanded' : ''}`}>
      {/* Header identico a CompareOverlay */}
      <div className="compare-header">
        <div className="compare-title">
          <GitCompare size={20} />
          <h3>Confronto Multi-Giocatore</h3>
          </div>
        <div className="compare-players-names">
          {players.map((player, index) => (
            <React.Fragment key={player.id}>
              <span className="player-name" style={{ color: playerColors[index] }}>
                  {player.firstName} {player.lastName}
                </span>
              {index < players.length - 1 && <span className="vs">VS</span>}
            </React.Fragment>
              ))}
        </div>
        <div className="header-actions">
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="compare-filters">
        <FiltersBar />
      </div>

      {/* Contenuto principale */}
      <div className="compare-content">
        {/* Tab navigation */}
        <div className="drawer-tabs">
          {TABS.map((tab) => (
        <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
        </button>
        ))}
      </div>
      
        {/* Tab content */}
        {renderTabContent()}
      </div>

      {/* Footer del drawer */}
      <div className="drawer-footer">
        <div className="drawer-footer__left">
          <button type="button" className="btn ghost" onClick={handleClose}>
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

export default ComparePage;