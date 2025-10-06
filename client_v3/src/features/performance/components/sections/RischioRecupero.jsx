import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { Shield, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const RischioRecupero = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 RischioRecupero component - dati ricevuti:', data?.length || 0, 'records');

  // SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: RischioRecupero riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        <Shield size={48} className="mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Errore Dati</h3>
        <p className="text-sm">I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
      </div>
    );
  }

  // CALCOLO ACWR (Acute:Chronic Workload Ratio)
  const calculateACWR = (playerSessions, targetDate = null) => {
    if (!playerSessions || playerSessions.length === 0) return 0;
    
    let target;
    if (targetDate) {
      target = new Date(targetDate);
    } else {
      const dates = playerSessions.map(s => {
        const d = s.session_date;
        return d ? new Date(d) : null;
      }).filter(Boolean);
      target = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
    }
    
    const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
    const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const acuteSessions = playerSessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= acute7Days && sessionDate <= target;
    });
    
    const chronicSessions = playerSessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= chronic28Days && sessionDate <= target;
    });
    
    // 🔧 FIX: Supporta sia dati RAW (player_load) che AGGREGATI (playerLoad)
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || 0), 0);
    const chronicLoad = chronicSessions.reduce((sum, s) => sum + (s.playerLoad || s.player_load || 0), 0) / 4;
    
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  };

  // DATA PROCESSING
  const riskData = useMemo(() => {
    if (!data?.length) {
      console.log('⚠️ riskData: nessun dato disponibile');
      return [];
    }
    
    console.log('🟡 Processing risk/recovery data...');
    console.log('🔍 [DEBUG] Primo record data:', data[0]);
    console.log('🔍 [DEBUG] Players disponibili:', players?.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })));
    
    // 🔧 FIX: Controlla se i dati hanno già ACWR calcolato dal backend
    const hasPreCalculatedACWR = data[0] && 'acwr' in data[0] && 'acuteLoad' in data[0];
    
    if (hasPreCalculatedACWR) {
      console.log('✅ Usando dati ACWR pre-calcolati dal backend');
      
      // Usa direttamente i dati ACWR dal backend
      const result = data.map(record => {
        const player = players?.find(p => p.id === record.playerId);
        const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${record.playerId}`;
        
        const acwr = record.acwr || 0;
        let status = 'normal';
        let riskLevel = 'low';
        let color = '#10B981'; // verde
        
        if (acwr === 0) {
          status = 'no-data';
          riskLevel = 'unknown';
          color = '#9ca3af'; // grigio
        } else if (acwr < 0.8) {
          status = 'underload';
          riskLevel = 'low';
          color = '#F59E0B'; // arancione
        } else if (acwr > 1.3) {
          status = 'overload';
          riskLevel = 'high';
          color = '#EF4444'; // rosso
        } else if (acwr > 1.0) {
          status = 'high-load';
          riskLevel = 'medium';
          color = '#F59E0B'; // arancione
        }
        
        return {
          player: playerName,
          playerId: record.playerId,
          acwr: parseFloat(acwr.toFixed(2)),
          status,
          riskLevel,
          color,
          monotony: record.monotony || 0,
          strain: record.chronicLoad || 0,
          sessionsCount: record.sessionsCount || 0
        };
      }).sort((a, b) => b.acwr - a.acwr);
      
      console.log('✅ Risk/recovery data processed (pre-calculated):', result.length, 'players');
      return result;
    }
    
    // Calcola ACWR manualmente da sessioni individuali
    console.log('🔄 Calcolando ACWR manualmente da sessioni...');
    const playerMap = new Map();
    
    data.forEach((session, idx) => {
      // 🔧 FIX: Supporta diversi formati di playerId (come in Energetico)
      const playerId = session.playerId || session.player?.id || session.player_id;
      
      if (!playerId) {
        console.warn(`⚠️ Record ${idx} senza playerId:`, session);
        return;
      }
      
      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, []);
      }
      playerMap.get(playerId).push(session);
    });
    
    const result = Array.from(playerMap.entries()).map(([playerId, playerSessions]) => {
      const player = players?.find(p => p.id === playerId);
      const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`;
      
      const acwr = calculateACWR(playerSessions);
      
      let status = 'normal';
      let riskLevel = 'low';
      let color = '#10B981'; // verde
      
      if (acwr === 0) {
        status = 'no-data';
        riskLevel = 'unknown';
        color = '#9ca3af'; // grigio
      } else if (acwr < 0.8) {
        status = 'underload';
        riskLevel = 'low';
        color = '#F59E0B'; // arancione
      } else if (acwr > 1.3) {
        status = 'overload';
        riskLevel = 'high';
        color = '#EF4444'; // rosso
      } else if (acwr > 1.0) {
        status = 'high-load';
        riskLevel = 'medium';
        color = '#F59E0B'; // arancione
      }
      
      // Calcola monotonia
      const loads = playerSessions.map(s => s.player_load || 0).filter(l => l > 0);
      const meanLoad = loads.length > 0 ? loads.reduce((sum, l) => sum + l, 0) / loads.length : 0;
      const variance = loads.length > 0 ? loads.reduce((sum, l) => sum + Math.pow(l - meanLoad, 2), 0) / loads.length : 0;
      const monotony = variance > 0 ? meanLoad / Math.sqrt(variance) : 0;
      
      // Calcola strain
      const strain = playerSessions.reduce((sum, s) => sum + (s.player_load || 0), 0);
      
      return {
        player: playerName,
        playerId,
        acwr: parseFloat(acwr.toFixed(2)),
        status,
        riskLevel,
        color,
        monotony: parseFloat(monotony.toFixed(2)),
        strain: Math.round(strain),
        sessionsCount: playerSessions.length
      };
    }).sort((a, b) => b.acwr - a.acwr);
    
    console.log('✅ Risk/recovery data processed:', result.length, 'players');
    return result;
  }, [data, players]);

  // Trend temporale ACWR
  const acwrTrendData = useMemo(() => {
    if (!data?.length) return [];
    
    // 🔧 FIX: Se i dati hanno già ACWR, usali direttamente
    const hasPreCalculatedACWR = data[0] && 'acwr' in data[0] && 'date' in data[0];
    
    if (hasPreCalculatedACWR) {
      // Raggruppa per data e calcola media ACWR per data
      const dateMap = new Map();
      
      data.forEach(record => {
        const dateStr = record.date?.split('T')[0] || record.dateFull?.split('T')[0] || record.date;
        if (!dateStr) return;
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { acwrSum: 0, count: 0 });
        }
        const entry = dateMap.get(dateStr);
        entry.acwrSum += (record.acwr || 0);
        entry.count += 1;
      });
      
      return Array.from(dateMap.entries()).map(([dateStr, { acwrSum, count }]) => {
        const date = new Date(dateStr);
        return {
          date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          fullDate: dateStr,
          acwr: parseFloat((acwrSum / count).toFixed(2)),
          sessionsCount: count
        };
      }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }
    
    // Calcola manualmente da sessioni
    const dateMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.session_date?.split('T')[0] || session.session_date?.split(' ')[0];
      if (!dateStr) return;
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, []);
      }
      dateMap.get(dateStr).push(session);
    });
    
    return Array.from(dateMap.entries()).map(([dateStr, daySessions]) => {
      const avgACWR = daySessions.reduce((sum, s) => {
        const playerSessions = data.filter(d => d.playerId === s.playerId);
        return sum + calculateACWR(playerSessions, dateStr);
      }, 0) / daySessions.length;
      
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: dateStr,
        acwr: parseFloat(avgACWR.toFixed(2)),
        sessionsCount: daySessions.length
      };
    }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [data]);

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
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield size={24} className="text-pink-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rischio & Recupero</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Analisi di ACWR, monotonia, strain e readiness</p>
        </div>
      </div>

      {/* Layout a griglia 2x2 come le altre sezioni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico 1: ACWR per Giocatore */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">ACWR per Giocatore</h3>
            </div>
              <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(riskData, 'acwr_giocatore', players, filters)}
              >
            Esporta
              </button>
            </div>
        <div>
            {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="player" stroke="#999" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                <ReferenceLine y={0.8} stroke="#10B981" strokeDasharray="5 5" label="Min (0.8)" />
                <ReferenceLine y={1.3} stroke="#EF4444" strokeDasharray="5 5" label="Max (1.3)" />
                <Bar dataKey="acwr" name="ACWR">
                    {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Activity size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati ACWR per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Trend ACWR nel Tempo */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trend ACWR nel Tempo</h3>
            </div>
              <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(acwrTrendData, 'acwr_trend', players, filters)}
              >
            Esporta
              </button>
            </div>
        <div>
            {acwrTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={acwrTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                  dataKey="acwr" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                  name="ACWR Medio"
                  dot={{ r: 4 }}
                  />
                  <ReferenceLine y={0.8} stroke="#10B981" strokeDasharray="5 5" label="Min" />
                  <ReferenceLine y={1.3} stroke="#EF4444" strokeDasharray="5 5" label="Max" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di trend ACWR per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Monotonia del Carico */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monotonia del Carico per Giocatore</h3>
            </div>
              <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(riskData, 'monotonia_carico', players, filters)}
              >
            Esporta
              </button>
            </div>
        <div>
            {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="player" stroke="#999" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                <ReferenceLine y={2} stroke="#F59E0B" strokeDasharray="5 5" label="Soglia (2.0)" />
                <Bar dataKey="monotony" fill="#F59E0B" name="Monotonia" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <AlertTriangle size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di monotonia per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Strain vs ACWR */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1424] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-cyan-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Strain vs ACWR (Scatter)</h3>
            </div>
              <button 
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            onClick={() => handleExport(riskData, 'strain_vs_acwr', players, filters)}
              >
            Esporta
              </button>
            </div>
        <div>
            {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="strain" name="Strain" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis dataKey="acwr" name="ACWR" stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                <Scatter data={riskData} fill="#8B5CF6" name="Giocatori">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Shield size={48} className="mb-2" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di strain per il periodo selezionato</p>
              </div>
            )}
        </div>
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

export default RischioRecupero;
