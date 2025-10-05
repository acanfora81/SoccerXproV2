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

  console.log('🟢 Accelerazioni component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 Accelerazioni: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Accelerazioni riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Gauge size={20} />
              Accelerazioni & Decelerazioni
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Gauge size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 DATA PROCESSING con supporto per dati aggregati dal backend
  const accelerationData = useMemo(() => {
    if (!data?.length) return [];
    
    console.log('🟡 Processing acceleration data...'); // WARNING - rimuovere in produzione
    
    // 🔧 FIX: I dati sono GIÀ aggregati dal backend - mappali al formato grafico
    const result = data
      .filter(day => day.dateFull || day.session_date)
      .sort((a, b) => {
        const dateA = new Date(a.dateFull || a.session_date);
        const dateB = new Date(b.dateFull || b.session_date);
        return dateA - dateB;
      })
      .map(day => ({
        date: day.dateFormatted || new Date(day.dateFull || day.session_date).toLocaleDateString('it-IT'),
        fullDate: day.dateFull || day.session_date,
        // Usa campi aggregati dal backend (mappati dai nomi del controller)
        totalAccOver3: day.totalAccOver3 || 0,
        totalDecOver3: day.totalDecOver3 || 0,
        totalDistanceAccOver2: day.totalDistanceAccOver2 || 0,
        totalDistanceDecOver2: day.totalDistanceDecOver2 || 0,
        totalMinutes: day.totalMinutes || 0,
        // Calcoli derivati
        accDecRatio: day.totalDecOver3 > 0 ? (day.totalAccOver3 || 0) / day.totalDecOver3 : 0,
        accPerMin: day.totalMinutes > 0 ? (day.totalAccOver3 || 0) / day.totalMinutes : 0,
        decPerMin: day.totalMinutes > 0 ? (day.totalDecOver3 || 0) / day.totalMinutes : 0,
        totalActions: (day.totalAccOver3 || 0) + (day.totalDecOver3 || 0),
        sessions_count: day.sessionsCount || day.sessions?.length || undefined
      }));
    
    console.log('🟢 Acceleration data processed:', result.length, 'data points'); // INFO - rimuovere in produzione
    return result;
  }, [data]);

  // Dati per giocatore (stress meccanico cumulativo)
  const playerAccData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId;
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        playerMap.set(playerId, {
          playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`,
          sessions: []
        });
      }
      
      playerMap.get(playerId).sessions.push(session);
    });
    
    return Array.from(playerMap.values()).map(player => {
      const totalAcc = player.sessions.reduce((sum, s) => sum + (s.num_acc_over_3_ms2 || 0), 0);
      const totalDec = player.sessions.reduce((sum, s) => sum + (s.num_dec_over_minus3_ms2 || 0), 0);
      const totalDistanceAcc = player.sessions.reduce((sum, s) => sum + (s.distance_acc_over_2_ms2_m || 0), 0);
      const totalMinutes = player.sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      return {
        player: player.playerName,
        totalAcc,
        totalDec,
        totalDistanceAcc,
        accDecRatio: totalDec > 0 ? (totalAcc / totalDec) : 0,
        accPerMin: totalMinutes > 0 ? (totalAcc / totalMinutes) : 0,
        sessionsCount: player.sessions.length
      };
    }).sort((a, b) => b.totalAcc - a.totalAcc);
  }, [data, players]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <p className="tooltip-label" style={{ marginBottom: '8px', fontWeight: '600' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {payload[0]?.payload?.sessions_count && (
            <p style={{ fontSize: '12px', color: '#ccc', marginTop: '8px', borderTop: '1px solid #555', paddingTop: '4px' }}>
              {`${payload[0].payload.sessions_count} sessioni aggregate per questa giornata`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="section-content active">
      <div className="section-header">
        <h2>
          <Gauge size={24} />
          Accelerazioni & Decelerazioni
        </h2>
        <p>Analisi di acc/dec, stress meccanico e densità azioni</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Numero Acc/Dec >3 m/s² */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>Numero Acc/Dec &gt;3 m/s²</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(accelerationData, 'numero_acc_dec_3ms2', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {accelerationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={accelerationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalAccOver3" 
                    fill="#10B981"
                    name="Accelerazioni"
                  />
                  <Bar 
                    dataKey="totalDecOver3" 
                    fill="#EF4444"
                    name="Decelerazioni"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di accelerazioni per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Rapporto Accelerazioni/Decelerazioni */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Rapporto Acc/Dec</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(accelerationData, 'rapporto_acc_dec', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {accelerationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accelerationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accDecRatio" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Rapporto Acc/Dec"
                  />
                  <ReferenceLine y={1} stroke="#F59E0B" strokeDasharray="5 5" label="Equilibrio" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di rapporto acc/dec per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Distanze in Acc/Dec */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Gauge size={20} />
              <h3>Distanze in Acc/Dec &gt;2 m/s²</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(accelerationData, 'distanze_acc_dec_2ms2', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {accelerationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={accelerationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalDistanceAccOver2" 
                    fill="#3B82F6"
                    name="Distanza Acc (m)"
                  />
                  <Bar 
                    dataKey="totalDistanceDecOver2" 
                    fill="#F59E0B"
                    name="Distanza Dec (m)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Gauge size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di distanze acc/dec per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Acc/Dec per Minuto */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={20} />
              <h3>Acc/Dec per Minuto</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(accelerationData, 'acc_dec_per_minuto', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {accelerationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accelerationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accPerMin" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Acc/Min"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="decPerMin" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Dec/Min"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Target size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di acc/dec per minuto per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Stress Meccanico per Giocatore */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>Stress Meccanico per Giocatore</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(playerAccData, 'stress_meccanico_per_giocatore', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {playerAccData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerAccData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalAcc" 
                    fill="#06B6D4"
                    name="Totale Acc"
                  />
                  <Bar 
                    dataKey="totalDec" 
                    fill="#EC4899"
                    name="Totale Dec"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di stress meccanico per giocatore per il periodo selezionato</p>
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

export default Accelerazioni;
