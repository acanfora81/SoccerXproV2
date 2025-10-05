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
  Filter
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '@/utils/http';
import { useFilters, buildPerformanceQuery } from '@/modules/filters/index.js';
import { FiltersBar } from '@/modules/filters/index.js';
import { formatItalianNumber } from '@/utils/italianNumbers';

const DossierDrawer = ({ 
  playerId, 
  onClose
}) => {
  const { filters } = useFilters();
  
  const [player, setPlayer] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('panoramica');

  console.log('🟢 DossierDrawer: apertura drawer per giocatore', playerId); // INFO - rimuovere in produzione

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

  // === Fetch dossier con stessi parametri usati altrove ===
  useEffect(() => {
    if (!playerId) return;

    const fetchPlayerDossier = async () => {
      try {
        // 🔧 FIX: Distingui tra primo caricamento e refresh filtri
        if (player === null) {
          setInitialLoading(true);
          console.log('🔵 DossierDrawer: primo caricamento dossier', playerId); // INFO DEV - rimuovere in produzione
        } else {
          setIsRefreshing(true);
          console.log('🔵 DossierDrawer: refresh dossier per cambio filtri', playerId); // INFO DEV - rimuovere in produzione
        }
        setError(null);

        const params = buildPerformanceQuery(filters);

        // Log per debug (solo in dev)
        if (import.meta.env.DEV) {
          console.debug('[Dossier] fetch', { 
            playerId, 
            filters,
            sessionType: filters.sessionType,
            sessionName: filters.sessionName,
            normalize: filters.normalize,
            sortBy: filters.sortBy,
            url: `/api/performance/player/${playerId}/dossier?${params}`
          });
        }

        const response = await apiFetch(`/api/performance/player/${playerId}/dossier?${params}`);
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setPlayer(data);
        console.log('🟢 DossierDrawer: dossier aggiornato con successo'); // INFO - rimuovere in produzione
      } catch (err) {
        console.log('🔴 DossierDrawer: errore caricamento dossier', err.message); // ERROR - mantenere essenziali
        
        // Gestione specifica per errori 500 (dati mancanti nel database)
        if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          setError('NO_DATA'); // Flag speciale per dati mancanti
        } else {
          setError(err.message);
        }
      } finally {
        // 🔧 FIX: Reset del loading state appropriato
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchPlayerDossier();
  }, [playerId, filters.period, filters.sessionType, filters.sessionName, filters.roles, filters.startDate, filters.endDate, filters.normalize, filters.sortBy]);

  // 🔧 FIX: Mostra skeleton solo al primo caricamento
  if (initialLoading) {
    console.log('🔵 DossierDrawer: rendering skeleton primo caricamento'); // INFO DEV - rimuovere in produzione
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Drawer */}
        <div className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0f1424] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
              </div>
            </div>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        {/* Drawer */}
        <div className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0f1424] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {error === 'NO_DATA' ? 'Dati Non Disponibili' : 'Errore'}
            </h3>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {error === 'NO_DATA' ? (
                <>
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nessun Dato Disponibile
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Non ci sono ancora dati di performance per questo giocatore nel database.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    I dati appariranno qui una volta che il giocatore avrà completato delle sessioni di allenamento.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">⚠️</div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Errore di Connessione
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <button 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      setError(null);
                      setPlayer(null);
                      // Il useEffect si riattiverà automaticamente
                    }}
                  >
                    Riprova
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0f1424] shadow-xl">
        {/* 🔧 Indicatore refresh discreto */}
        {isRefreshing && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Aggiornamento...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
              {player.player.avatar ? (
                <img src={player.player.avatar} alt={player.player.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{player.player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{player.player.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{player.player.role} #{player.player.number}</p>
            </div>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 🔵 FilterBar unificata */}
        <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
          <FiltersBar 
            showSort={true}
            mode="compact"
          />
        </div>
        
        {/* KPI Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Zap size={14} /> PL/min
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number.isFinite(Number(player.summary?.plPerMin)) ? safeDec(player.summary.plPerMin, 2) : 'N/A'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(safePct(player.summary.trend?.plPerMin))}
                {safePct(player.summary.trend?.plPerMin) !== null && (
                  <span className="text-xs text-gray-500">
                    {Math.abs(safePct(player.summary.trend?.plPerMin))}%
                  </span>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Activity size={14} /> HSR
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number.isFinite(Number(player.summary?.hsrTot)) ? `${safeInt(player.summary.hsrTot)} m` : 'N/A'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(safePct(player.summary.trend?.hsrTot))}
                {safePct(player.summary.trend?.hsrTot) !== null && (
                  <span className="text-xs text-gray-500">
                    {Math.abs(safePct(player.summary.trend?.hsrTot))}%
                  </span>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <ArrowUpRight size={14} /> Sprint/90
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number.isFinite(Number(player.summary?.sprintPer90)) ? safeDec(player.summary.sprintPer90, 2) : 'N/A'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(safePct(player.summary.trend?.sprintPer90))}
                {safePct(player.summary.trend?.sprintPer90) !== null && (
                  <span className="text-xs text-gray-500">
                    {Math.abs(safePct(player.summary.trend?.sprintPer90))}%
                  </span>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Target size={14} /> Vel. max
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number.isFinite(Number(player.summary?.topSpeedMax)) ? `${safeDec(player.summary.topSpeedMax, 2)} km/h` : 'N/A'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(safePct(player.summary.trend?.topSpeedMax))}
                {safePct(player.summary.trend?.topSpeedMax) !== null && (
                  <span className="text-xs text-gray-500">
                    {Math.abs(safePct(player.summary.trend?.topSpeedMax))}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'panoramica' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('panoramica')}
          >
            <Gauge size={16} /> Panoramica
          </button>
          <button 
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'sessioni' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('sessioni')}
          >
            <Calendar size={16} /> Sessioni
          </button>
          <button 
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'intensita' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('intensita')}
          >
            <Activity size={16} /> Intensità
          </button>
          <button 
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'cardio' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('cardio')}
          >
            <Heart size={16} /> Cardio
          </button>
          <button 
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'accdec' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('accdec')}
          >
            <ArrowUpRight size={16} /> Acc/Dec
          </button>
        </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'panoramica' && (
          <div className="tab-content">
            <h4>Panoramica 30 giorni</h4>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-label">Distanza totale</span>
                <span className="stat-value">{safeInt(player.summary.distTot)} m</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Minuti totali</span>
                <span className="stat-value">{safeInt(player.summary.minutesTot)}'</span>
              </div>
              {Number(player.summary?.stepsTot) > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Passi totali</span>
                  <span className="stat-value">{safeInt(player.summary.stepsTot)}</span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">ACWR (media settimanale)</span>
                <span className="stat-value">{safeDec(player.summary.acwr, 2)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessioni' && (
          <div className="tab-content">
            <h4>Sessioni recenti</h4>
            <div className="sessions-list">
              {player.breakdown?.bySession?.map((session, index) => (
                <div key={index} className="session-item">
                  <div className="session-date">{session.date}</div>
                  <div className="session-type">{session.type}</div>
                  <div className="session-duration">{session.minutes}'</div>
                  <div className="session-load">{safeDec(session.PL, 1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'intensita' && (
          <div className="tab-content">
            <h4>Zone di intensità</h4>
            <div className="intensity-breakdown">
              <div className="intensity-item">
                <span className="zone-label">Zona 15-20 km/h</span>
                <span className="zone-value">{safeInt(player.intensity?.zone15_20)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 20-25 km/h</span>
                <span className="zone-value">{safeInt(player.intensity?.zone20_25)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">Zona 25+ km/h</span>
                <span className="zone-value">{safeInt(player.intensity?.zone25plus)} m</span>
              </div>
              <div className="intensity-item">
                <span className="zone-label">HSR Totale</span>
                <span className="zone-value">{safeInt(player.intensity?.hsrTot)} m</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cardio' && (
          <div className="tab-content">
            <h4>Metriche cardiovascolari</h4>
            <div className="cardio-stats">
              <div className="cardio-item">
                <span className="cardio-label">Freq. cardiaca media</span>
                <span className="cardio-value">{safeInt(player.cardio?.avgHR)} bpm</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">Freq. cardiaca max</span>
                <span className="cardio-value">{safeInt(player.cardio?.maxHR)} bpm</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE medio</span>
                <span className="cardio-value">{safeDec(player.cardio?.rpeAvg, 1)}</span>
              </div>
              <div className="cardio-item">
                <span className="cardio-label">RPE sessione</span>
                <span className="cardio-value">{safeInt(player.cardio?.rpeSession)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accdec' && (
          <div className="tab-content">
            <h4>Accelerazioni e decelerazioni</h4>
            <div className="accdec-stats">
              <div className="accdec-item">
                <span className="accdec-label">Accelerazioni</span>
                <span className="accdec-value">{safeInt(player.accDec?.acc)}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Decelerazioni</span>
                <span className="accdec-value">{safeInt(player.accDec?.dec)}</span>
              </div>
              <div className="accdec-item">
                <span className="accdec-label">Impatto stimato</span>
                <span className="accdec-value">{safeInt(player.accDec?.impact)}</span>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 dark:border-white/10 flex gap-3">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Chiudi
          </button>
          <Link
            to={`/performance/dossier/${playerId}?${buildPerformanceQuery(filters)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apri in pagina
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DossierDrawer;
