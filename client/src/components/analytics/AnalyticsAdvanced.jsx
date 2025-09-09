import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageLoader from '../ui/PageLoader';
import * as XLSX from 'xlsx';
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
  User,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useFilters, buildPerformanceQuery, FiltersBar } from '../../modules/filters/index.js';
import { apiFetch } from '../../utils/http';
import '../../styles/analytics/index.css';
import '../../modules/filters/filters.css';

// Import dei componenti delle sezioni
import CaricoVolumi from './sections/CaricoVolumi';
import Intensita from './sections/Intensita';
import AltaVelocita from './sections/AltaVelocita';
import Accelerazioni from './sections/Accelerazioni';
import Energetico from './sections/Energetico';
import RischioRecupero from './sections/RischioRecupero';
import Comparazioni from './sections/Comparazioni';
import ReportCoach from './sections/ReportCoach';

// Import per le tab Squadra/Giocatore
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";


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
      icon: Shield,
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
      description: 'Confronti tra giocatori, ruoli e periodi',
      color: '#06B6D4',
      charts: [
        'Confronto giocatori per KPI',
        'Analisi per ruolo',
        'Trend temporali',
        'Benchmark squadra',
        'Confronto periodi'
      ]
    },
    {
      id: 'report-coach',
      title: 'Report Coach',
      icon: Users,
      description: 'Report personalizzati per preparatori',
      color: '#8B5CF6',
      charts: [
        'Report settimanale',
        'Report mensile',
        'Report per giocatore',
        'Report per ruolo',
        'Report personalizzato'
      ]
    }
];

// =========================
// FUNZIONI UTILITY
// =========================
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) return;
  
  // Crea un nuovo workbook
  const wb = XLSX.utils.book_new();
  
  // Converte i dati in worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Aggiunge il worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Dati');
  
  // Esporta il file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// =========================
