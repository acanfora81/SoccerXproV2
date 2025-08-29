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
  EyeOff,
  GitCompare,
  User
} from 'lucide-react';
import '../../styles/analytics/index.css';

// Import dei componenti delle sezioni
import CaricoVolumi from './sections/CaricoVolumi';
import ComparePanel from './ComparePanel';
import PlayerDossier from './PlayerDossier';
// import Intensita from './sections/Intensita';
// import AltaVelocita from './sections/AltaVelocita';
// import Accelerazioni from './sections/Accelerazioni';
// import Energetico from './sections/Energetico';
// import RischioRecupero from './sections/RischioRecupero';
// import Comparazioni from './sections/Comparazioni';
// import ReportCoach from './sections/ReportCoach';

// =========================
// CONFIGURAZIONE SEZIONI (fuori dal componente per evitare ricreazione)
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

const AnalyticsAdvanced = () => {
  // =========================
  // STATE MANAGEMENT
  // =========================
  const [activeSection, setActiveSection] = useState('carico-volumi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtri globali
  const [timeRange, setTimeRange] = useState('all');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [sessionType, setSessionType] = useState('all');
  const [viewMode, setViewMode] = useState('charts'); // charts, table, compact
  
  // Dati
  const [players, setPlayers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [sessionsByPlayer, setSessionsByPlayer] = useState({});
  
  // Modalità di visualizzazione principale
  const [mainViewMode, setMainViewMode] = useState('analysis'); // 'analysis', 'dossier', 'compare'
  
  // Funzionalità confronto
  const [compareIds, setCompareIds] = useState([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  
  // Funzionalità dossier
  const [selectedPlayerForDossier, setSelectedPlayerForDossier] = useState(null);
  // const [showDossierPanel, setShowDossierPanel] = useState(false); // TODO: implementare

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

                 // Fetch performance data - CARICA TUTTI I DATI SENZA PAGINAZIONE
         console.log('🔄 Caricamento dati performance completi...');
         
         // Carica performance data senza limiti di paginazione
         console.log('🔄 Chiamata API con all=true...');
         const performanceResponse = await fetch('/api/performance?all=true', {
           credentials: 'include',
           headers: { 'Content-Type': 'application/json' }
         });
         
         if (!performanceResponse.ok) {
           throw new Error('Errore nel caricamento dati performance');
         }
         
         const performanceResult = await performanceResponse.json();
         const performanceList = performanceResult.data || performanceResult.sessions || [];
         
         console.log('📊 Dati performance caricati:', performanceList.length, 'sessioni');
         console.log('📊 Esempio prima sessione:', performanceList[0]);
         console.log('📊 Risposta API completa:', performanceResult);
         
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
    return SECTIONS.find(section => section.id === activeSection);
  }, [activeSection]);

     const filteredData = useMemo(() => {
     console.log('🔄 Ricalcolo filtri - timeRange:', timeRange, 'sessionType:', sessionType, 'selectedPlayers:', selectedPlayers.length);
     
     if (!performanceData.length) {
       console.log('❌ Nessun dato performance disponibile');
       return [];
     }
     
     // Debug: log dei valori unici di session_type presenti nei dati
     const uniqueSessionTypes = [...new Set(performanceData.map(s => s.session_type).filter(Boolean))];
     console.log('🔍 Session types nei dati:', uniqueSessionTypes);
     console.log('🔍 Filtro applicato:', sessionType);
     
     const timeRangeLower = (timeRange || '').toLowerCase();
     const daysBack = timeRangeLower === '7d' ? 7 : 
                     timeRangeLower === '14d' ? 14 : 
                     timeRangeLower === '30d' ? 30 : 
                     timeRangeLower === '90d' ? 90 : 
                     timeRangeLower === 'all' ? null : 365;
     
     const cutoffDate = daysBack == null ? null : new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
     console.log('🔍 Cutoff date:', cutoffDate);
     
     const filtered = performanceData.filter((session, index) => {
       const sessionDate = new Date(session.session_date);
       const matchesTimeRange = cutoffDate ? (sessionDate >= cutoffDate) : true;
       
       // Filtro session type: confronto esatto (case-sensitive)
       const matchesSessionType = sessionType === 'all' || session.session_type === sessionType;
       
       // Filtro giocatori
       const matchesPlayer = selectedPlayers.length === 0 || selectedPlayers.includes(session.playerId);
       
       // Filtro ruolo
       const player = players.find(p => p.id === session.playerId);
       const matchesPosition = selectedPosition === 'all' || player?.position === selectedPosition;
       
       // Debug per prime 3 sessioni
       if (index < 3) {
         console.log('🔍 Debug filtro sessione', index + 1, ':', {
           sessionId: session.id,
           sessionDate: session.session_date,
           sessionDateObj: sessionDate,
           cutoffDate: cutoffDate,
           matchesTimeRange,
           sessionType: session.session_type,
           selectedSessionType: sessionType,
           matchesSessionType,
           playerId: session.playerId,
           selectedPlayers,
           matchesPlayer,
           playerPosition: player?.position,
           selectedPosition,
           matchesPosition,
           allMatches: matchesTimeRange && matchesSessionType && matchesPlayer && matchesPosition
         });
       }
       
       // Debug per sessioni filtrate via data
       if (!matchesTimeRange && timeRange === 'all') {
         console.log('❌ Sessione filtrata via data (timeRange=all):', {
           sessionId: session.id,
           sessionDate: session.session_date,
           sessionDateObj: sessionDate,
           cutoffDate: cutoffDate
         });
       }
       
       return matchesTimeRange && matchesSessionType && matchesPlayer && matchesPosition;
     });
     
     // Debug: range date nei dati
     if (performanceData.length > 0) {
       const dates = performanceData.map(s => new Date(s.session_date)).sort((a, b) => a - b);
       console.log('📅 Range date nei dati:', {
         prima: dates[0].toISOString().slice(0, 10),
         ultima: dates[dates.length - 1].toISOString().slice(0, 10),
         totale: dates.length
       });
     }
     
     console.log('🔍 Dati filtrati:', filtered.length, 'su', performanceData.length, 'totali');
     console.log('🔍 Filtri applicati:', {
       timeRange,
       sessionType,
       selectedPlayers: selectedPlayers.length,
       selectedPosition
     });
     
           return filtered;
    }, [performanceData, timeRange, sessionType, selectedPlayers, selectedPosition, players]);

  // =========================
  // EVENT HANDLERS
  // =========================
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleTimeRangeChange = (newTimeRange) => {
    console.log('🔄 Cambio timeRange da', timeRange, 'a', newTimeRange);
    setTimeRange(newTimeRange);
  };

  const handlePlayerSelection = (playerId) => {
    console.log('🔄 Selezione giocatore:', playerId, 'attuali:', selectedPlayers);
    
    if (playerId === 'all') {
      setSelectedPlayers([]);
    } else {
      const numId = parseInt(playerId);
      // Sostituisci completamente la selezione (non aggiungi/rimuovi)
      setSelectedPlayers([numId]);
    }
  };

  const handlePositionChange = (position) => {
    console.log('🔄 Cambio ruolo da', selectedPosition, 'a', position);
    setSelectedPosition(position);
    // Reset selezione giocatore quando cambia ruolo
    setSelectedPlayers([]);
  };

  const handleSessionTypeChange = (newSessionType) => {
    console.log('🔄 Cambio sessionType da', sessionType, 'a', newSessionType);
    setSessionType(newSessionType);
  };

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExportData = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Nessun dato da esportare. Applica prima i filtri desiderati.');
      return;
    }

    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    try {
      // Prepara i dati per l'export
      const exportData = filteredData.map(session => {
        const player = players.find(p => p.id === session.playerId);
        return {
          'ID Sessione': session.id,
          'Giocatore': player ? `${player.firstName} ${player.lastName}` : 'N/A',
          'Ruolo': player?.position || 'N/A',
          'Data': new Date(session.session_date).toLocaleDateString('it-IT'),
          'Tipo Sessione': session.session_type,
          'Durata (min)': session.duration_minutes,
          'Distanza Totale (m)': session.total_distance_m,
          'Distanza Sprint (m)': session.sprint_distance_m,
          'Velocità Media (km/h)': session.average_speed_kmh,
          'Velocità Massima (km/h)': session.max_speed_kmh,
          'Accelerazioni': session.accelerations,
          'Decelerazioni': session.decelerations,
          'Carico': session.load,
          'Intensità': session.intensity
        };
      });

      // Nome file con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `analytics_${activeSection}_${timestamp}`;

      if (exportFormat === 'excel') {
        // Export Excel
        exportToExcel(exportData, fileName);
      } else {
        // Export CSV
        exportToCSV(exportData, fileName);
      }

      console.log(`✅ Esportati ${exportData.length} record in formato ${exportFormat === 'excel' ? 'Excel' : 'CSV'}`);
      setShowExportModal(false);
    } catch (error) {
      console.error('❌ Errore durante l\'esportazione:', error);
      alert('Errore durante l\'esportazione. Riprova.');
    }
  };

  // TODO: implementare funzione di refresh quando necessario
  // const handleRefreshData = () => {
  //   // Ricarica i dati dal server (non tutta la pagina)
  //   setLoading(true);
  //   setError(null);
  //   
  //   // Reset filtri
  //   setTimeRange('30d');
  //   setSessionType('all');
  //   setSelectedPlayers([]);
  //   setSelectedPosition('all');
  //   
  //   // Ricarica dati
  //   // fetchPerformanceData(); // TODO: implementare funzione di refresh
  // };

  // Funzioni helper per export
  const exportToCSV = (data, fileName) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  const exportToExcel = (data, fileName) => {
    try {
      // Importa la libreria xlsx dinamicamente
      import('xlsx').then((XLSX) => {
        // Crea un nuovo workbook
        const workbook = XLSX.utils.book_new();
        
        // Converti i dati in worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Imposta larghezza colonne automatica
        const columnWidths = [];
        const headers = Object.keys(data[0] || {});
        headers.forEach(header => {
          const maxLength = Math.max(
            header.length,
            ...data.map(row => String(row[header] || '').length)
          );
          columnWidths.push({ wch: Math.min(maxLength + 2, 50) });
        });
        worksheet['!cols'] = columnWidths;
        
        // Aggiungi stili per l'header (prima riga)
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;
          
          // Stile header: grassetto e sfondo grigio
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        // Aggiungi il worksheet al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Data');
        
        // Crea foglio informazioni sui filtri applicati
        const filterInfo = [
          ['REPORT ANALYTICS AVANZATE'],
          [''],
          ['Informazioni Export:'],
          ['Data Export:', new Date().toLocaleString('it-IT')],
          ['Sezione:', activeSectionData?.title || activeSection],
          [''],
          ['Filtri Applicati:'],
          ['Periodo:', timeRange === 'all' ? 'Tutti i giorni' : timeRange],
          ['Tipo Sessione:', sessionType === 'all' ? 'Tutte le sessioni' : sessionType],
          ['Ruolo:', selectedPosition === 'all' ? 'Tutti i ruoli' : selectedPosition],
          ['Giocatore:', selectedPlayers.length === 0 ? 'Tutti i giocatori' : 
            players.find(p => p.id === selectedPlayers[0])?.firstName + ' ' + 
            players.find(p => p.id === selectedPlayers[0])?.lastName || 'N/A'],
          [''],
          ['Statistiche:'],
          ['Record Esportati:', data.length],
          ['Periodo Dati:', data.length > 0 ? 
            `${new Date(data[0]['Data']).toLocaleDateString('it-IT')} - ${new Date(data[data.length-1]['Data']).toLocaleDateString('it-IT')}` : 'N/A']
        ];
        
        const infoWorksheet = XLSX.utils.aoa_to_sheet(filterInfo);
        infoWorksheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Info Filtri');
        
        // Genera il file Excel
        const excelBuffer = XLSX.write(workbook, { 
          bookType: 'xlsx', 
          type: 'array' 
        });
        
        // Crea blob e scarica
        const blob = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        link.click();
        
        console.log('✅ File Excel generato e scaricato:', `${fileName}.xlsx`);
      }).catch(error => {
        console.error('❌ Errore importazione libreria xlsx:', error);
        // Fallback: usa CSV
        exportToCSV(data, fileName);
        alert('Errore nella generazione Excel. File esportato in formato CSV.');
      });
    } catch (error) {
      console.error('❌ Errore generazione Excel:', error);
      // Fallback: usa CSV
      exportToCSV(data, fileName);
      alert('Errore nella generazione Excel. File esportato in formato CSV.');
    }
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
        className="btn btn--primary"
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
      sessionType,
      viewMode
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
            <div className="card chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <activeSectionData.icon size={20} />
                  {activeSectionData.title}
                </h3>
                <div className="chart-actions">
                  <button className="btn btn--ghost">
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
          <div className="filters-row">
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
                <option value="Allenamento">Allenamento</option>
                <option value="Partita">Partita</option>
                <option value="Recupero">Recupero</option>
                <option value="Tattica">Tattica</option>
                <option value="Forza">Forza</option>
                <option value="Rifinitura">Rifinitura</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Ruolo</label>
              <select 
                className="filter-control"
                value={selectedPosition}
                onChange={(e) => handlePositionChange(e.target.value)}
              >
                <option value="all">Tutti i ruoli</option>
                <option value="GOALKEEPER">Portieri</option>
                <option value="DEFENDER">Difensori</option>
                <option value="MIDFIELDER">Centrocampisti</option>
                <option value="FORWARD">Attaccanti</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Giocatore</label>
              <select 
                className="filter-control"
                value={selectedPlayers.length === 0 ? 'all' : selectedPlayers[0].toString()}
                onChange={(e) => handlePlayerSelection(e.target.value)}
              >
                <option value="all">Tutti i giocatori</option>
                                  {players
                    .filter(player => selectedPosition === 'all' || player.position === selectedPosition)
                    .sort((a, b) => {
                      // Prima ordina per ruolo (ordine: Portiere, Difensore, Centrocampista, Attaccante)
                      const roleOrder = {
                        'GOALKEEPER': 1,
                        'DEFENDER': 2,
                        'MIDFIELDER': 3,
                        'FORWARD': 4
                      };
                      const roleA = roleOrder[a.position] || 5;
                      const roleB = roleOrder[b.position] || 5;
                      
                      if (roleA !== roleB) {
                        return roleA - roleB;
                      }
                      
                      // A parità di ruolo, ordina per cognome alfabetico
                      return a.lastName.localeCompare(b.lastName, 'it');
                    })
                    .map(player => {
                      const positionLabels = {
                        'GOALKEEPER': 'Portiere',
                        'DEFENDER': 'Difensore',
                        'MIDFIELDER': 'Centrocampista',
                        'FORWARD': 'Attaccante'
                      };
                      const positionLabel = positionLabels[player.position] || player.position;
                      
                      // Formato: COGNOME Nome
                      const displayName = `${player.lastName.toUpperCase()} ${player.firstName.charAt(0).toUpperCase() + player.firstName.slice(1).toLowerCase()}`;
                      
                      return (
                        <option key={player.id} value={player.id}>
                          {displayName} ({positionLabel})
                        </option>
                      );
                    })}
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
                <div className="main-actions">
                  <button 
                    className={`action-btn ${mainViewMode === 'analysis' ? 'active' : ''}`}
                    onClick={() => setMainViewMode('analysis')}
                  >
                    <BarChart3 size={16} />
                    Analisi
                  </button>
                  <button 
                    className={`action-btn ${mainViewMode === 'dossier' ? 'active' : ''}`}
                    onClick={() => setMainViewMode('dossier')}
                  >
                    <User size={16} />
                    Dossier
                  </button>
                  <button 
                    className={`action-btn ${mainViewMode === 'compare' ? 'active' : ''}`}
                    onClick={() => setMainViewMode('compare')}
                  >
                    <GitCompare size={16} />
                    Confronta
                  </button>
                </div>
                <div className="export-action">
                  <button 
                    className="btn btn--primary"
                    onClick={handleExportData}
                  >
                    <Download size={16} />
                    Esporta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Contenuto principale basato sulla modalità */}
        {mainViewMode === 'analysis' && (
          <>
            {/* Tab navigazione */}
            <div className="analytics-tabs">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  className={`tab-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(section.id)}
                >
                  <section.icon size={16} />
                  {section.title}
                  <span className="badge">{SECTIONS.indexOf(section) + 1}</span>
                </button>
              ))}
            </div>

            {/* Contenuto sezione */}
            <div className="analytics-content">
              {renderSectionContent()}
            </div>
          </>
        )}

        {mainViewMode === 'dossier' && (
          <div className="dossier-view">
            {!selectedPlayerForDossier ? (
              <div className="player-selection-container">
                <h3>Seleziona un giocatore per visualizzare il dossier</h3>
                <div className="players-grid">
                  {players.map(player => {
                    const positionLabels = {
                      'GOALKEEPER': 'Portiere',
                      'DEFENDER': 'Difensore',
                      'MIDFIELDER': 'Centrocampista',
                      'FORWARD': 'Attaccante'
                    };
                    const positionLabel = positionLabels[player.position] || player.position;
                    
                    return (
                      <div 
                        key={player.id}
                        className="player-card"
                        onClick={() => setSelectedPlayerForDossier(player)}
                      >
                        <div className="player-info">
                          <div className="player-name">
                            {player.lastName.toUpperCase()} {player.firstName.charAt(0).toUpperCase() + player.firstName.slice(1).toLowerCase()}
                          </div>
                          <div className="player-position">{positionLabel}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="dossier-content">
                <div className="dossier-header">
                  <button 
                    className="btn btn--ghost back-btn"
                    onClick={() => setSelectedPlayerForDossier(null)}
                  >
                    ← Torna alla selezione
                  </button>
                  <h2>Dossier: {selectedPlayerForDossier.lastName.toUpperCase()} {selectedPlayerForDossier.firstName}</h2>
                </div>
                <PlayerDossier 
                  player={selectedPlayerForDossier}
                  performanceData={filteredData.filter(s => s.playerId === selectedPlayerForDossier.id)}
                  timeRange={timeRange}
                  sessionType={sessionType}
                />
              </div>
            )}
          </div>
        )}

        {mainViewMode === 'compare' && (
          <div className="compare-view">
            {!showComparePanel ? (
              <div className="player-selection-container">
                <h3>Seleziona 2-8 giocatori per il confronto</h3>
                <div className="players-grid">
                  {players.map(player => {
                    const positionLabels = {
                      'GOALKEEPER': 'Portiere',
                      'DEFENDER': 'Difensore',
                      'MIDFIELDER': 'Centrocampista',
                      'FORWARD': 'Attaccante'
                    };
                    const positionLabel = positionLabels[player.position] || player.position;
                    const isSelected = compareIds.includes(player.id);
                    
                    return (
                      <div 
                        key={player.id}
                        className={`player-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setCompareIds(compareIds.filter(id => id !== player.id));
                          } else if (compareIds.length < 8) {
                            setCompareIds([...compareIds, player.id]);
                          }
                        }}
                      >
                        <div className="player-info">
                          <div className="player-name">
                            {player.lastName.toUpperCase()} {player.firstName.charAt(0).toUpperCase() + player.firstName.slice(1).toLowerCase()}
                          </div>
                          <div className="player-position">{positionLabel}</div>
                        </div>
                        <div className="selection-indicator">
                          {isSelected ? '✓' : '+'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {compareIds.length >= 2 && (
                  <div className="compare-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => setShowComparePanel(true)}
                    >
                      Avvia Confronto ({compareIds.length} giocatori)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ComparePanel
                players={players.filter(p => compareIds.includes(p.id))}
                onClose={() => {
                  setShowComparePanel(false);
                  setCompareIds([]);
                  setMainViewMode('analysis');
                }}
                onBack={() => {
                  setShowComparePanel(false);
                }}
              />
            )}
          </div>
        )}
      </div>



      {/* Modal Export */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Esporta Dati</h3>
              <button 
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Scegli il formato di esportazione:</p>
              <div className="export-options">
                <label className="export-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <div className="option-content">
                    <div className="option-title">CSV (.csv)</div>
                    <div className="option-description">Formato semplice, compatibile con Excel</div>
                  </div>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <div className="option-content">
                    <div className="option-title">Excel (.xlsx)</div>
                    <div className="option-description">Formato nativo Excel con formattazione</div>
                  </div>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowExportModal(false)}
              >
                Annulla
              </button>
              <button 
                className="btn-primary"
                onClick={handleExportConfirm}
              >
                Esporta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ComparePanel - si apre quando si clicca Confronta */}
      {showComparePanel && (
        <ComparePanel
          players={players.filter(p => compareIds.includes(p.id))}
          onClose={() => {
            setShowComparePanel(false);
            setCompareIds([]);
          }}
          onBack={() => {
            setShowComparePanel(false);
            setCompareIds([]);
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsAdvanced;
