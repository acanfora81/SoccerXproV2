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
import { TrendingUp, Activity, Zap, Info } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import ExportModal from '@/components/common/ExportModal';

const Intensita = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 Intensita component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  // 🔧 FIX: Determina se c'è un giocatore specifico selezionato
  const selectedPlayerId = filters?.players?.[0];
  const isSinglePlayerMode = selectedPlayerId && !isCompareMode;
  
  console.log('🔵 Intensita: modalità', isCompareMode ? 'COMPARE' : (isSinglePlayerMode ? 'SINGLE_PLAYER' : 'TEAM')); // INFO DEV - rimuovere in produzione
  console.log('🔵 Intensita: selectedPlayerId:', selectedPlayerId, 'isSinglePlayerMode:', isSinglePlayerMode); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: Intensita riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <TrendingUp size={20} />
              Intensità
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <TrendingUp size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 DATA PROCESSING - ora i dati arrivano già aggregati dal backend
  const intensityData = useMemo(() => {
    if (!data?.length) return [];
    
    console.log('🟡 Processing intensity data...'); // WARNING - rimuovere in produzione
    
    // 🔧 FIX: I dati arrivano già aggregati dal backend con aggregate=true
    // Non serve più fare l'aggregazione nel frontend
    if (isCompareMode && players.length > 1) {
      // MODALITÀ COMPARE: Una serie per ogni giocatore
      console.log('🔵 Intensita: modalità compare, creando dati per', players.length, 'giocatori'); // INFO DEV - rimuovere in produzione
      
      // Raggruppa per data
      const dateMap = new Map();
      
      data.forEach(session => {
        const date = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
        if (!date) return;
        const dateFormatted = new Date(date).toLocaleDateString('it-IT');
        
        if (!dateMap.has(date)) {
          dateMap.set(date, { date: dateFormatted, dateFull: date });
        }
        
        const entry = dateMap.get(date);
        const player = players.find(p => p.id === session.playerId);
        const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${session.playerId}`;
        const playerKey = `player_${session.playerId}`;
        
        // Inizializza dati giocatore se non esistono
        if (!entry[`${playerKey}_distPerMin`]) {
          entry[`${playerKey}_distPerMin`] = 0;
          entry[`${playerKey}_avgMetPower`] = 0;
          entry[`${playerKey}_hsrTotal`] = 0;
          entry[`${playerKey}_sessions`] = 0;
          entry[`${playerKey}_name`] = playerName;
        }
        
        // Accumula dati
        const totalDistance = session.total_distance_m || 0;
        const duration = session.duration_minutes || 0;
        if (duration > 0) {
          entry[`${playerKey}_distPerMin`] += totalDistance / duration;
        }
        entry[`${playerKey}_avgMetPower`] += session.avg_metabolic_power_wkg || 0;
        entry[`${playerKey}_hsrTotal`] += (session.distance_15_20_kmh_m || 0) + (session.distance_20_25_kmh_m || 0) + (session.distance_over_25_kmh_m || 0);
        entry[`${playerKey}_sessions`]++;
      });
      
      // Calcola medie e ordina
      const result = Array.from(dateMap.values()).map(entry => {
        players.forEach(player => {
          const playerKey = `player_${player.id}`;
          const sessions = entry[`${playerKey}_sessions`] || 0;
          if (sessions > 0) {
            entry[`${playerKey}_distPerMin`] = Math.round(entry[`${playerKey}_distPerMin`] / sessions);
            entry[`${playerKey}_avgMetPower`] = Math.round(entry[`${playerKey}_avgMetPower`] / sessions * 100) / 100;
            entry[`${playerKey}_hsrTotal`] = Math.round(entry[`${playerKey}_hsrTotal`] / sessions);
          }
        });
        return entry;
      }).sort((a, b) => new Date(a.dateFull) - new Date(b.dateFull));
      
      console.log('🟢 Intensity data processed (compare mode):', result.length, 'data points,', players.length, 'players'); // INFO - rimuovere in produzione
      return result;
    } else {
      // 🔧 FIX: MODALITÀ STANDARD - i dati sono già aggregati dal backend
      const mode = isSinglePlayerMode ? 'SINGLE_PLAYER' : 'TEAM';
      console.log(`🔵 Intensita: modalità ${mode}, dati già aggregati dal backend`); // INFO DEV - rimuovere in produzione
      
      // I dati arrivano già aggregati per data dal backend
      // Mappali al formato richiesto dai grafici (includi anche le zone di velocità)
      const result = data
        .filter(day => day.dateFull || day.session_date)
        .sort((a, b) => {
          try {
            const dateA = new Date(a.dateFull || a.session_date);
            const dateB = new Date(b.dateFull || b.session_date);
            return dateA - dateB;
          } catch (error) {
            console.warn('⚠️ Errore ordinamento date:', error);
            return 0;
          }
        })
        .map(day => ({
          date: day.dateFormatted || new Date(day.dateFull || day.session_date).toLocaleDateString('it-IT'),
          fullDate: day.dateFull || day.session_date,
          // Usa campi aggregati dal backend
          distancePerMin: day.distancePerMin || (day.totalDistance && day.totalMinutes ? day.totalDistance / day.totalMinutes : 0),
          avgMetPower: day.avgMetPower || 0,
          hsrTotal: day.hsrTotal || ((day.distance15_20 || 0) + (day.distance20_25 || 0) + (day.distance25plus || 0)),
          // Zone di velocità per grafico "Distribuzione Zone di Velocità"
          distance15_20: day.distance15_20 || 0,
          distance20_25: day.distance20_25 || 0,
          distance25plus: day.distance25plus || 0,
          sessions_count: day.sessionsCount || day.sessions?.length || undefined
        }));
      
      console.log(`🟢 Intensity data processed (${mode} mode):`, result.length, 'data points'); // INFO - rimuovere in produzione
      return result;
    }
  }, [data, isCompareMode, players]);

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
          <TrendingUp size={24} />
          Intensità - Velocità e Potenza Metabolica
        </h2>
        <p>Analisi delle zone di intensità e distribuzione della potenza metabolica</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Distanza per Minuto */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>
                Distanza per Minuto
                {isSinglePlayerMode && (
                  <span style={{ fontSize: '0.8em', color: '#6b7280', fontWeight: 'normal' }}>
                    {' '}(Giocatore Selezionato)
                  </span>
                )}
              </h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(intensityData, 'distanza_per_minuto', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Modalità Standard: Una linea totale */}
                  {!isCompareMode && (
                    <Line 
                      type="monotone" 
                      dataKey="distancePerMin" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#10B981" }}
                      name="Dist/Min (m)"
                    />
                  )}
                  
                  {/* Modalità Compare: Una linea per ogni giocatore */}
                  {isCompareMode && players && players.map((player, index) => {
                    const playerKey = `player_${player.id}_distPerMin`;
                    const playerColor = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#059669'][index % 8];
                    
                    return (
                      <Line
                        key={playerKey}
                        type="monotone"
                        dataKey={playerKey}
                        stroke={playerColor}
                        strokeWidth={2}
                        dot={{ r: 3, fill: playerColor }}
                        name={`${player.firstName} ${player.lastName}`}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di intensità per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Potenza Metabolica Media */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Zap size={20} />
              <h3>Potenza Metabolica Media</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(intensityData, 'potenza_metabolica_media', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="avgMetPower" 
                    fill="#F59E0B"
                    name="Pot. Metabolica (W/kg)"
                  />
                  <ReferenceLine y={20} stroke="#EF4444" strokeDasharray="5 5" label="Soglia Alta" />
                </BarChart>
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

        {/* Grafico 3: Zone di Velocità */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Distribuzione Zone di Velocità</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(intensityData, 'distribuzione_zone_velocita', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="distance15_20" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    name="15-20 km/h (m)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distance20_25" 
                    stackId="1" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    name="20-25 km/h (m)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distance25plus" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    name="25+ km/h (m)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di zone di velocità per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: HSR Totale */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Info size={20} />
              <h3>
                High Speed Running Totale
                {isSinglePlayerMode && (
                  <span style={{ fontSize: '0.8em', color: '#6b7280', fontWeight: 'normal' }}>
                    {' '}(Giocatore Selezionato)
                  </span>
                )}
              </h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(intensityData, 'high_speed_running_totale', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Modalità Standard: Una linea totale */}
                  {!isCompareMode && (
                    <Line 
                      type="monotone" 
                      dataKey="hsrTotal" 
                      stroke="#06B6D4" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#06B6D4" }}
                      name="HSR Totale (m)"
                    />
                  )}
                  
                  {/* Modalità Compare: Una linea per ogni giocatore */}
                  {isCompareMode && players && players.map((player, index) => {
                    const playerKey = `player_${player.id}_hsrTotal`;
                    const playerColor = ['#06B6D4', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#059669'][index % 8];
                    
                    return (
                      <Line
                        key={playerKey}
                        type="monotone"
                        dataKey={playerKey}
                        stroke={playerColor}
                        strokeWidth={2}
                        dot={{ r: 3, fill: playerColor }}
                        name={`${player.firstName} ${player.lastName} HSR`}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Info size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati HSR per il periodo selezionato</p>
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

export default Intensita;
