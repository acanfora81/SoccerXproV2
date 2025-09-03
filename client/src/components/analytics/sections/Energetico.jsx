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
import { useExport } from '../../../hooks/useExport';
import ExportModal from '../../common/ExportModal';

const Energetico = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 Energetico component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 Energetico: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Energetico riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Activity size={20} />
              Energetico & Metabolico
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Activity size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 DATA PROCESSING con supporto per dati aggregati dal backend
  const energeticData = useMemo(() => {
    if (!data?.length) return [];
    
    console.log('🟡 Processing energetic data...'); // WARNING - rimuovere in produzione
    
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
        // Usa campi aggregati dal backend
        avgMetPower: day.avgMetPower || 0,
        totalDistance20wkg: day.distance20wkg || 0,
        totalDistance35wkg: day.distance35wkg || 0,
        totalMinutes: day.totalMinutes || 0,
        maxPower5s: day.maxPower5s || 0,
        // Calcoli derivati
        distance20wkgPerMin: day.totalMinutes > 0 ? (day.distance20wkg || 0) / day.totalMinutes : 0,
        distance35wkgPerMin: day.totalMinutes > 0 ? (day.distance35wkg || 0) / day.totalMinutes : 0,
        totalHighPowerDistance: (day.distance20wkg || 0) + (day.distance35wkg || 0),
        sessions_count: day.sessionsCount || day.sessions?.length || undefined
      }));
    
    console.log('🟢 Energetic data processed:', result.length, 'data points'); // INFO - rimuovere in produzione
    return result;
  }, [data]);

  // Dati per giocatore (costi energetici per ruolo)
  const playerEnergeticData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId;
      if (!playerMap.has(playerId)) {
        const player = players.find(p => p.id === playerId);
        playerMap.set(playerId, {
          playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`,
          position: player?.position || 'Unknown',
          sessions: []
        });
      }
      
      playerMap.get(playerId).sessions.push(session);
    });
    
    return Array.from(playerMap.values()).map(player => {
      const avgMetPower = player.sessions.reduce((sum, s) => sum + (s.avg_metabolic_power_wkg || 0), 0) / player.sessions.length;
      const totalDistance20wkg = player.sessions.reduce((sum, s) => sum + (s.distance_over_20wkg_m || 0), 0);
      const totalDistance35wkg = player.sessions.reduce((sum, s) => sum + (s.distance_over_35wkg_m || 0), 0);
      const totalMinutes = player.sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      return {
        player: player.playerName,
        position: player.position,
        avgMetPower,
        totalDistance20wkg,
        totalDistance35wkg,
        distance20wkgPerMin: totalMinutes > 0 ? (totalDistance20wkg / totalMinutes) : 0,
        distance35wkgPerMin: totalMinutes > 0 ? (totalDistance35wkg / totalMinutes) : 0,
        sessionsCount: player.sessions.length
      };
    }).sort((a, b) => b.avgMetPower - a.avgMetPower);
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
          <Activity size={24} />
          Energetico & Metabolico
        </h2>
        <p>Analisi di potenza metabolica, RVP e costi energetici</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Potenza Metabolica per Sessione */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Zap size={20} />
              <h3>Potenza Metabolica per Sessione</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(energyData, 'energetico_metabolico', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {energeticData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energeticData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgMetPower" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Pot. Metabolica (W/kg)"
                  />
                  <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="5 5" label="Soglia Alta" />
                  <ReferenceLine y={35} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Elite" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Zap size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di potenza metabolica per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Distanze in Zone di Potenza */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Distanze in Zone di Potenza</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(energyData, 'energetico_metabolico', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {energeticData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={energeticData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="totalDistance20wkg" 
                    stackId="1" 
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    name=">20 W/kg (m)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalDistance35wkg" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    name=">35 W/kg (m)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di zone di potenza per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: RVP (Relative Velocity Power) */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>RVP - Relative Velocity Power</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(energyData, 'energetico_metabolico', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {energeticData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={energeticData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati RVP per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Max Power 5s */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={20} />
              <h3>Max Power 5s</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(energyData, 'energetico_metabolico', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {energeticData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energeticData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="maxPower5s" 
                    stroke="#06B6D4" 
                    strokeWidth={3}
                    name="Max Power 5s (W/kg)"
                  />
                  <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Elite" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Target size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di max power per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Costi Energetici per Ruolo */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>Costi Energetici per Ruolo</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(energyData, 'energetico_metabolico', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {playerEnergeticData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerEnergeticData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
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
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di costi energetici per giocatore per il periodo selezionato</p>
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

export default Energetico;
