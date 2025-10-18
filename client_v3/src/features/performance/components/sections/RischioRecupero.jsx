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

const RischioRecupero = ({ data, players, filters, selectedPlayer, ...props }) => {
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

  // Helpers comuni per compatibilità formati
  const getSessionDate = (s) => {
    const raw = s?.session_date || s?.dateFull || s?.date;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  };

  const getLoad = (s) => {
    const val = s?.playerLoadTotal ?? s?.playerLoad ?? s?.player_load ?? s?.training_load ?? 0;
    const num = Number(val);
    return isFinite(num) ? num : 0;
  };

  // CALCOLO ACWR (Acute:Chronic Workload Ratio) - VERSIONE CON RANGE DATE
  const calculateACWR = (playerSessions, targetDate = null, filters = null) => {
    if (!playerSessions || playerSessions.length === 0) return 0;
    
    // Determina il range di date da utilizzare
    let startDate, endDate;
    
    if (filters && filters.startDate && filters.endDate) {
      // Usa il range dai filtri (es. "Tutti i dati luglio")
      startDate = new Date(filters.startDate);
      endDate = new Date(filters.endDate);
    } else if (targetDate) {
      // Usa data target specifica
      endDate = new Date(targetDate);
      startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000); // 28 giorni prima
    } else {
      // Fallback: usa l'ultima sessione disponibile
      const validDates = playerSessions
        .map(s => getSessionDate(s))
        .filter(d => d && !isNaN(d));
      if (validDates.length === 0) return 0;
      endDate = new Date(Math.max(...validDates.map(d => d.getTime())));
      startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);
    }
    
    // Filtra sessioni nel range di date
    const sessionsInRange = playerSessions.filter(session => {
      const sessionDate = getSessionDate(session);
      return !isNaN(sessionDate) && sessionDate >= startDate && sessionDate <= endDate;
    });
    
    if (sessionsInRange.length === 0) return 0;
    
    // Calcola ACWR per ogni giorno nel range (se range > 7 giorni)
    const daysInRange = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    const buildDailySeries = (from, to, sessions) => {
      const days = Math.max(1, Math.ceil((to - from) / (24 * 60 * 60 * 1000)) + 1);
      const loadByDay = new Map();
      sessions.forEach(s => {
        const d = getSessionDate(s);
        if (!d) return;
        if (d < from || d > to) return;
        const key = d.toISOString().slice(0,10);
        loadByDay.set(key, (loadByDay.get(key) || 0) + getLoad(s));
      });
      const series = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(from); d.setDate(from.getDate() + i);
        const key = d.toISOString().slice(0,10);
        series.push(loadByDay.get(key) || 0);
      }
      return series;
    };

    if (daysInRange <= 7) {
      // Range piccolo: calcolo tradizionale
      const acuteStart = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      const chronicStart = new Date(endDate.getTime() - 27 * 24 * 60 * 60 * 1000);

      const acuteSeries = buildDailySeries(acuteStart, endDate, sessionsInRange);
      const chronicSeries = buildDailySeries(chronicStart, endDate, sessionsInRange);

      const acuteAvg = acuteSeries.reduce((s,v)=>s+v,0) / acuteSeries.length; // media 7 gg
      const chronicNonZeroDays = chronicSeries.filter(v => v > 0).length;
      const chronicAvg = chronicNonZeroDays >= 14
        ? (chronicSeries.reduce((s,v)=>s+v,0) / 28) // media su 28 gg quando copertura sufficiente
        : (chronicSeries.reduce((s,v)=>s+v,0) / Math.max(1, chronicNonZeroDays)); // media sui giorni attivi se copertura scarsa

      if (!isFinite(acuteAvg) || !isFinite(chronicAvg) || chronicAvg <= 0) return 0;
      return Math.max(0.1, Math.min(acuteAvg / chronicAvg, 5.0));
    } else {
      // Range grande: calcola ACWR medio per tutto il periodo
      const acwrValues = [];
      
      // Calcola ACWR per ogni settimana nel range
      for (let i = 0; i < daysInRange - 6; i += 7) {
        const weekEnd = new Date(startDate.getTime() + (i + 6) * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
        const chronicStart = new Date(weekEnd.getTime() - 27 * 24 * 60 * 60 * 1000);

        const acuteSeries = buildDailySeries(weekStart, weekEnd, sessionsInRange);
        const chronicSeries = buildDailySeries(chronicStart, weekEnd, sessionsInRange);
        const acuteAvg = acuteSeries.reduce((s,v)=>s+v,0) / acuteSeries.length;
        const chronicNonZeroDays = chronicSeries.filter(v => v > 0).length;
        const chronicAvg = chronicNonZeroDays >= 14
          ? (chronicSeries.reduce((s,v)=>s+v,0) / 28)
          : (chronicSeries.reduce((s,v)=>s+v,0) / Math.max(1, chronicNonZeroDays));

        if (isFinite(acuteAvg) && isFinite(chronicAvg) && chronicAvg > 0) {
          acwrValues.push(Math.max(0.1, Math.min(acuteAvg / chronicAvg, 5.0)));
        }
      }
      
      // Ritorna la media degli ACWR calcolati
      return acwrValues.length > 0 
        ? acwrValues.reduce((sum, val) => sum + val, 0) / acwrValues.length
        : 0;
    }
  };

  // Calcola Monotonia su finestra 7 giorni (media giornaliera / deviazione standard dei carichi giornalieri)
  const computeMonotony7 = (playerSessions, filters = null) => {
    if (!playerSessions || playerSessions.length === 0) return 0;
    
    // Determina il range di date da utilizzare
    let start, end;
    
    if (filters && filters.startDate && filters.endDate) {
      // Usa il range dai filtri
      start = new Date(filters.startDate);
      end = new Date(filters.endDate);
      
      // Se il range è > 7 giorni, usa solo gli ultimi 7 giorni
      const daysDiff = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
      if (daysDiff > 7) {
        start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Fallback: trova l'ultima data disponibile
      const validDates = playerSessions
        .map(s => getSessionDate(s))
        .filter(d => d && !isNaN(d));
      if (validDates.length === 0) return 0;

      end = new Date(Math.max(...validDates.map(d => d.getTime())));
      start = new Date(end); start.setDate(end.getDate() - 6);
    }

    // Somma carico per giorno nella finestra, includendo i giorni senza sessione (0)
    const loadByDay = new Map();
    playerSessions.forEach(s => {
      const d = getSessionDate(s);
      if (!d || isNaN(d)) return;
      if (d < start || d > end) return;
      const key = d.toISOString().slice(0,10);
      const load = getLoad(s);
      loadByDay.set(key, (loadByDay.get(key) || 0) + load);
    });

    // Costruisci array di valori (un valore per ciascun giorno nel range)
    const daysInRange = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1;
    const series = [];
    for (let i = 0; i < daysInRange; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      series.push(loadByDay.get(key) || 0);
    }

    const mean = series.reduce((s, v) => s + v, 0) / series.length;
    const variance = series.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / series.length;
    const stddev = Math.sqrt(variance);
    if (!isFinite(stddev) || stddev < 1e-6) return 0; // evita esplosioni
    const monotony = mean / stddev;
    // clamp a un range realistico per grafico
    return Number(Math.max(0, Math.min(monotony, 6)).toFixed(2));
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

      // Se selezionato un singolo giocatore, ignora gli altri
      if (selectedPlayer && String(playerId) !== String(selectedPlayer)) {
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
      
      const acwr = calculateACWR(playerSessions, null, filters);
      
      // 🔍 DEBUG: Log per Alessio Giustiniani
      if (playerName.includes('Alessio') || playerName.includes('Giustiniani')) {
        console.log(`🔍 [DEBUG ACWR] ${playerName}:`, {
          totalSessions: playerSessions.length,
          acwr: acwr,
          filters: filters,
          sessionDates: playerSessions.map(s => s.session_date).slice(0, 5),
          loads: playerSessions.map(s => s.player_load || s.playerLoad || s.training_load).slice(0, 5)
        });
      }
      
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
      
      // Monotonia 7gg + Strain (somma settimanale * monotonia)
      const monotony = computeMonotony7(playerSessions, filters);
      const weeklySum = playerSessions
        .filter(s => {
          const d = getSessionDate(s);
          if (!d || isNaN(d)) return false;
          const maxD = new Date(Math.max(...playerSessions.map(ps => (getSessionDate(ps)?.getTime() || 0))));
          const minD = new Date(maxD); minD.setDate(maxD.getDate() - 6);
          return d >= minD && d <= maxD;
        })
        .reduce((sum, s) => sum + getLoad(s), 0);
      const strain = Math.round(weeklySum * monotony);
      
      return {
        player: playerName,
        playerId,
        acwr: parseFloat(acwr.toFixed(2)),
        status,
        riskLevel,
        color,
        monotony: monotony,
        strain,
        sessionsCount: playerSessions.length
      };
    }).sort((a, b) => b.acwr - a.acwr);
    
    console.log('✅ Risk/recovery data processed:', result.length, 'players');
    return result;
  }, [data, players, filters]);

  // Trend temporale ACWR
  const acwrTrendData = useMemo(() => {
    if (!data?.length) return [];
    
    // 🔧 Se i dati hanno già ACWR giornaliero → usa direttamente
    const hasPreCalculatedACWR = data[0] && 'acwr' in data[0] && ("date" in data[0] || "dateFull" in data[0]);
    if (hasPreCalculatedACWR) {
      const dateMap = new Map();
      data.forEach(record => {
        const dateStr = (record.date || record.dateFull || '').toString().split('T')[0];
        if (!dateStr) return;
        if (!dateMap.has(dateStr)) dateMap.set(dateStr, { acwrSum: 0, count: 0 });
        const entry = dateMap.get(dateStr);
        entry.acwrSum += (Number(record.acwr) || 0);
        entry.count += 1;
      });
      return Array.from(dateMap.entries()).map(([dateStr, { acwrSum, count }]) => {
        const date = new Date(dateStr);
        return {
          date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          fullDate: dateStr,
          acwr: count > 0 ? parseFloat((acwrSum / count).toFixed(2)) : 0,
          sessionsCount: count
        };
      }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }
    
    // Costruisci timeline completa del periodo
    const start = filters?.startDate ? new Date(filters.startDate) : (getSessionDate(data[0]) || new Date());
    const end = filters?.endDate ? new Date(filters.endDate) : (getSessionDate(data[data.length - 1]) || new Date());
    if (isNaN(start) || isNaN(end)) return [];
    const days = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1);
    
    // Raggruppa le sessioni per giocatore
    const byPlayer = new Map();
    data.forEach(s => {
      const playerId = s.playerId || s.player?.id || s.player_id;
      if (!playerId) return;
      if (!byPlayer.has(playerId)) byPlayer.set(playerId, []);
      byPlayer.get(playerId).push(s);
    });
    
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0,10);
      let sum = 0; let cnt = 0;
      byPlayer.forEach((sessions) => {
        const v = calculateACWR(sessions, dateStr, filters);
        if (isFinite(v)) { sum += v; cnt += 1; }
      });
      out.push({
        date: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: dateStr,
        acwr: cnt > 0 ? parseFloat((sum / cnt).toFixed(2)) : 0,
        sessionsCount: cnt
      });
    }
    return out;
  }, [data, filters]);

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

      {/* Layout: un grafico per riga */}
      <div className="grid grid-cols-1 gap-6">
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
