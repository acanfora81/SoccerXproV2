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
import { apiFetch } from '../../utils/http';
import { useFilters, buildPerformanceQuery } from '../../modules/filters/index.js';
import { FiltersBar } from '../../modules/filters/index.js';
import { formatItalianNumber } from '../../utils/italianNumbers';

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
      <div className="compare-drawer">
        <div className="drawer-header">
          <div className="compare-info">
            <div className="compare-icon">
              <GitCompare size={24} />
            </div>
            <div className="compare-details">
              <h3>Confronto Giocatori</h3>
              <p>Caricamento...</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Caricamento dati confronto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compare-drawer">
        <div className="drawer-header">
          <div className="compare-info">
            <div className="compare-icon">
              <GitCompare size={24} />
            </div>
            <div className="compare-details">
              <h3>Confronto Giocatori</h3>
              <p>Errore caricamento</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <div className="error-state">
            <h3>Errore caricamento dati</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Riprova
            </button>
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
    <div className={`compare-drawer ${isRefreshing ? 'refreshing' : ''}`}>
      {/* Indicatore refresh discreto */}
      {isRefreshing && (
        <div className="drawer-refresh-indicator">
          <div className="refresh-spinner"></div>
          <span>Aggiornamento...</span>
        </div>
      )}

      {/* Header */}
      <div className="drawer-header">
        <div className="compare-info">
          <div className="compare-icon">
            <GitCompare size={24} />
          </div>
          <div className="compare-details">
            <h3>Confronto Giocatori</h3>
            <p>{players.length} giocatori selezionati</p>
          </div>
        </div>
        
        {/* FilterBar unificata */}
        <div className="filters-container">
          <FiltersBar 
            showSort={true}
            mode="compact"
          />
        </div>
        
        <div className="header-actions">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* KPI Header */}
      <div className="kpi-header">
        <div className="kpi-item">
          <div className="kpi-label">
            <Users size={14} /> Giocatori
          </div>
          <div className="kpi-value">
            {players.length}
          </div>
          <div className="kpi-percentile">Confronto attivo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Calendar size={14} /> Sessioni
          </div>
          <div className="kpi-value">
            {compareData.length}
          </div>
          <div className="kpi-percentile">Totale periodo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Clock size={14} /> Periodo
          </div>
          <div className="kpi-value">
            {filters.period}
          </div>
          <div className="kpi-percentile">Filtro attivo</div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Activity size={14} /> Tipo
          </div>
          <div className="kpi-value">
            {filters.sessionType === 'all' ? 'Tutti' : filters.sessionType}
          </div>
          <div className="kpi-percentile">Sessione</div>
        </div>
      </div>

      {/* Contenuto completo con tutti i grafici */}
      <div className="compare-drawer__content">
        {/* Sezione Carico & Volumi */}
        <div className="section-container">
          <div className="section-header">
            <BarChart3 size={20} />
            <h2>Carico & Volumi</h2>
            <p>Distanze, volumi e carichi di lavoro</p>
          </div>
          <CaricoVolumi {...sectionProps} />
        </div>

        {/* Sezione Intensità */}
        <div className="section-container">
          <div className="section-header">
            <TrendingUp size={20} />
            <h2>Intensità</h2>
            <p>Velocità, potenza metabolica e zone di intensità</p>
          </div>
          <Intensita {...sectionProps} />
        </div>

        {/* Sezione Alta Velocità & Sprint */}
        <div className="section-container">
          <div className="section-header">
            <Zap size={20} />
            <h2>Alta Velocità & Sprint</h2>
            <p>Sprint, HSR e velocità massime</p>
          </div>
          <AltaVelocita {...sectionProps} />
        </div>

        {/* Sezione Accelerazioni & Decelerazioni */}
        <div className="section-container">
          <div className="section-header">
            <Gauge size={20} />
            <h2>Accelerazioni & Decelerazioni</h2>
            <p>Acc/Dec, stress meccanico e densità azioni</p>
          </div>
          <Accelerazioni {...sectionProps} />
        </div>

        {/* Sezione Energetico */}
        <div className="section-container">
          <div className="section-header">
            <Activity size={20} />
            <h2>Energetico</h2>
            <p>Consumi energetici e zone metaboliche</p>
          </div>
          <Energetico {...sectionProps} />
        </div>

        {/* Sezione Rischio & Recupero */}
        <div className="section-container">
          <div className="section-header">
            <Heart size={20} />
            <h2>Rischio & Recupero</h2>
            <p>ACWR, readiness e gestione carichi</p>
          </div>
          <RischioRecupero {...sectionProps} />
        </div>

        {/* Sezione Comparazioni */}
        <div className="section-container">
          <div className="section-header">
            <GitCompare size={20} />
            <h2>Comparazioni</h2>
            <p>Confronti diretti tra giocatori</p>
          </div>
          <Comparazioni {...sectionProps} />
        </div>

        {/* Sezione Report Coach */}
        <div className="section-container">
          <div className="section-header">
            <Target size={20} />
            <h2>Report Coach</h2>
            <p>Sintesi per staff tecnico</p>
          </div>
          <ReportCoach {...sectionProps} />
        </div>
      </div>

      {/* Footer */}
      <div className="drawer-footer">
        <div className="drawer-footer__left">
          <button type="button" className="btn ghost" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div className="drawer-footer__right">
          <button className="btn primary" onClick={() => window.open(`/performance/compare?players=${playerIds.join(',')}`, '_blank')}>
            Apri in pagina
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareDrawer;
