// src/pages/performance/ComparePage.jsx
// 🏆 PAGINA CONFRONTO MULTI-GIOCATORE - Identica a DossierPage ma con più giocatori
// Applica i log colorati standard come richiesto

import React, { useState, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, 
  ArrowLeft,
  Maximize2, 
  Minimize2,
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
  ChevronUp,
  ChevronDown,
  GitCompare,
  Settings,
  BarChart3,
  Users,
  Download,
  RefreshCw
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';
import { apiFetch } from '../../utils/http';

// Import di tutte le sezioni di AnalyticsAdvanced
import CaricoVolumi from '../../components/analytics/sections/CaricoVolumi';
import Intensita from '../../components/analytics/sections/Intensita';
import AltaVelocita from '../../components/analytics/sections/AltaVelocita';
import Accelerazioni from '../../components/analytics/sections/Accelerazioni';
import Energetico from '../../components/analytics/sections/Energetico';
import RischioRecupero from '../../components/analytics/sections/RischioRecupero';
import Comparazioni from '../../components/analytics/sections/Comparazioni';
import ReportCoach from '../../components/analytics/sections/ReportCoach';

import '../../modules/filters/filters.css';

// Memoizza le sezioni per evitare re-render inutili
const MemoizedCaricoVolumi = memo(CaricoVolumi);
const MemoizedIntensita = memo(Intensita);
const MemoizedAltaVelocita = memo(AltaVelocita);
const MemoizedAccelerazioni = memo(Accelerazioni);
const MemoizedEnergetico = memo(Energetico);
const MemoizedRischioRecupero = memo(RischioRecupero);
const MemoizedComparazioni = memo(Comparazioni);
const MemoizedReportCoach = memo(ReportCoach);

// =========================
// CONFIGURAZIONE SEZIONI (identica ad AnalyticsAdvanced)
// =========================
const SECTIONS = [
  {
    id: 'carico-volumi',
    title: 'Carico & Volumi',
    icon: BarChart3,
    description: 'Distanze, volumi e carichi di lavoro',
    color: '#3B82F6',
    charts: [
      'Distanza totale per sessione/partita',
      'Distanza equivalente vs reale', 
      'Training Load settimanale',
      'ACWR per giocatore',
      'Distribuzione carico per tipologia'
    ]
  },
  {
    id: 'intensita',
    title: 'Intensità',
    icon: TrendingUp,
    description: 'Velocità, potenza metabolica e zone di intensità',
    color: '#10B981',
    charts: [
      'Distanza/minuto',
      'Potenza metabolica media',
      'Tempo nelle zone di potenza',
      'Boxplot per ruolo',
      'Confronto intensità squadre'
    ]
  },
  {
    id: 'alta-velocita',
    title: 'Alta Velocità & Sprint',
    icon: Zap,
    description: 'Sprint, HSR e velocità massime',
    color: '#F59E0B',
    charts: [
      'Distanza sopra 15/20/25 km/h',
      'HSR% rispetto distanza totale',
      'Numero sprint vs top speed',
      'Top speed per giocatore nel tempo',
      'Analisi sprint per ruolo'
    ]
  },
  {
    id: 'accelerazioni',
    title: 'Accelerazioni & Decelerazioni',
    icon: Gauge,
    description: 'Acc/Dec, stress meccanico e densità azioni',
    color: '#8B5CF6',
    charts: [
      'Numero acc/dec >3 m/s²',
      'Rapporto accelerazioni/decelerazioni',
      'Distribuzione distanze in acc/dec',
      'Acc/Dec per minuto',
      'Stress meccanico cumulativo'
    ]
  },
  {
    id: 'energetico',
    title: 'Energetico & Metabolico',
    icon: Activity,
    description: 'Potenza metabolica, RVP e costi energetici',
    color: '#EF4444',
    charts: [
      'Potenza metabolica per sessione',
      'RVP (Relative Velocity Power)',
      'Costi energetici per ruolo',
      'Distribuzione potenza metabolica',
      'Confronto energetico squadre'
    ]
  },
  {
    id: 'rischio-recupero',
    title: 'Rischio & Recupero', 
    icon: Heart,
    description: 'ACWR, monotonia, strain e readiness',
    color: '#EC4899',
    charts: [
      'ACWR per giocatore',
      'Monotonia del carico',
      'Strain vs fitness',
      'Readiness score',
      'Rischio infortunio'
    ]
  },
  {
    id: 'comparazioni',
    title: 'Comparazioni',
    icon: GitCompare,
    description: 'Confronti diretti e benchmarking',
    color: '#6366F1',
    charts: [
      'Radar chart multi-giocatore',
      'Percentili per ruolo',
      'Confronto temporale',
      'Ranking squadra',
      'Gap analysis'
    ]
  },
  {
    id: 'report-coach',
    title: 'Report Coach',
    icon: Target,
    description: 'Insights e raccomandazioni per staff tecnico',
    color: '#059669',
    charts: [
      'Sintesi performance',
      'Raccomandazioni allenamento', 
      'Alert automatici',
      'Trend settimanali',
      'Piano personalizzato'
    ]
  }
];

// =========================
// COMPONENT PRINCIPALE
// =========================
export default function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters } = useFilters();

  // Estrai player IDs dai query params
  const playersParam = searchParams.get('players');
  const playerIds = playersParam ? playersParam.split(',') : [];

  // Stati principali (identici a DossierPage)
  const [compareData, setCompareData] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('carico-volumi');
  const [isFullscreen, setIsFullscreen] = useState(true); // Compare sempre fullscreen
  const [showFilters, setShowFilters] = useState(false);
  
  console.log('🟢 ComparePage: inizializzazione confronto per', playerIds.length, 'giocatori'); // INFO - rimuovere in produzione

  // Helper per formattazione sicura (identici a DossierPage)
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const safePct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;
  const safeDec = (v, d=2) => Number.isFinite(v) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits:d, maximumFractionDigits:d }) : 'N/A';
  const safeInt = (v) => Number.isFinite(v) ? Math.round(v).toLocaleString('it-IT') : 'N/A';

  // Helper per trend (identici a DossierPage)
  const getTrendIcon = (trend) => {
    if (trend === null || trend === 0) return <Minus size={12} className="text-gray-400" />;
    return trend > 0 
      ? <TrendingUp size={12} className="text-green-500" />
      : <TrendingDown size={12} className="text-red-500" />;
  };

  // =========================
  // LOGICA SELEZIONE GIOCATORI INTELLIGENTE
  // =========================
  const validateAndLimitPlayers = (playerIds, filters) => {
    console.log('🔵 ComparePage: validazione selezione giocatori', { playerIds, roleFilter: filters.roles }); // INFO DEV - rimuovere in produzione
    
    // Se filtro specifico per ruolo, consenti tutti i giocatori di quel ruolo
    if (filters.roles && filters.roles.length === 1) {
      console.log('🟡 ComparePage: filtro singolo ruolo attivo, no limite 8 giocatori'); // WARNING - rimuovere in produzione
      return playerIds; // Nessun limite per ruoli specifici
    }
    
    // Se ruoli misti o nessun filtro ruolo, max 8 giocatori
    if (playerIds.length > 8) {
      console.log('🟡 ComparePage: limitando a 8 giocatori per ruoli misti', { originale: playerIds.length }); // WARNING - rimuovere in produzione
      return playerIds.slice(0, 8);
    }
    
    return playerIds;
  };

  // =========================
  // FETCH DATI CONFRONTO
  // =========================
  useEffect(() => {
    // Validazione giocatori
    if (playerIds.some(id => isNaN(id) || id <= 0)) {
      console.log('🔴 ComparePage: ID giocatori non validi'); // ERROR - mantenere essenziali
      setError('ID giocatori non validi');
      setIsLoading(false);
      return;
    }
    
    // Limite massimo assoluto (sicurezza)
    if (playerIds.length > 50) {
      console.log('🔴 ComparePage: troppi giocatori selezionati'); // ERROR - mantenere essenziali
      setError('Troppi giocatori selezionati (max 50)');
      setIsLoading(false);
      return;
    }

    if (!playerIds || playerIds.length === 0) {
      console.log('🔴 ComparePage: nessun giocatore selezionato per confronto'); // ERROR - mantenere essenziali
      setError('Nessun giocatore selezionato per il confronto');
      setIsLoading(false);
      return;
    }

    const fetchCompareData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Applica logica di limitazione giocatori
        const validatedPlayerIds = validateAndLimitPlayers(playerIds, filters);
        
        const params = buildPerformanceQuery(filters);
        
        console.log('🔵 ComparePage: fetch dati confronto', { 
          playerIds: validatedPlayerIds, 
          filters,
          url: `/api/performance/compare?players=${validatedPlayerIds.join(',')}&${params}`
        }); // INFO DEV - rimuovere in produzione

        const response = await apiFetch(`/api/performance/compare?players=${validatedPlayerIds.join(',')}&${params}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('🟢 ComparePage: dati confronto caricati', { 
          giocatori: data.players?.length || 0, 
          sessioni: data.allSessions?.length || 0 
        }); // INFO - rimuovere in produzione
        
        setCompareData(data.allSessions || []);
        setPlayers(data.players || []);
        
      } catch (err) {
        console.log('🔴 ComparePage: errore caricamento dati confronto:', err.message); // ERROR - mantenere essenziali
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompareData();
  }, [playerIds.join(','), filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.startDate, filters.endDate]);

  // =========================
  // HANDLERS
  // =========================
  const handleSectionChange = (sectionId) => {
    console.log('🔵 ComparePage: cambio sezione', { da: activeSection, a: sectionId }); // INFO DEV - rimuovere in produzione
    setActiveSection(sectionId);
  };

  const handleClose = () => {
    console.log('🟢 ComparePage: chiusura e ritorno alla lista giocatori'); // INFO - rimuovere in produzione
    navigate('/performance/players');
  };

  // =========================
  // RENDER SEZIONI (identico ad AnalyticsAdvanced)
  // =========================
  const renderSectionContent = () => {
    if (!compareData || compareData.length === 0) {
      return (
        <div className="section-content active">
          <div className="card chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <GitCompare size={20} />
                Nessun dato disponibile
              </h3>
            </div>
            <div className="chart-content">
              <div className="chart-no-data">
                <GitCompare size={48} />
                <h3>Confronto non disponibile</h3>
                <p>Non ci sono dati sufficienti per il confronto dei giocatori selezionati.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const activeSectionData = SECTIONS.find(s => s.id === activeSection);
    const sectionProps = {
      data: compareData,
      players: players,
      filters: filters,
      mode: 'compare', // 🎯 CHIAVE: indica alle sezioni che siamo in modalità confronto
      comparePlayerIds: playerIds // 🎯 CHIAVE: passa gli ID per evidenziare i giocatori confrontati
    };

    console.log('🔵 ComparePage: rendering sezione', activeSection, 'con', compareData.length, 'records e', players.length, 'giocatori'); // INFO DEV - rimuovere in produzione

    switch (activeSection) {
      case 'carico-volumi':
        return <MemoizedCaricoVolumi {...sectionProps} />;
      
      case 'intensita':
        return <MemoizedIntensita {...sectionProps} />;
      
      case 'alta-velocita':
        return <MemoizedAltaVelocita {...sectionProps} />;
      
      case 'accelerazioni':
        return <MemoizedAccelerazioni {...sectionProps} />;
      
      case 'energetico':
        return <MemoizedEnergetico {...sectionProps} />;
      
      case 'rischio-recupero':
        return <MemoizedRischioRecupero {...sectionProps} />;
      
      case 'comparazioni':
        return <MemoizedComparazioni {...sectionProps} />;
      
      case 'report-coach':
        return <MemoizedReportCoach {...sectionProps} />;
        
      default:
        return (
          <div className="section-content active">
            <div className="card chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <activeSectionData.icon size={20} />
                  {activeSectionData.title}
                </h3>
              </div>
              <div className="chart-content">
                <div className="chart-no-data">
                  <BarChart3 size={48} />
                  <h3>Sezione in sviluppo</h3>
                  <p>I grafici per "{activeSectionData.title}" saranno disponibili presto!</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // =========================
  // RENDER LOADING STATE
  // =========================
  if (isLoading) {
    return (
      <div className="dossier-page fullscreen">
        <div className="dossier-header">
          <div className="loading-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text"></div>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dossier-content">
          <div className="loading-skeleton">
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
            <div className="skeleton-kpi"></div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER ERROR STATE  
  // =========================
  if (error) {
    return (
      <div className="dossier-page fullscreen">
        <div className="dossier-header">
          <div className="player-info">
            <div className="player-details">
              <h3>Errore Confronto</h3>
              <p>Impossibile caricare i dati</p>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <div className="dossier-content">
          <div className="error-state">
            <GitCompare size={48} />
            <h3>Errore nel caricamento</h3>
            <p>{error}</p>
            <button className="btn primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER PRINCIPALE
  // =========================
  return (
    <div className={`dossier-page ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header con info giocatori confrontati */}
      <div className="dossier-header">
        <div className="compare-info">
          <div className="compare-icon">
            <GitCompare size={24} />
          </div>
          <div className="compare-details">
            <h3>Confronto Multi-Giocatore</h3>
            <p>{players.length} giocatori selezionati</p>
            <div className="players-preview">
              {players.slice(0, 3).map(player => (
                <span key={player.id} className="player-chip">
                  {player.firstName} {player.lastName}
                </span>
              ))}
              {players.length > 3 && (
                <span className="more-players">+{players.length - 3} altri</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* FilterBar minimal come DossierDrawer */}
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
              pageId="COMPARE_PAGE" 

              showSort={false}
              mode="compact"
            />
          </div>
        )}
      </div>

      {/* KPI Header - Mostra statistiche aggregate */}
      <div className="kpi-header">
        <div className="kpi-item">
          <div className="kpi-label">
            <Users size={14} /> Giocatori
          </div>
          <div className="kpi-value">
            {players.length}
            <span className="kpi-detail">selezionati</span>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Calendar size={14} /> Sessioni
          </div>
          <div className="kpi-value">
            {compareData.length}
            <span className="kpi-detail">totali</span>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Clock size={14} /> Periodo
          </div>
          <div className="kpi-value">
            {filters.period === 'custom' ? 'Personalizzato' : filters.period}
            <span className="kpi-detail">filtrato</span>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-label">
            <Target size={14} /> Modalità
          </div>
          <div className="kpi-value">
            Confronto
            <span className="kpi-detail">multi-player</span>
          </div>
        </div>
      </div>

      {/* Tab navigazione sezioni (identiche ad AnalyticsAdvanced) */}
      <div className="dossier-tabs">
        {SECTIONS.map((section) => (
        <button 
            key={section.id}
            className={`tab-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => handleSectionChange(section.id)}
            style={{ '--section-color': section.color }}
          >
            <section.icon size={16} />
            <span className="tab-label">{section.title}</span>
        </button>
        ))}
      </div>
      
      {/* Contenuto principale con le sezioni */}
      <div className="dossier-content">
        {renderSectionContent()}
      </div>

      {/* Footer con azioni */}
      <div className="dossier-footer">
        <div className="footer-left">
          <button className="btn ghost" onClick={handleClose}>
            <ArrowLeft size={16} />
            Torna alla Lista
          </button>
        </div>
        <div className="footer-right">
          <button className="btn secondary">
            <Download size={16} />
            Esporta Confronto
          </button>
        </div>
      </div>
    </div>
  );
}

console.log('🟢 ComparePage: componente definito e pronto per l\'uso'); // INFO - rimuovere in produzione