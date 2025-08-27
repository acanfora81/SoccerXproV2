import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Gauge, 
  Activity, 
  Shield, 
  Users, 
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import '../../styles/analytics/index.css';

// Import dei componenti delle sezioni
import CaricoVolumi from './sections/CaricoVolumi';
// import Intensita from './sections/Intensita';
// import AltaVelocita from './sections/AltaVelocita';
// import Accelerazioni from './sections/Accelerazioni';
// import Energetico from './sections/Energetico';
// import RischioRecupero from './sections/RischioRecupero';
// import Comparazioni from './sections/Comparazioni';
// import ReportCoach from './sections/ReportCoach';

const AnalyticsAdvanced = () => {
  // =========================
  // STATE MANAGEMENT
  // =========================
  const [activeSection, setActiveSection] = useState('carico-volumi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtri globali
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [sessionType, setSessionType] = useState('all');
  const [viewMode, setViewMode] = useState('charts'); // charts, table, compact
  
  // Dati
  const [players, setPlayers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [sessionsByPlayer, setSessionsByPlayer] = useState({});

  // =========================
  // CONFIGURAZIONE SEZIONI
  // =========================
  const sections = [
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
        'Distanza sopra 20 e 35 W/kg',
        '% distanza equivalente su reale',
        'Indice RVP per giocatore',
        'MaxPM5 (power max 5s)',
        'Analisi costi energetici'
      ]
    },
    {
      id: 'rischio-recupero',
      title: 'Rischio & Recupero',
      icon: Shield,
      description: 'Monitoraggio infortuni e gestione carichi',
      color: '#06B6D4',
      charts: [
        'Training Load giornaliero/settimanale',
        'ACWR con zone colorate',
        'Carico meccanico cumulativo',
        'Trend distanza equivalente',
        'Indicatori semaforo per giocatore'
      ]
    },
    {
      id: 'comparazioni',
      title: 'Comparazioni & Correlazioni',
      icon: Users,
      description: 'Correlazioni, confronti e analisi multivariate',
      color: '#84CC16',
      charts: [
        'Correlazione Player Load vs Distanza',
        'Correlazione accelerazioni vs infortuni',
        'Confronto allenamenti vs partite',
        'Radar chart per ruolo',
        'Analisi multivariate'
      ]
    },
    {
      id: 'report-coach',
      title: 'Report Coach',
      icon: Target,
      description: 'Report pratici per preparatori atletici',
      color: '#F97316',
      charts: [
        'Confronto Drill per tipo',
        'Confronto Match Day -1, -2, +1',
        'Heatmap carichi settimanali',
        'Ranking giocatori per metriche',
        'Report personalizzati'
      ]
    }
  ];

  // =========================
  // DATA FETCHING
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch players
        const playersResponse = await fetch('/api/players', {
          credentials: 'include'
        });
        
        if (!playersResponse.ok) {
          throw new Error('Errore nel caricamento giocatori');
        }
        
                 const playersResponseData = await playersResponse.json();
         
         // L'API restituisce { message, data, count } - prendiamo solo data
         const playersData = playersResponseData.data || playersResponseData;
         
         // Controllo sicurezza: assicuriamoci che sia un array
         if (!Array.isArray(playersData)) {
           console.error('API players ha restituito:', playersResponseData);
           throw new Error('Formato dati giocatori non valido');
         }
         
         setPlayers(playersData);

                 // Fetch performance data - USIAMO LA STESSA LOGICA DI ANALYTICS NORMALE
         console.log('🔄 Caricamento dati performance completi...');
         
         // Carica performance data come in Analytics normale
         const performanceResponse = await fetch('/api/performance?page=1&pageSize=10000', {
           credentials: 'include',
           headers: { 'Content-Type': 'application/json' }
         });
         
         if (!performanceResponse.ok) {
           throw new Error('Errore nel caricamento dati performance');
         }
         
         const performanceResult = await performanceResponse.json();
         const performanceList = performanceResult.data || performanceResult.sessions || [];
         

         
         setPerformanceData(performanceList);
         
         // Organizza i dati per giocatore (come in Analytics normale)
         const sessionsByPlayerMap = {};
         playersData.forEach(player => {
           const playerSessions = performanceList.filter(s => s.playerId === player.id);
           sessionsByPlayerMap[player.id] = playerSessions;
         });
         
         setSessionsByPlayer(sessionsByPlayerMap);

      } catch (err) {
        console.error('Errore nel caricamento dati:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================
  // COMPUTED VALUES
  // =========================
  const activeSectionData = useMemo(() => {
    return sections.find(section => section.id === activeSection);
  }, [activeSection]);

     const filteredData = useMemo(() => {
     if (!performanceData.length) return [];
     
     const daysBack = timeRange === '7d' ? 7 : 
                     timeRange === '14d' ? 14 : 
                     timeRange === '30d' ? 30 : 
                     timeRange === '90d' ? 90 : 365;
     
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - daysBack);
     
     const filtered = performanceData.filter(session => {
       const sessionDate = new Date(session.session_date);
       const matchesTimeRange = sessionDate >= cutoffDate;
       const matchesSessionType = sessionType === 'all' || session.session_type === sessionType;
       const matchesPlayer = selectedPlayers.length === 0 || selectedPlayers.includes(session.playerId);
       
       return matchesTimeRange && matchesSessionType && matchesPlayer;
     });
     
     
     
     return filtered;
   }, [performanceData, timeRange, sessionType, selectedPlayers]);

  // =========================
  // EVENT HANDLERS
  // =========================
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handlePlayerSelection = (playerIds) => {
    setSelectedPlayers(playerIds);
  };

  const handleSessionTypeChange = (newSessionType) => {
    setSessionType(newSessionType);
  };

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
  };

  const handleExportData = () => {
    // TODO: Implementare export dati
    console.log('Export dati per sezione:', activeSection);
  };

  const handleRefreshData = () => {
    // TODO: Implementare refresh dati
    console.log('Refresh dati');
  };

  // =========================
  // RENDER FUNCTIONS
  // =========================
  const renderLoadingState = () => (
    <div className="analytics-loading">
      <div className="spinner"></div>
      <h3>Caricamento Analytics Avanzate</h3>
      <p>Stiamo preparando i tuoi dati...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="analytics-alert danger">
      <h3>Errore nel caricamento</h3>
      <p>{error}</p>
      <button 
        className="analytics-btn primary"
        onClick={() => window.location.reload()}
      >
        <RefreshCw size={16} />
        Riprova
      </button>
    </div>
  );

  const renderSectionContent = () => {
    const sectionProps = {
      data: filteredData,
      players,
      sessionsByPlayer,
      timeRange,
      sessionType
    };

    switch (activeSection) {
      case 'carico-volumi':
        return <CaricoVolumi {...sectionProps} />;
      // case 'intensita':
      //   return <Intensita {...sectionProps} />;
      // case 'alta-velocita':
      //   return <AltaVelocita {...sectionProps} />;
      // case 'accelerazioni':
      //   return <Accelerazioni {...sectionProps} />;
      // case 'energetico':
      //   return <Energetico {...sectionProps} />;
      // case 'rischio-recupero':
      //   return <RischioRecupero {...sectionProps} />;
      // case 'comparazioni':
      //   return <Comparazioni {...sectionProps} />;
      // case 'report-coach':
      //   return <ReportCoach {...sectionProps} />;
      default:
        return (
          <div className="section-content active">
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <activeSectionData.icon size={20} />
                  {activeSectionData.title}
                </h3>
                <div className="chart-actions">
                  <button className="analytics-btn secondary">
                    <Download size={16} />
                    Esporta
                  </button>
                </div>
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
  // MAIN RENDER
  // =========================
  if (loading) {
    return (
      <div className="analytics-page">
        {renderLoadingState()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        {renderErrorState()}
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header principale */}
      <div className="analytics-navigation">
        <div className="analytics-header">
          <h1>
            <BarChart3 />
            Analytics Avanzate
          </h1>
          <p className="subtitle">
            Analisi approfondite per preparatori atletici professionisti
          </p>
        </div>

        {/* Filtri globali */}
        <div className="analytics-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Periodo</label>
              <select 
                className="filter-control"
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
              >
                <option value="7d">Ultimi 7 giorni</option>
                <option value="14d">Ultimi 14 giorni</option>
                <option value="30d">Ultimi 30 giorni</option>
                <option value="90d">Ultimi 90 giorni</option>
                <option value="all">Tutto il periodo</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Tipo Sessione</label>
              <select 
                className="filter-control"
                value={sessionType}
                onChange={(e) => handleSessionTypeChange(e.target.value)}
              >
                <option value="all">Tutte le sessioni</option>
                <option value="training">Allenamento</option>
                <option value="match">Partita</option>
                <option value="recovery">Recupero</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Visualizzazione</label>
              <select 
                className="filter-control"
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value)}
              >
                <option value="charts">Grafici</option>
                <option value="table">Tabella</option>
                <option value="compact">Compatta</option>
              </select>
            </div>

            <div className="filter-group">
              <div className="quick-actions">
                <button 
                  className="analytics-btn secondary"
                  onClick={handleRefreshData}
                >
                  <RefreshCw size={16} />
                  Aggiorna
                </button>
                <button 
                  className="analytics-btn primary"
                  onClick={handleExportData}
                >
                  <Download size={16} />
                  Esporta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigazione */}
        <div className="analytics-tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`tab-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => handleSectionChange(section.id)}
            >
              <section.icon size={16} />
              {section.title}
              <span className="badge">{section.charts.length}</span>
            </button>
          ))}
        </div>

        {/* Contenuto sezione */}
        <div className="analytics-content">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdvanced;