// COMPONENTE PRINCIPALE
// =========================
const AnalyticsAdvanced = () => {
  const { filters } = useFilters();
  
  // =========================
  // STATE MANAGEMENT
  // =========================
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Dati
  const [performanceData, setPerformanceData] = useState([]);
  const [players, setPlayers] = useState([]);
  
  // UI State
  const [activeSection, setActiveSection] = useState('carico-volumi');
  
  // Tab Squadra/Giocatore
  const [viewMode, setViewMode] = useState("team"); // "team" | "player"
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [dashboardData, setDashboardData] = useState({});

  // State per comparazione (disattivata in questa pagina)
  
  // Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  console.log('🟢 AnalyticsAdvanced: sezione', activeSection, 'con filtri compatti'); // INFO - rimuovere in produzione

  // =========================
  // CACHE SYSTEM
  // =========================
  const [dataCache, setDataCache] = useState(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

  // =========================
  // DATA FETCHING
  // =========================
  
  // Funzione per caricare i dati del team
  const fetchTeamData = useCallback(async (forceRefresh = false) => {
    try {
      if (!performanceData.length || forceRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      console.log('🔄 fetchTeamData chiamato - Caricamento dati team...');
      
      const query = buildPerformanceQuery(filters);
      
      // Carica dati performance aggregati per i grafici
      const performanceResponse = await apiFetch(`/api/performance?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 🔧 FIX: Carica anche dati ACWR specifici per i grafici
      const acwrQuery = buildPerformanceQuery({ ...filters, acwrOnly: 'true' });
      const acwrResponse = await apiFetch(`/api/performance?${acwrQuery}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!performanceResponse.ok) {
        const errorText = await performanceResponse.text();
        throw new Error(`Errore caricamento performance: ${performanceResponse.status} - ${errorText}`);
      }

      const performanceResult = await performanceResponse.json();
      const aggregatedDataFromAPI = performanceResult.data || [];
      
      console.log('✅ Dati performance team caricati:', aggregatedDataFromAPI.length, 'record');
      
      // 🔧 FIX: Estrai dati ACWR dalla risposta meta
      let combinedData = [...aggregatedDataFromAPI];
      if (performanceResult.meta && performanceResult.meta.acwrData) {
        const acwrDataFromAPI = performanceResult.meta.acwrData;
        console.log('✅ Dati ACWR estratti da meta:', acwrDataFromAPI.length, 'record');
        combinedData.acwrData = acwrDataFromAPI;
      }
      
      setPerformanceData(combinedData);
      
      // Gestisci dati ACWR aggiuntivi se disponibili
      if (acwrResponse.ok) {
        const acwrResult = await acwrResponse.json();
        const acwrDataFromAPI = acwrResult.data || [];
        console.log('✅ Dati ACWR aggiuntivi caricati:', acwrDataFromAPI.length, 'record');
        
        // Combina con eventuali dati ACWR già presenti
        if (acwrDataFromAPI.length > 0) {
          combinedData.acwrData = [...(combinedData.acwrData || []), ...acwrDataFromAPI];
          setPerformanceData(combinedData);
        }
      }
      
      // Carica anche i dati dashboard per le card
      const dashboardResponse = await apiFetch(`/api/dashboard/stats/team?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult.data || {});
      }
      
    } catch (error) {
      console.error('Errore caricamento dati team:', error);
      setError(`Errore caricamento dati team: ${error.message}`);
      setPerformanceData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, performanceData.length]);

  // Funzione per caricare i dati del giocatore
  const fetchPlayerData = useCallback(async () => {
    if (!selectedPlayer || selectedPlayer === '') return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 fetchPlayerData chiamato - Caricamento dati giocatore:', selectedPlayer);
      
      const query = buildPerformanceQuery(filters);
      
      // Carica dati dashboard per le card
      const playerId = parseInt(selectedPlayer);
      console.log('🔍 Invio richiesta dashboard con playerId:', playerId, '(tipo:', typeof playerId, ')');
      const response = await apiFetch(`/api/dashboard/stats/player/${playerId}?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      setDashboardData(responseData.data || {});
      
      // Per i grafici, carica anche i dati performance aggregati del giocatore
      console.log('🔍 Invio richiesta performance con playerId:', playerId, '(tipo:', typeof playerId, ')');
      const performanceResponse = await apiFetch(`/api/performance?${query}&playerId=${playerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (performanceResponse.ok) {
        const performanceResult = await performanceResponse.json();
        const playerPerformanceData = performanceResult.data || [];
        console.log('✅ Dati performance giocatore caricati:', playerPerformanceData.length, 'record');
        setPerformanceData(playerPerformanceData);
      }
      
    } catch (error) {
      console.error('Errore caricamento dati giocatore:', error);
      setError(`Errore caricamento dati giocatore: ${error.message}`);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer, filters]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Mostra loading solo se non abbiamo dati o è un refresh forzato
      if (!performanceData.length || forceRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true); // Loading silenzioso per aggiornamenti
      }
      setError(null);
      
      console.log('🔄 fetchData chiamato - Caricamento dati Analytics Avanzate...');
      
      // 🔧 FIX: Cache key per evitare chiamate duplicate
      const cacheKey = [
        filters.period,
        filters.sessionType,
        filters.sessionName,
        (filters.roles || []).join('|'),
        (filters.players || []).join('|'),
        filters.startDate || '',
        filters.endDate || '',
        'aggregated' // 🔧 FIX: Aggiunto per cache con aggregazione
      ].join('::');
      
      // Controlla cache
      const cached = dataCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('✅ Dati dalla cache:', cached.data.length, 'record');
        setPerformanceData(cached.data);
        setLoading(false);
        return;
      }
      
      // 🔧 FIX: UNA SOLA chiamata API con aggregazione automatica
      console.log('🔄 Chiamata API performance con aggregazione automatica...');
      
      const query = buildPerformanceQuery(filters); // Ora include aggregate=true
      console.log('🔍 DEBUG - Query API performance:', query);
      
      const performanceResponse = await apiFetch(`/api/performance?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!performanceResponse.ok) {
        const errorText = await performanceResponse.text();
        console.error('🔴 Errore API performance:', performanceResponse.status, errorText);
        throw new Error(`Errore caricamento performance: ${performanceResponse.status} - ${errorText}`);
      }

      const performanceResult = await performanceResponse.json();
      console.log('🟢 Performance data aggregati caricati:', performanceResult.data?.length || 0, 'date uniche');
      
      // 🔧 FIX: I dati arrivano GIÀ AGGREGATI PER DATA dal backend
      const aggregatedDataFromAPI = performanceResult.data || [];
      console.log('✅ Dati già aggregati dal backend:', aggregatedDataFromAPI.length, 'giorni unici');
      
      // 🔍 DEBUG: Analisi struttura dati aggregati
      if (aggregatedDataFromAPI.length > 0) {
        console.log('🔍 DEBUG fetchData - Primo record aggregato:', aggregatedDataFromAPI[0]);
        console.log('🔍 DEBUG fetchData - Chiavi disponibili:', Object.keys(aggregatedDataFromAPI[0]));
        console.log('🔍 DEBUG fetchData - Campione valori:', {
          dateFull: aggregatedDataFromAPI[0]?.dateFull,
          totalDistance: aggregatedDataFromAPI[0]?.totalDistance,
          playerLoad: aggregatedDataFromAPI[0]?.playerLoad,
          sessions: aggregatedDataFromAPI[0]?.sessions?.length || 'N/A'
        });
      }
      
      // 🔧 VERIFICA: Controlla che i filtri date siano rispettati
      if (aggregatedDataFromAPI.length > 0) {
        const firstDay = aggregatedDataFromAPI[0];
        console.log('🔍 VERIFICA DATI AGGREGATI:', {
          startDate: filters.startDate,
          endDate: filters.endDate,
          period: filters.period,
          hasSingleDatePerEntry: firstDay?.dateFull ? true : false,
          hasAggregatedMetrics: firstDay?.totalDistance ? true : false,
          hasSessionCount: firstDay?.sessionsCount ? true : false,
          firstDayStructure: Object.keys(firstDay || {}).join(', ')
        });
      }
      console.log('🔍 DEBUG - Filtri applicati:', {
        period: filters.period,
        sessionType: filters.sessionType,
        sessionName: filters.sessionName,
        roles: filters.roles
      });
      console.log('🔍 DEBUG - Query inviata:', query);
      
      // Carica lista giocatori
      const playersResponse = await apiFetch('/api/players', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!playersResponse.ok) {
        throw new Error(`Errore API players: ${playersResponse.status}`);
      }
      
      const playersResponseData = await playersResponse.json();
      console.log('✅ Players data caricati:', playersResponseData.length, 'giocatori');
      
      // 🔧 FIX: Estrai i dati dalla response
      const playersData = playersResponseData.data || playersResponseData;
      
      setPerformanceData(aggregatedDataFromAPI);
      setPlayers(playersData);
      
      // 🔧 FIX: Verifica formato dati aggregati per debug
      console.log('🔍 Verifica formato dati aggregati:', {
        isArray: Array.isArray(aggregatedDataFromAPI),
        length: aggregatedDataFromAPI?.length,
        firstItem: aggregatedDataFromAPI?.[0],
        hasExpectedFields: aggregatedDataFromAPI?.[0]?.dateFull && aggregatedDataFromAPI?.[0]?.totalDistance,
        dataStructure: aggregatedDataFromAPI?.[0] ? Object.keys(aggregatedDataFromAPI[0]) : 'N/A'
      });
      
      // Salva in cache
      setDataCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          data: aggregatedDataFromAPI,
          timestamp: Date.now()
        });
        return newCache;
      });
      
    } catch (e) {
      console.error('❌ Errore caricamento dati:', e);
      setError(`Errore caricamento dati: ${e.message}`);
      // In caso di errore, assicurati che performanceData sia un array vuoto
      setPerformanceData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.players, filters.startDate, filters.endDate, performanceData.length, CACHE_DURATION, dataCache, filters]);

  // Carica dati al mount e quando cambiano i filtri
  useEffect(() => {
    console.log('🔄 useEffect triggered - filtri cambiati:', {
      period: filters.period,
      sessionType: filters.sessionType,
      sessionName: filters.sessionName,
      roles: filters.roles,
      players: filters.players
    });
    
    // 🔧 FIX: Guard intelligente - blocca solo se period='custom' senza date E non è il primo caricamento
    if (filters.period === 'custom' && (!filters.startDate || !filters.endDate)) {
      // Se abbiamo già dei dati, non bloccare (potrebbe essere un cambio di filtro)
      if (performanceData.length > 0) {
        console.log('⏳ Periodo personalizzato selezionato, in attesa delle date...');
        return; // aspetta che l'utente scelga le date
      }
      // Se non abbiamo dati, carica comunque per evitare pagina vuota
      console.log('🔄 Caricamento iniziale con period=custom, procedo comunque...');
    }
    console.log('🔄 Chiamando fetchData...');
    fetchData();
  }, [fetchData, filters.period, filters.startDate, filters.endDate, performanceData.length, filters.players, filters.roles, filters.sessionName, filters.sessionType]);

  // Effect per cambio vista Squadra/Giocatore
  useEffect(() => {
    if (viewMode === "team") {
      fetchTeamData();
    } else if (viewMode === "player" && selectedPlayer && selectedPlayer !== '') {
      fetchPlayerData();
    }
  }, [viewMode, selectedPlayer, fetchTeamData, fetchPlayerData]);

  // Carica lista giocatori all'avvio
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const response = await apiFetch('/api/players', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const playersData = data.data || data;
          setPlayers(playersData);
        }
      } catch (error) {
        console.error('Errore caricamento giocatori:', error);
      }
    };
    
    loadPlayers();
  }, []);

  // Debug effect per monitorare i cambiamenti dei dati
  useEffect(() => {
    console.log('🔍 DEBUG - performanceData changed:', {
      length: performanceData?.length || 0,
      isArray: Array.isArray(performanceData),
      firstItem: performanceData?.[0] || 'N/A',
      timestamp: new Date().toISOString()
    });
  }, [performanceData]);

  // =========================
  // DATA PROCESSING
  // =========================
  const filteredData = useMemo(() => {
    console.log('🔍 DEBUG filteredData - Input:', { 
      performanceDataLength: performanceData?.length || 0, 
      performanceDataType: typeof performanceData, 
      isArray: Array.isArray(performanceData), 
      firstItem: performanceData?.[0] || 'N/A',
      viewMode,
      selectedPlayer,
      dashboardDataKeys: Object.keys(dashboardData || {})
    }); // TEMP DEBUG - rimuovere dopo diagnosi
    console.log('🔄 Ricalcolo filtri - period:', filters.period, 'sessionType:', filters.sessionType);
    
    // 🔧 FIX: Usa dati diversi in base alla modalità
    let sourceData;
    if (viewMode === "player" && selectedPlayer) {
      // In modalità player, usa i dati del giocatore selezionato
      sourceData = performanceData; // I dati del giocatore sono già in performanceData
      console.log('🎯 Modalità PLAYER - usando dati giocatore:', selectedPlayer);
    } else {
      // In modalità team, usa i dati del team
      sourceData = performanceData;
      console.log('👥 Modalità TEAM - usando dati squadra');
    }
    
    if (!sourceData || !sourceData.length) {
      console.log('❌ Nessun dato performance disponibile');
      return [];
    }
    
    // 🔧 FIX: Gestione intelligente dati aggregati vs non aggregati
    const firstRecord = performanceData[0];
    const isAggregated = firstRecord && firstRecord.dateFull;
    const isIndividualSessions = firstRecord && firstRecord.session_date;
    const isACWRData = firstRecord && firstRecord.date && firstRecord.acwr; // Nuovo caso per dati ACWR
    
    console.log('🔍 Tipo dati rilevato:', {
      isAggregated,
      isIndividualSessions,
      isACWRData,
      hasDateFull: !!firstRecord?.dateFull,
      hasSessionDate: !!firstRecord?.session_date,
      hasDateAndACWR: !!(firstRecord?.date && firstRecord?.acwr)
    });
    
    let processedData = [];
    
    if (isAggregated) {
      // 🔧 CASO 1: Dati già aggregati per data (con dateFull)
      console.log('✅ Dati già aggregati per data, uso direttamente');
      
      processedData = performanceData.filter(day => {
        if (!day.dateFull) {
          console.warn('⚠️ Giorno senza dateFull:', day);
          return false;
        }
        
        try {
          const date = new Date(day.dateFull);
          if (isNaN(date.getTime())) {
            console.warn('⚠️ Giorno con dateFull invalida:', day.dateFull);
            return false;
          }
          return true;
        } catch (error) {
          console.warn('⚠️ Errore validazione dateFull:', day.dateFull, error);
          return false;
        }
      });
      
    } else if (isIndividualSessions) {
      // 🔧 CASO 2: Dati non aggregati (sessioni individuali con session_date)
      console.log('🔄 Dati non aggregati, aggrego per data...');
      
      // Raggruppa per data
      const dateMap = new Map();
      
      performanceData.forEach(session => {
        if (!session.session_date) {
          console.warn('⚠️ Sessione senza session_date:', session);
          return;
        }
        
        try {
          const sessionDate = new Date(session.session_date);
          if (isNaN(sessionDate.getTime())) {
            console.warn('⚠️ Sessione con session_date invalida:', session.session_date);
            return;
          }
          
          const dateKey = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, {
              dateFull: dateKey,
              sessions: [],
              totalDistance: 0,
              playerLoad: 0,
              sessionsCount: 0
            });
          }
          
          const dayData = dateMap.get(dateKey);
          dayData.sessions.push(session);
          dayData.totalDistance += (session.total_distance_m || 0);
          dayData.playerLoad += (session.player_load || 0);
          dayData.sessionsCount += 1;
          
        } catch (error) {
          console.warn('⚠️ Errore processando sessione:', session, error);
        }
      });
      
      // Converti Map in array e ordina per data
      processedData = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.dateFull) - new Date(b.dateFull));
      
      console.log(`✅ Dati aggregati per data: ${processedData.length} giorni da ${performanceData.length} sessioni`);
      
    } else if (isACWRData) {
      // 🔧 CASO 3: Dati ACWR (con date e acwr)
      console.log('🔄 Dati ACWR rilevati, converto formato...');
      
      processedData = performanceData.filter(record => {
        if (!record.date) {
          console.warn('⚠️ Record ACWR senza date:', record);
          return false;
        }
        
        try {
          const date = new Date(record.date);
          if (isNaN(date.getTime())) {
            console.warn('⚠️ Record ACWR con date invalida:', record.date);
            return false;
          }
          return true;
        } catch (error) {
          console.warn('⚠️ Errore validazione date ACWR:', record.date, error);
          return false;
        }
      }).map(record => ({
        // Converte i dati ACWR al formato atteso dai grafici
        dateFull: record.date,
        date: record.date,
        playerId: record.playerId,
        acuteLoad: record.acuteLoad || 0,
        chronicLoad: record.chronicLoad || 0,
        acwr: record.acwr || 0,
        // Aggiungi campi di default per compatibilità con i grafici
        totalDistance: 0,
        playerLoad: record.acuteLoad || 0, // Usa acuteLoad come playerLoad
        sessionsCount: 1
      }));
      
      console.log(`✅ Dati ACWR convertiti: ${processedData.length} record`);
      
    } else {
      console.warn('⚠️ Struttura dati non riconosciuta, primo record:', firstRecord);
      return [];
    }
    
    // 🔧 FIX: Debug range date con gestione sicura
    if (processedData.length > 0) {
      const validDates = processedData
        .map(day => {
          try {
            // Usa dateFull se disponibile, altrimenti date
            const dateStr = day.dateFull || day.date;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            console.warn('⚠️ Data invalida per giorno:', day.dateFull || day.date, error);
            return null;
          }
        })
        .filter(date => date !== null)
        .sort((a, b) => a - b);
      
      if (validDates.length > 0) {
        console.log('📅 Range date nei dati processati:', {
          prima: validDates[0].toISOString().slice(0, 10),
          ultima: validDates[validDates.length - 1].toISOString().slice(0, 10),
          totale: validDates.length,
          totali: processedData.length
        });
      } else {
        console.warn('⚠️ Nessuna data valida trovata nei dati processati');
      }
    }
    
    console.log(`✅ Dati finali processati: ${processedData.length} giorni validi`);
    return processedData;
  }, [performanceData, filters.period, filters.sessionType, viewMode, selectedPlayer]);

  // =========================
  // EVENT HANDLERS
  // =========================
  const handleExportData = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Nessun dato da esportare. Applica prima i filtri desiderati.');
      return;
    }

    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    try {
      const exportData = filteredData;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `analytics_${activeSection}_${timestamp}`;
      if (exportFormat === 'excel') {
        exportToExcel(exportData, fileName);
      } else {
        exportToCSV(exportData, fileName);
      }
      setShowExportModal(false);
    } catch (e) {
      console.error('❌ Errore durante l\'esportazione:', e);
      alert('Errore durante l\'esportazione. Riprova.');
    }
  };
  // Funzione di rendering delle sezioni
  function renderSectionContent() {
    console.log('🔍 DEBUG renderSectionContent - Props passati ai grafici:', {
      dataLength: filteredData?.length || 0,
      dataSample: filteredData?.[0] || 'N/A',
      playersLength: players?.length || 0,
      activeSection,
      viewMode,
      selectedPlayer
    });
    
    const sectionProps = {
      data: filteredData || [], // Assicura che sia sempre un array
      players: players || [], // Assicura che sia sempre un array
      filters
    };

    switch (activeSection) {
      case 'carico-volumi':
        return <CaricoVolumi {...sectionProps} />;
      case 'intensita':
        return <Intensita {...sectionProps} />;
      case 'alta-velocita':
        return <AltaVelocita {...sectionProps} />;
      case 'accelerazioni':
        return <Accelerazioni {...sectionProps} />;
      case 'energetico':
        return <Energetico {...sectionProps} />;
      case 'rischio-recupero':
        return <RischioRecupero {...sectionProps} />;
      case 'comparazioni':
        return <Comparazioni {...sectionProps} />;
      case 'report-coach':
        return <ReportCoach {...sectionProps} />;
      default:
        return null;
    }
  }

  // =========================
  // MAIN RENDER
  // =========================
  if (loading) {
    return <PageLoader message="Caricamento Analytics Avanzate…" minHeight={360} />;
  }

  if (error) {
    return (
      <div className={`analytics-page density-${filters.density}`}>
        {renderErrorState()}
      </div>
    );
  }

  return (
    <div className={`analytics-page density-${filters.density}`}>
      {/* Header principale - coerente con altre pagine Performance */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <BarChart3 size={24} />
            Analytics Avanzate
            {isRefreshing && (
              <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Aggiornamento...
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            Analisi approfondite per preparatori atletici professionisti
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            type="button"
            className="btn btn--primary"
            onClick={handleExportData}
          >
            <Download size={16} />
            Esporta Dati
          </button>
        </div>
      </div>

      {/* Tab Squadra/Giocatore */}
      <div className="flex items-center justify-between mb-4">
        <Tabs value={viewMode} onValueChange={(value) => {
          console.log('🔄 Cambio vista da', viewMode, 'a', value);
          setViewMode(value);
        }}>
          <TabsList>
            <TabsTrigger value="team">Squadra</TabsTrigger>
            <TabsTrigger value="player">Giocatore</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {viewMode === "player" && (
          <div className="filter-box">
            {/* Icona utente */}
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <select
              value={selectedPlayer || ''}
              onChange={(e) => {
                const newPlayerId = e.target.value;
                console.log('🔄 Cambio giocatore da', selectedPlayer, 'a', newPlayerId);
                setSelectedPlayer(newPlayerId);
                
                // 🔧 DEBUG: Verifica che il cambio di stato funzioni
                console.log('🔍 Stato selectedPlayer aggiornato a:', newPlayerId);
                console.log('🔍 Giocatori disponibili:', players.length);
                console.log('🔍 Giocatore selezionato:', players.find(p => p.id.toString() === newPlayerId));
              }}
              className="filter-select"
            >
              <option value="">Seleziona giocatore</option>
              {players.map(player => (
                <option key={player.id} value={player.id.toString()}>
                  {(player.lastName || '').toUpperCase()} {player.firstName || ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FilterBar unificata */}
      <div className="filters-container">
        <FiltersBar 
          showSort={true}
          players={players}
          showPlayers={true}
          mode="compact"
        />
      </div>

      {/* Tab navigazione */}
      <div className="analytics-tabs">
        {SECTIONS.map((section) => (
          <button
            type="button"
            key={section.id}
            className={`tab-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
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

      {/* Modal Export */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Esporta Dati</h3>
              <button 
                type="button"
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
                type="button"
                className="btn-secondary"
                onClick={() => setShowExportModal(false)}
              >
                Annulla
              </button>
              <button 
                type="button"
                className="btn-primary"
                onClick={handleExportConfirm}
              >
                Esporta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsAdvanced;
