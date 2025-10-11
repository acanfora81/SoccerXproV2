// Percorso: client_v3/src/features/performance/pages/AnalyticsAdvanced.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, Users, Download, User, AlertCircle } from "lucide-react";
import { FiltersBar, useFilters, buildPerformanceQuery } from "@/modules/filters";
import { apiFetch } from "@/utils/apiClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportModal from "@/components/common/ExportModal";
import PageLoading from "@/design-system/ds/PageLoading";

// Sezioni già presenti in client_v3 (Tailwind)
import Accelerazioni from "@/features/performance/components/sections/Accelerazioni";
import Comparazioni from "@/features/performance/components/sections/Comparazioni";
import Energetico from "@/features/performance/components/sections/Energetico";
import ReportCoach from "@/features/performance/components/sections/ReportCoach";
import RischioRecupero from "@/features/performance/components/sections/RischioRecupero";

const SECTIONS = [
  { id: "rischio-recupero", title: "Rischio & Recupero", component: RischioRecupero },
  { id: "energetico", title: "Energetico", component: Energetico },
  { id: "accelerazioni", title: "Accelerazioni/Decelerazioni", component: Accelerazioni },
  { id: "comparazioni", title: "Comparazioni", component: Comparazioni },
  { id: "report-coach", title: "Report Coach", component: ReportCoach },
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

export default function AnalyticsAdvanced() {
  const { filters } = useFilters();

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [performanceData, setPerformanceData] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]?.id || "rischio-recupero");

  // View mode: team o player
  const [viewMode, setViewMode] = useState("team");
  const [selectedPlayer, setSelectedPlayer] = useState("");

  // Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  // Cache
  const [dataCache, setDataCache] = useState(new Map());
  // RAW sessions per Report Coach (necessari per trend per ruolo)
  const [rawSessions, setRawSessions] = useState([]);

  console.log("🟢 AnalyticsAdvanced: sezione", activeSection, "viewMode", viewMode);

  // ===========================
  // FETCH TEAM DATA
  // ===========================
  const fetchTeamData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!performanceData.length || forceRefresh) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        console.log("🔄 fetchTeamData - Caricamento dati team...");

        // 🚨 FIX: Rimuovi sortBy=acwr che interferisce con aggregazione
        const cleanFilters = { ...filters, sortBy: undefined };
        const query = buildPerformanceQuery(cleanFilters);

        // Carica dati performance aggregati
        const performanceResult = await apiFetch(`/performance?${query}`);
        const aggregatedDataFromAPI = performanceResult.data || [];
        console.log("✅ Dati performance team caricati:", aggregatedDataFromAPI.length, "record");
        
        // 🔍 DEBUG CHIRURGICO: Verifica PRIMO record aggregato dal backend
        if (aggregatedDataFromAPI.length > 0) {
          console.log("🔍 [BACKEND RAW] Primo record aggregato:", aggregatedDataFromAPI[0]);
          console.log("🔍 [BACKEND RAW] Chiavi disponibili:", Object.keys(aggregatedDataFromAPI[0]));
          console.log("🔍 [BACKEND RAW] Campi energetici:", {
            avgMetPower: aggregatedDataFromAPI[0].avgMetPower,
            distance20wkg: aggregatedDataFromAPI[0].distance20wkg,
            distance35wkg: aggregatedDataFromAPI[0].distance35wkg,
            maxPower5s: aggregatedDataFromAPI[0].maxPower5s,
            totalDistance: aggregatedDataFromAPI[0].totalDistance,
            totalMinutes: aggregatedDataFromAPI[0].totalMinutes,
            equivalentDistance: aggregatedDataFromAPI[0].equivalentDistance
          });
          console.log("🔍 [BACKEND RAW] Campi accelerazioni:", {
            totalAccOver3: aggregatedDataFromAPI[0].totalAccOver3,
            totalDecOver3: aggregatedDataFromAPI[0].totalDecOver3,
            totalDistanceAccOver2: aggregatedDataFromAPI[0].totalDistanceAccOver2,
            totalDistanceDecOver2: aggregatedDataFromAPI[0].totalDistanceDecOver2
          });
        }

        // Estrai dati ACWR se presenti in meta
        let combinedData = [...aggregatedDataFromAPI];
        if (performanceResult.meta && performanceResult.meta.acwrData) {
          const acwrDataFromAPI = performanceResult.meta.acwrData;
          console.log("✅ Dati ACWR estratti da meta:", acwrDataFromAPI.length, "record");
          combinedData.acwrData = acwrDataFromAPI;
        }

        setPerformanceData(combinedData);
      } catch (err) {
        console.error("❌ Errore caricamento dati team:", err);
        setError(`Errore caricamento dati team: ${err.message}`);
        setPerformanceData([]);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, performanceData.length]
  );

  // 🔎 Fetch RAW sessions solo per Report Coach (serve playerId e session_date)
  useEffect(() => {
    const fetchRawForReportCoach = async () => {
      try {
        if (activeSection !== 'report-coach') { setRawSessions([]); return; }
        const cleanFilters = { ...filters, sortBy: undefined };
        const qAgg = buildPerformanceQuery(cleanFilters);
        // forza no-aggregate per sessioni raw + aumenta limit
        let qRaw = qAgg
          .replace(/(&|^)aggregateExtended=true/g, '')
          .replace(/(&|^)aggregate=true/g, '')
          .replace(/^&/, '');
        // Aggiungi limit alto per avere TUTTE le sessioni del periodo
        qRaw += '&limit=10000';
        console.log('🔍 [CHIRURGICO] Query RAW per ReportCoach:', qRaw);
        const json = await apiFetch(`/performance?${qRaw}`);
        const rows = Array.isArray(json?.data) ? json.data : [];
        setRawSessions(rows);
        console.log('🟢 RAW sessions per ReportCoach:', rows.length, 'record');
        if (rows.length > 0) {
          const dates = rows.map(r => r.session_date || r.dateFull || r.date).filter(Boolean).sort();
          console.log('🔍 [CHIRURGICO] Date RAW fetched:', { prima: dates[0], ultima: dates[dates.length - 1], totale: dates.length });
        }
      } catch (e) {
        console.warn('🟡 Impossibile caricare RAW sessions per ReportCoach:', e?.message);
        setRawSessions([]);
      }
    };
    fetchRawForReportCoach();
  }, [activeSection, filters]);

  // ===========================
  // FETCH PLAYER DATA
  // ===========================
  const fetchPlayerData = useCallback(async () => {
    if (!selectedPlayer || selectedPlayer === "") return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 fetchPlayerData - Caricamento dati giocatore:", selectedPlayer);

      // 🚨 FIX: Rimuovi sortBy=acwr che interferisce con aggregazione
      const cleanFilters = { ...filters, sortBy: undefined };
      const query = buildPerformanceQuery(cleanFilters);
      const playerId = parseInt(selectedPlayer);

      const performanceResult = await apiFetch(`/performance?${query}&playerId=${playerId}`);
      const playerPerformanceData = performanceResult.data || [];
      console.log("✅ Dati performance giocatore caricati:", playerPerformanceData.length, "record");
      setPerformanceData(playerPerformanceData);
    } catch (err) {
      console.error("❌ Errore caricamento dati giocatore:", err);
      setError(`Errore caricamento dati giocatore: ${err.message}`);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer, filters]);

  // ===========================
  // FETCH DATA PRINCIPALE
  // ===========================
  const fetchData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!performanceData.length || forceRefresh) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        console.log("🔄 fetchData - Caricamento dati Analytics Avanzate...");

        // Cache key
        const cacheKey = [
          filters.period,
          filters.sessionType,
          filters.sessionName,
          (filters.roles || []).join("|"),
          (filters.players || []).join("|"),
          filters.startDate || "",
          filters.endDate || "",
          "aggregated",
        ].join("::");

        // Controllo cache
        const cached = dataCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log("✅ Dati dalla cache:", cached.data.length, "record");
          setPerformanceData(cached.data);
          setLoading(false);
          return;
        }

        // 🚨 FIX: Rimuovi sortBy=acwr che interferisce con aggregazione
        const cleanFilters = { ...filters, sortBy: undefined };
        const query = buildPerformanceQuery(cleanFilters);
        console.log("🔍 Query API performance:", query);

        const performanceResult = await apiFetch(`/performance?${query}`);
        console.log("🟢 Performance data aggregati caricati:", performanceResult.data?.length || 0, "date uniche");

        const aggregatedDataFromAPI = performanceResult.data || [];
        console.log("✅ Dati già aggregati dal backend:", aggregatedDataFromAPI.length, "giorni unici");

        // Debug primo record
        if (aggregatedDataFromAPI.length > 0) {
          console.log("🔍 Primo record aggregato:", aggregatedDataFromAPI[0]);
          console.log("🔍 Chiavi disponibili:", Object.keys(aggregatedDataFromAPI[0]));
          console.log("🔍 Ultimi 3 record:", aggregatedDataFromAPI.slice(-3));
          
          // 🚨 VERIFICA CAMPI CRITICI PER ENERGETICO
          console.log('🔍 [ENERGETICO] Verifica campi primo record:', {
            avg_metabolic_power_wkg: aggregatedDataFromAPI[0].avg_metabolic_power_wkg,
            distance_over_20wkg_m: aggregatedDataFromAPI[0].distance_over_20wkg_m,
            distance_over_35wkg_m: aggregatedDataFromAPI[0].distance_over_35wkg_m,
            max_power_5s_wkg: aggregatedDataFromAPI[0].max_power_5s_wkg,
            session_date: aggregatedDataFromAPI[0].session_date,
            duration_minutes: aggregatedDataFromAPI[0].duration_minutes,
          });
          
          // 🚨 VERIFICA CAMPI CRITICI PER ACCELERAZIONI
          console.log('🔍 [ACCELERAZIONI] Verifica campi primo record:', {
            num_acc_over_3_ms2: aggregatedDataFromAPI[0].num_acc_over_3_ms2,
            num_dec_over_minus3_ms2: aggregatedDataFromAPI[0].num_dec_over_minus3_ms2,
            distance_acc_over_2_ms2_m: aggregatedDataFromAPI[0].distance_acc_over_2_ms2_m,
            distance_dec_over_minus2_ms2_m: aggregatedDataFromAPI[0].distance_dec_over_minus2_ms2_m,
          });
          
          // 🚨 VERIFICA CAMPI CRITICI PER RISCHIO
          console.log('🔍 [RISCHIO] Verifica campi primo record:', {
            player_load: aggregatedDataFromAPI[0].player_load,
            playerId: aggregatedDataFromAPI[0].playerId,
          });
        }

        // Carica lista giocatori
        const playersResponseData = await apiFetch("/players");
        console.log("✅ Players data caricati:", playersResponseData.length, "giocatori");

        const playersData = playersResponseData.data || playersResponseData;

        setPerformanceData(aggregatedDataFromAPI);
        setPlayers(playersData);

        // Salva in cache
        setDataCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, {
            data: aggregatedDataFromAPI,
            timestamp: Date.now(),
          });
          return newCache;
        });
      } catch (e) {
        console.error("❌ Errore caricamento dati:", e);
        
        // 🚨 FIX: Gestione errori di connessione per evitare loop infiniti
        if (e.message.includes('Failed to fetch') || e.message.includes('ECONNREFUSED')) {
          setError('⚠️ Backend non raggiungibile. Assicurati che il server sia avviato su http://localhost:3001');
        } else {
          setError(`Errore caricamento dati: ${e.message}`);
        }
        
        // Non svuotare i dati se abbiamo già qualcosa
        if (performanceData.length === 0) {
          setPerformanceData([]);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters] // 🚨 FIX CRITICO: Rimuovi dataCache e performanceData.length dalle dipendenze per evitare loop
  );

  // Carica dati al mount e quando cambiano i filtri
  useEffect(() => {
    console.log("🔄 useEffect triggered - filtri cambiati");

    // 🚨 FIX: Non caricare se stiamo già caricando o se c'è un errore di connessione
    if (loading || isRefreshing) {
      console.log("⏸️ Caricamento già in corso, skip...");
      return;
    }

    if (error && error.includes('Backend non raggiungibile')) {
      console.log("⏸️ Backend non disponibile, skip retry automatico");
      return;
    }

    // Guard per period=custom senza date
    if (filters.period === "custom" && (!filters.startDate || !filters.endDate)) {
      if (performanceData.length > 0) {
        console.log("⏳ Periodo personalizzato, in attesa date...");
        return;
      }
      console.log("🔄 Caricamento iniziale con period=custom, procedo...");
    }
    console.log("🔄 Chiamando fetchData...");
    fetchData();
  }, [filters.period, filters.startDate, filters.endDate, filters.sessionType, filters.sessionName]);

  // Effect per cambio vista Squadra/Giocatore
  useEffect(() => {
    if (viewMode === "team") {
      fetchTeamData();
    } else if (viewMode === "player" && selectedPlayer && selectedPlayer !== "") {
      fetchPlayerData();
    }
  }, [viewMode, selectedPlayer, fetchTeamData, fetchPlayerData]);

  // Carica lista giocatori all'avvio
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await apiFetch("/players");
        const playersData = data.data || data;
        setPlayers(playersData);
      } catch (error) {
        console.error("❌ Errore caricamento giocatori:", error);
      }
    };

    loadPlayers();
  }, []);

  // ===========================
  // DATA PROCESSING
  // ===========================
  const filteredData = useMemo(() => {
    console.log("🔍 filteredData - Input:", {
      performanceDataLength: performanceData?.length || 0,
      isArray: Array.isArray(performanceData),
      firstItem: performanceData?.[0] || "N/A",
      viewMode,
      selectedPlayer,
    });

    if (!performanceData || !performanceData.length) {
      console.log("❌ Nessun dato performance disponibile");
      return [];
    }

    const firstRecord = performanceData[0];
    const isAggregated = firstRecord && firstRecord.dateFull;
    const isIndividualSessions = firstRecord && firstRecord.session_date;
    const isACWRData = firstRecord && firstRecord.date && firstRecord.acwr;

    console.log("🔍 Tipo dati rilevato:", {
      isAggregated,
      isIndividualSessions,
      isACWRData,
    });

    let processedData = [];

    if (isAggregated) {
      // Dati già aggregati per data
      console.log("✅ Dati già aggregati per data");

      processedData = performanceData.filter((day) => {
        if (!day.dateFull) {
          console.warn("⚠️ Giorno senza dateFull:", day);
          return false;
        }

        try {
          const date = new Date(day.dateFull);
          if (isNaN(date.getTime())) {
            console.warn("⚠️ Giorno con dateFull invalida:", day.dateFull);
            return false;
          }
          return true;
        } catch (error) {
          console.warn("⚠️ Errore validazione dateFull:", day.dateFull, error);
          return false;
        }
      });
    } else if (isIndividualSessions) {
      // Dati non aggregati (sessioni individuali)
      console.log("🔄 Dati non aggregati, aggrego per data...");

      const dateMap = new Map();

      performanceData.forEach((session) => {
        if (!session.session_date) {
          console.warn("⚠️ Sessione senza session_date:", session);
          return;
        }

        try {
          const sessionDate = new Date(session.session_date);
          if (isNaN(sessionDate.getTime())) {
            console.warn("⚠️ Sessione con session_date invalida:", session.session_date);
            return;
          }

          const dateKey = sessionDate.toISOString().split("T")[0];

          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, {
              dateFull: dateKey,
              sessions: [],
              totalDistance: 0,
              playerLoad: 0,
              sessionsCount: 0,
            });
          }

          const dayData = dateMap.get(dateKey);
          dayData.sessions.push(session);
          dayData.totalDistance += session.total_distance_m || 0;
          dayData.playerLoad += session.player_load || 0;
          dayData.sessionsCount += 1;
        } catch (error) {
          console.warn("⚠️ Errore processando sessione:", session, error);
        }
      });

      processedData = Array.from(dateMap.values()).sort((a, b) => new Date(a.dateFull) - new Date(b.dateFull));

      console.log(`✅ Dati aggregati per data: ${processedData.length} giorni da ${performanceData.length} sessioni`);
    } else if (isACWRData) {
      // Dati ACWR
      console.log("🔄 Dati ACWR rilevati, converto formato...");

      processedData = performanceData
        .filter((record) => {
          if (!record.date) {
            console.warn("⚠️ Record ACWR senza date:", record);
            return false;
          }

          try {
            const date = new Date(record.date);
            if (isNaN(date.getTime())) {
              console.warn("⚠️ Record ACWR con date invalida:", record.date);
              return false;
            }
            return true;
          } catch (error) {
            console.warn("⚠️ Errore validazione date ACWR:", record.date, error);
            return false;
          }
        })
        .map((record) => ({
          dateFull: record.date,
          date: record.date,
          playerId: record.playerId,
          acuteLoad: record.acuteLoad || 0,
          chronicLoad: record.chronicLoad || 0,
          acwr: record.acwr || 0,
          totalDistance: 0,
          playerLoad: record.acuteLoad || 0,
          sessionsCount: 1,
        }));

      console.log(`✅ Dati ACWR convertiti: ${processedData.length} record`);
    } else {
      console.warn("⚠️ Struttura dati non riconosciuta, primo record:", firstRecord);
      return [];
    }

    // Debug range date
    if (processedData.length > 0) {
      const validDates = processedData
        .map((day) => {
          try {
            const dateStr = day.dateFull || day.date;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            console.warn("⚠️ Data invalida per giorno:", day.dateFull || day.date, error);
            return null;
          }
        })
        .filter((date) => date !== null)
        .sort((a, b) => a - b);

      if (validDates.length > 0) {
        console.log("📅 Range date nei dati processati:", {
          prima: validDates[0].toISOString().slice(0, 10),
          ultima: validDates[validDates.length - 1].toISOString().slice(0, 10),
          totale: validDates.length,
        });
      }
    }

    console.log(`✅ Dati finali processati: ${processedData.length} giorni validi`);
    return processedData;
  }, [performanceData, viewMode, selectedPlayer]);

  // ===========================
  // EVENT HANDLERS
  // ===========================
  const handleExportData = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("Nessun dato da esportare. Applica prima i filtri desiderati.");
      return;
    }

    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    try {
      const exportData = filteredData;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const fileName = `analytics_${activeSection}_${timestamp}`;

      if (exportFormat === "excel") {
        // Nota: per Excel serve xlsx, qui facciamo CSV comunque
        const headers = Object.keys(exportData[0] || {});
        const csv = [headers.join(","), ...exportData.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.click();
      } else {
        const headers = Object.keys(exportData[0] || {});
        const csv = [headers.join(","), ...exportData.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.click();
      }
      setShowExportModal(false);
    } catch (e) {
      console.error("❌ Errore durante l'esportazione:", e);
      alert("Errore durante l'esportazione. Riprova.");
    }
  };

  // Rendering sezioni
  const renderSectionContent = () => {
    console.log("🔍 renderSectionContent - Props passati ai grafici:", {
      dataLength: filteredData?.length || 0,
      dataSample: filteredData?.[0] || "N/A",
      playersLength: players?.length || 0,
      activeSection,
      viewMode,
      selectedPlayer,
    });
    
    // 🚨 DEBUG DETTAGLIATO
    console.log('🔍 [DEBUG CHIRURGICO] performanceData RAW:', {
      length: performanceData?.length || 0,
      firstRecord: performanceData?.[0],
      hasSessionDate: !!performanceData?.[0]?.session_date,
      hasDateFull: !!performanceData?.[0]?.dateFull,
      hasPlayer: !!performanceData?.[0]?.player,
      hasPlayerId: !!performanceData?.[0]?.playerId,
    });
    
    console.log('🔍 [DEBUG CHIRURGICO] filteredData PROCESSED:', {
      length: filteredData?.length || 0,
      firstRecord: filteredData?.[0],
      last5Records: filteredData?.slice(-5),
    });

    // 🔧 FIX: Per RischioRecupero, usa dati ACWR dal backend se disponibili
    const sectionProps = {
      data: activeSection === 'rischio-recupero' && performanceData.acwrData 
        ? performanceData.acwrData 
        : (filteredData || []),
      rawData: activeSection === 'report-coach' ? rawSessions : undefined,
      players: players || [],
      filters,
      viewMode,
      selectedPlayer,
    };

    const ActiveComp = SECTIONS.find((s) => s.id === activeSection)?.component || null;
    return ActiveComp ? <ActiveComp {...sectionProps} /> : <div className="text-sm text-gray-600 dark:text-gray-300">Sezione non disponibile.</div>;
  };

  // ===========================
  // RENDER PRINCIPALE
  // ===========================
  if (loading) {
    return (
      <PageLoading
        title="Analytics Avanzate"
        description="Analisi approfondite delle performance del team"
        height="py-16"
        showText={true}
        text="Caricamento..."
      />
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">Errore Caricamento</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            fetchData(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Analytics Avanzate</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Analisi approfondite per preparatori atletici</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRefreshing && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <RefreshCw className="animate-spin" size={14} /> Aggiornamento…
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw size={16} /> Aggiorna
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download size={16} /> Esporta
          </button>
        </div>
      </div>

      {/* Tab Squadra/Giocatore */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value)}>
          <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg p-1">
            <TabsTrigger value="team" className="px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Squadra
            </TabsTrigger>
            <TabsTrigger value="player" className="px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Giocatore
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "player" && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424]">
            <User size={16} className="text-gray-600 dark:text-gray-300" />
            <select
              value={selectedPlayer || ""}
              onChange={(e) => {
                const newPlayerId = e.target.value;
                console.log("🔄 Cambio giocatore:", newPlayerId);
                setSelectedPlayer(newPlayerId);
              }}
              className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="">Seleziona giocatore</option>
              {players.map((player) => (
                <option key={player.id} value={player.id.toString()}>
                  {(player.lastName || "").toUpperCase()} {player.firstName || ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filtri unificati */}
      <div className="mb-3">
        <FiltersBar showSort={true} mode="compact" showPlayers={true} players={players} />
      </div>

      {/* Tabs sezioni */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {SECTIONS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              activeSection === s.id ? "bg-blue-600 text-white shadow" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s.title}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-medium">{idx + 1}</span>
          </button>
        ))}
      </div>

      {/* Contenuto sezione attiva */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-3 md:p-4">{renderSectionContent()}</div>

      {/* Footer azioni */}
      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Users size={14} /> {players.length} giocatori
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{filteredData.length} record visualizzati</div>
      </div>

      {/* Modal Export */}
      <ExportModal show={showExportModal} exportFormat={exportFormat} setExportFormat={setExportFormat} onConfirm={handleExportConfirm} onCancel={() => setShowExportModal(false)} />
    </div>
  );
}


