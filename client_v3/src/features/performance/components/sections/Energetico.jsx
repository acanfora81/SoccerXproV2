import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, Zap, TrendingUp, Target } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const Energetico = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 Energetico component - dati ricevuti:', data?.length || 0, 'records');
  console.log('🔍 Primo record:', data?.[0]);

  // SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Energetico riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        <Activity size={48} className="mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Errore Dati</h3>
        <p className="text-sm">I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
      </div>
    );
  }

  // DATA PROCESSING - usa i nomi ESATTI dei campi del database
  const energeticData = useMemo(() => {
    if (!data?.length) {
      console.log('⚠️ Nessun dato disponibile per Energetico');
      return [];
    }
    
    console.log('🟡 Processing energetic data - totale record:', data.length);
    
    // Mappa i dati usando i nomi ESATTI dei campi dal database
    const result = data
      .map((session, idx) => {
        const dateStr = session.session_date || session.dateFull;
        if (!dateStr) {
          console.warn(`⚠️ Record ${idx} senza data valida`);
          return null;
        }
        
        const date = new Date(dateStr);
        
        // 🔧 FIX: Supporta sia dati RAW (sessioni) che AGGREGATI (per data)
        const isAggregated = 'avgMetPower' in session && 'distance20wkg' in session;
        
        const formatted = {
          date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          fullDate: dateStr,
          // Usa campi aggregati SE disponibili, altrimenti usa campi RAW
          avgMetPower: isAggregated ? (session.avgMetPower || 0) : (session.avg_metabolic_power_wkg || 0),
          distance20wkg: isAggregated ? (session.distance20wkg || 0) : (session.distance_over_20wkg_m || 0),
          distance35wkg: isAggregated ? (session.distance35wkg || 0) : (session.distance_over_35wkg_m || 0),
          maxPower5s: isAggregated ? (session.maxPower5s || 0) : (session.max_power_5s_wkg || 0),
          totalMinutes: isAggregated ? (session.totalMinutes || 0) : (session.duration_minutes || 0),
          // Calcoli derivati
          distance20wkgPerMin: (session.totalMinutes || session.duration_minutes) > 0 
            ? (isAggregated ? session.distance20wkg : session.distance_over_20wkg_m || 0) / (session.totalMinutes || session.duration_minutes) 
            : 0,
          distance35wkgPerMin: (session.totalMinutes || session.duration_minutes) > 0 
            ? (isAggregated ? session.distance35wkg : session.distance_over_35wkg_m || 0) / (session.totalMinutes || session.duration_minutes) 
            : 0,
          playerName: session.player ? `${session.player.firstName} ${session.player.lastName}` : 'N/A',
          sessionName: session.session_name || 'N/A'
        };
        
        // Debug primo record processato
        if (idx === 0) {
          console.log('🔍 Primo record processato:', formatted);
        }
        
        return formatted;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    
    console.log('✅ Energetic data processed:', result.length, 'data points');
    console.log('🔍 Range valori avgMetPower:', Math.min(...result.map(r => r.avgMetPower)), '-', Math.max(...result.map(r => r.avgMetPower)));
    console.log('🔍 Range valori distance20wkg:', Math.min(...result.map(r => r.distance20wkg)), '-', Math.max(...result.map(r => r.distance20wkg)));
    
    return result;
  }, [data]);

  // Dati aggregati per giocatore
  const playerEnergeticData = useMemo(() => {
    if (!data?.length || !players?.length) {
      console.log('⚠️ playerEnergeticData: dati mancanti', { dataLength: data?.length, playersLength: players?.length });
      return [];
    }
    
    console.log('🔍 [DEBUG] Primo record data:', data[0]);
    console.log('🔍 [DEBUG] Players disponibili:', players.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })));
    
    const playerMap = new Map();
    
    data.forEach((session, idx) => {
      // 🔧 FIX: Supporta diversi formati di playerId
      const playerId = session.playerId || session.player?.id || session.player_id;
      
      if (!playerId) {
        console.warn(`⚠️ Record ${idx} senza playerId:`, session);
        return;
      }
      
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`;
        
        console.log(`🔍 [DEBUG] Mappando giocatore ${playerId}:`, playerName);
        
        playerMap.set(playerId, {
          playerId,
          playerName,
          position: player?.position || 'Unknown',
          sessions: []
        });
      }
      
      playerMap.get(playerId).sessions.push(session);
    });
    
    const result = Array.from(playerMap.values()).map(player => {
      const avgMetPower = player.sessions.reduce((sum, s) => sum + (s.avg_metabolic_power_wkg || 0), 0) / player.sessions.length;
      const totalDistance20wkg = player.sessions.reduce((sum, s) => sum + (s.distance_over_20wkg_m || 0), 0);
      const totalDistance35wkg = player.sessions.reduce((sum, s) => sum + (s.distance_over_35wkg_m || 0), 0);
      const totalMinutes = player.sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      // 🔍 DEBUG: Log dei valori calcolati per il primo giocatore
      if (player.playerName === Array.from(playerMap.values())[0]?.playerName) {
        console.log(`🔍 [DEBUG] Calcoli per ${player.playerName}:`, {
          sessionsCount: player.sessions.length,
          avgMetPower: avgMetPower,
          totalDistance20wkg: totalDistance20wkg,
          totalDistance35wkg: totalDistance35wkg,
          totalMinutes: totalMinutes,
          sampleSession: player.sessions[0]
        });
      }
      
      return {
        player: player.playerName,
        position: player.position,
        avgMetPower: avgMetPower.toFixed(2),
        totalDistance20wkg: Math.round(totalDistance20wkg),
        totalDistance35wkg: Math.round(totalDistance35wkg),
        distance20wkgPerMin: totalMinutes > 0 ? (totalDistance20wkg / totalMinutes).toFixed(2) : 0,
        distance35wkgPerMin: totalMinutes > 0 ? (totalDistance35wkg / totalMinutes).toFixed(2) : 0,
        sessionsCount: player.sessions.length
      };
    }).sort((a, b) => parseFloat(b.avgMetPower) - parseFloat(a.avgMetPower));
    
    console.log('✅ Player energetic data processed:', result.length, 'players');
    return result;
  }, [data, players]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessionName && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              {payload[0].payload.sessionName} - {payload[0].payload.playerName}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Activity size={24} className="text-red-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Energetico & Metabolico</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Analisi di potenza metabolica, RVP e costi energetici</p>
        </div>
      </div>

      {/* Grafico 1: Potenza Metabolica per Sessione - FULL WIDTH */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Potenza Metabolica Media per Sessione</h3>
          </div>
          <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(energeticData, 'potenza_metabolica', players, filters)}
          >
            Esporta
          </button>
        </div>
        <div>
          {energeticData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={energeticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgMetPower" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Pot. Metabolica (W/kg)"
                  dot={{ r: 4 }}
                />
                <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="5 5" label="Soglia Alta" />
                <ReferenceLine y={35} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Elite" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Zap size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di potenza metabolica per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 2: Distanze in Zone di Potenza - FULL WIDTH */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Distanze in Zone di Potenza Metabolica</h3>
          </div>
          <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(energeticData, 'zone_potenza', players, filters)}
          >
            Esporta
          </button>
        </div>
        <div>
          {energeticData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={energeticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="distance20wkg" 
                  stackId="1" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  name=">20 W/kg (m)"
                />
                <Area 
                  type="monotone" 
                  dataKey="distance35wkg" 
                  stackId="1" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  name=">35 W/kg (m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di zone di potenza per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 3: RVP (Relative Velocity Power) - FULL WIDTH */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-purple-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">RVP - Distanza per Minuto nelle Zone di Potenza</h3>
          </div>
          <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(energeticData, 'rvp', players, filters)}
          >
            Esporta
          </button>
        </div>
        <div>
          {energeticData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={energeticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="distance20wkgPerMin" 
                  fill="#10B981"
                  name="RVP >20 W/kg (m/min)"
                />
                <Bar 
                  dataKey="distance35wkgPerMin" 
                  fill="#8B5CF6"
                  name="RVP >35 W/kg (m/min)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Activity size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati RVP per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 4: Max Power 5s - FULL WIDTH */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-cyan-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Potenza Massima 5 Secondi</h3>
          </div>
          <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(energeticData, 'max_power_5s', players, filters)}
          >
            Esporta
          </button>
        </div>
        <div>
          {energeticData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={energeticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="maxPower5s" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  name="Max Power 5s (W/kg)"
                  dot={{ r: 4 }}
                />
                <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Elite" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Target size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di max power per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 5: Costi Energetici per Giocatore - FULL WIDTH */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-red-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Costi Energetici per Giocatore</h3>
          </div>
          <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(playerEnergeticData, 'costi_energetici_giocatore', players, filters)}
          >
            Esporta
          </button>
        </div>
        <div>
          {playerEnergeticData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={playerEnergeticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="player" stroke="#999" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="avgMetPower" 
                  fill="#EF4444"
                  name="Avg Met Power (W/kg)"
                />
                <Bar 
                  dataKey="distance20wkgPerMin" 
                  fill="#F59E0B"
                  name=">20 W/kg (m/min)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Activity size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di costi energetici per giocatore per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>
    </div>
    
    <ExportModal
      show={showExportModal}
      exportFormat={exportFormat}
      setExportFormat={setExportFormat}
      onConfirm={handleExportConfirm}
      onCancel={handleExportCancel}
    />
  </>
  );
};

export default Energetico;
