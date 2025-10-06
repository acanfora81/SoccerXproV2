import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Gauge, TrendingUp, Activity, Target } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const Accelerazioni = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 Accelerazioni component - dati ricevuti:', data?.length || 0, 'records');

  // SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Accelerazioni riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        <Gauge size={48} className="mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Errore Dati</h3>
        <p className="text-sm">I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
      </div>
    );
  }

  // 📊 GRAFICO 1: Trend Numero Acc/Dec Settimanale
  const weeklyAccDecCount = useMemo(() => {
    if (!data?.length) {
      console.log('🔴 [Accelerazioni] Nessun dato disponibile');
      return [];
    }
    
    console.log('🟢 [Accelerazioni] Processing', data.length, 'records');
    console.log('🔍 [Accelerazioni] Primo record:', data[0]);
    
    const weekMap = new Map();
    
    data.forEach((session, idx) => {
      const dateStr = session.dateFull || session.date || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) {
        if (idx < 3) console.warn('⚠️ [Accelerazioni] Record senza data:', session);
        return;
      }
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        if (idx < 3) console.warn('⚠️ [Accelerazioni] Data non valida:', dateStr);
        return;
      }
      
      // ISO-8601 week calculation
      const isoDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      const dayNum = isoDate.getUTCDay() || 7;
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    const result = Array.from(weekMap.values()).map(week => {
      const totalAcc = week.sessions.reduce((sum, s) => {
        const acc = s.totalAccOver3 ?? s.num_acc_over_3_ms2 ?? 0;
        return sum + (Number.isFinite(acc) ? acc : 0);
      }, 0);
      
      const totalDec = week.sessions.reduce((sum, s) => {
        const dec = s.totalDecOver3 ?? s.num_dec_over_minus3_ms2 ?? s['num_dec_over_-3_ms2'] ?? 0;
        return sum + (Number.isFinite(dec) ? dec : 0);
      }, 0);
      
      const totalMinutes = week.sessions.reduce((sum, s) => sum + (s.totalMinutes || s.duration_minutes || 0), 0);
      
      return {
        week: week.week,
        weekFormatted: week.weekFormatted,
        totalAcc: Math.round(totalAcc),
        totalDec: Math.round(totalDec),
        avgAccPerMin: totalMinutes > 0 ? parseFloat((totalAcc / totalMinutes).toFixed(2)) : 0,
        avgDecPerMin: totalMinutes > 0 ? parseFloat((totalDec / totalMinutes).toFixed(2)) : 0,
        sessionsCount: week.sessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
    
    console.log('✅ [Accelerazioni] Dati settimanali processati:', result.length, 'settimane');
    console.log('🔍 [Accelerazioni] Prima settimana:', result[0]);
    console.log('🔍 [Accelerazioni] Ultima settimana:', result[result.length - 1]);
    
    return result;
  }, [data]);

  // 📊 GRAFICO 2 & 3: Trend Rapporto e Distanze Settimanali
  const weeklyAccDecMetrics = useMemo(() => {
    if (!data?.length) return [];
    
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || session.date || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return;
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return;
      
      // ISO-8601 week
      const isoDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      const dayNum = isoDate.getUTCDay() || 7;
      if (dayNum !== 1) isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 1);
      const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
      const isoWeek = Math.ceil((((isoDate - yearStart) / 86400000) + 1) / 7);
      const isoYear = isoDate.getUTCFullYear();
      const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${String(isoWeek).padStart(2, '0')}/${String(isoYear).slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    const result = Array.from(weekMap.values()).map(week => {
      const totalAcc = week.sessions.reduce((sum, s) => {
        const acc = s.totalAccOver3 ?? s.num_acc_over_3_ms2 ?? 0;
        return sum + (Number.isFinite(acc) ? acc : 0);
      }, 0);
      const totalDec = week.sessions.reduce((sum, s) => {
        const dec = s.totalDecOver3 ?? s.num_dec_over_minus3_ms2 ?? s['num_dec_over_-3_ms2'] ?? 0;
        return sum + (Number.isFinite(dec) ? dec : 0);
      }, 0);
      const totalDistAcc = week.sessions.reduce((sum, s) => {
        const v = s.totalDistanceAccOver2 ?? s.distance_acc_over_2_ms2_m ?? 0;
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0);
      const totalDistDec = week.sessions.reduce((sum, s) => {
        const v = s.totalDistanceDecOver2 ?? s.distance_dec_over_minus2_ms2_m ?? s['distance_dec_over_-2_ms2_m'] ?? 0;
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0);
      
      return {
        week: week.week,
        weekFormatted: week.weekFormatted,
        accDecRatio: totalDec > 0 ? parseFloat((totalAcc / totalDec).toFixed(2)) : 0,
        totalDistAcc: Math.round(totalDistAcc),
        totalDistDec: Math.round(totalDistDec),
        sessionsCount: week.sessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
    
    console.log('✅ [Accelerazioni] Metriche settimanali:', result.length, 'settimane');
    if (result.length > 0) {
      console.log('🔍 [Accelerazioni] Prima settimana metriche:', result[0]);
    }
    
    return result;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 text-white border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessionsCount && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              {payload[0].payload.sessionsCount} sessioni
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accelerazioni & Decelerazioni</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analisi trend settimanali di acc/dec e stress meccanico</p>
          </div>
        </div>
      </div>

      {/* Grafico 1: Trend Numero Acc/Dec Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Accelerazioni & Decelerazioni Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyAccDecCount, 'trend-acc-dec', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyAccDecCount.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAccDecCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="totalAcc" 
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Accelerazioni >3 m/s²"
                />
                <Line 
                  type="monotone"
                  dataKey="totalDec" 
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Decelerazioni >3 m/s²"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di accelerazioni per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 2: Trend Rapporto Acc/Dec Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Rapporto Acc/Dec Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyAccDecMetrics, 'trend-rapporto', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyAccDecMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAccDecMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="accDecRatio" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Rapporto Acc/Dec"
                />
                <ReferenceLine y={1} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'Equilibrio', fill: '#F59E0B', fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di rapporto acc/dec per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 3: Trend Distanze Acc/Dec Settimanale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Distanze Acc/Dec Settimanale</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyAccDecMetrics, 'trend-distanze', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyAccDecMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAccDecMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone"
                  dataKey="totalDistAcc" 
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Distanza Acc (m)"
                />
                <Line 
                  type="monotone"
                  dataKey="totalDistDec" 
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Distanza Dec (m)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Gauge className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di distanze acc/dec per il periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Grafico 4: Trend Densità Acc/Dec per Minuto */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Densità Acc/Dec per Minuto</h3>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            onClick={() => handleExport(weeklyAccDecCount, 'trend-densita', players, filters)}
          >
            Esporta Dati
          </button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {weeklyAccDecCount.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAccDecCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="weekFormatted" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="avgAccPerMin" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Acc/Min"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDecPerMin" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Dec/Min"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Target className="w-12 h-12 mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">Nessun dato disponibile</h3>
              <p className="text-sm">Non ci sono dati di densità acc/dec per il periodo selezionato</p>
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

export default Accelerazioni;
