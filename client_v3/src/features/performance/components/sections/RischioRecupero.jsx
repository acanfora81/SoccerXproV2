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
  ReferenceLine
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

  console.log('🟢 RischioRecupero component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 RischioRecupero: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: RischioRecupero riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Shield size={20} />
              Rischio & Recupero
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Shield size={48} />
              <h3>Errore Dati</h3>
              <p>I dati ricevuti non sono nel formato corretto. Tipo: {typeof data}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 CALCOLO ACWR (Acute:Chronic Workload Ratio)
  const calculateACWR = (playerSessions, targetDate = null) => {
    if (!playerSessions || playerSessions.length === 0) return 0;
    
    // Se non viene specificata una data target, usa la data più recente dai dati
    let target;
    if (targetDate) {
      target = new Date(targetDate);
    } else {
      // Trova la data più recente dalle sessioni
      const dates = playerSessions.map(s => {
        const d = s.dateFull || (s.session_date ? s.session_date.split(' ')[0] : null);
        return d ? new Date(d) : null;
      }).filter(Boolean);
      target = new Date(Math.max(...dates));
    }
    
    const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
    const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    // Sessioni ultimi 7 giorni (Acute)
    const acuteSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= acute7Days && sessionDate <= target;
    });
    
    // Sessioni ultimi 28 giorni (Chronic)
    const chronicSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= chronic28Days && sessionDate <= target;
    });
    
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
    const chronicLoad = chronicSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0) / 4; // Media settimanale
    
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  };

  // 📊 DATA PROCESSING usando le logiche ACWR
  const riskData = useMemo(() => {
    if (!data?.length) return [];
    
    console.log('🟡 Processing risk/recovery data...'); // WARNING - rimuovere in produzione
    
    // Raggruppa per giocatore e calcola ACWR
    const playerMap = new Map();
    
    data.forEach(session => {
      const playerId = session.playerId;
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
      if (acwr === 0) {
        status = 'no-data';
        riskLevel = 'unknown';
      } else if (acwr < 0.8) {
        status = 'underload';
        riskLevel = 'low';
      } else if (acwr > 1.3) {
        status = 'overload';
        riskLevel = 'high';
      } else if (acwr > 1.0) {
        status = 'high-load';
        riskLevel = 'medium';
      }
      
      // Calcola monotonia (varianza del carico)
      const loads = playerSessions.map(s => s.player_load || s.training_load || 0).filter(l => l > 0);
      const meanLoad = loads.length > 0 ? loads.reduce((sum, l) => sum + l, 0) / loads.length : 0;
      const variance = loads.length > 0 ? loads.reduce((sum, l) => sum + Math.pow(l - meanLoad, 2), 0) / loads.length : 0;
      const monotony = variance > 0 ? meanLoad / Math.sqrt(variance) : 0;
      
      // Calcola strain (carico totale)
      const strain = playerSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
      
      return {
        player: playerName,
        playerId,
        acwr: acwr.toFixed(2),
        acwrNum: acwr,
        status,
        riskLevel,
        monotony: monotony.toFixed(2),
        monotonyNum: monotony,
        strain: Math.round(strain),
        sessionsCount: playerSessions.length,
        lastSession: playerSessions.sort((a, b) => new Date(b.session_date) - new Date(a.session_date))[0]?.session_date
      };
    }).sort((a, b) => b.acwrNum - a.acwrNum);
    
    console.log('🟢 Risk/recovery data processed:', result.length, 'players'); // INFO - rimuovere in produzione
    return result;
  }, [data, players]);

  // Dati per trend temporale ACWR
  const acwrTrendData = useMemo(() => {
    if (!data?.length) return [];
    
    // Raggruppa per settimana e calcola ACWR medio
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey).push(session);
    });
    
    return Array.from(weekMap.entries()).map(([week, weekSessions]) => {
      const acwr = calculateACWR(weekSessions);
      return {
        week,
        weekFormatted: `Set. ${week.split('-W')[1]}/${week.split('-W')[0].slice(2)}`,
        acwr: acwr.toFixed(2),
        acwrNum: acwr,
        sessionsCount: weekSessions.length
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

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
          <Shield size={24} />
          Rischio & Recupero
        </h2>
        <p>Analisi di ACWR, monotonia, strain e readiness</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: ACWR per Giocatore */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>ACWR per Giocatore</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(riskData, 'rischio_recupero', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0.8} stroke="#10B981" strokeDasharray="5 5" label="Min" />
                  <ReferenceLine y={1.3} stroke="#EF4444" strokeDasharray="5 5" label="Max" />
                  <Bar 
                    dataKey="acwrNum" 
                    name="ACWR"
                  >
                    {riskData.map((entry, index) => (
                      <Bar 
                        key={`cell-${index}`} 
                        fill={
                          entry.status === 'overload' ? '#EF4444' :
                          entry.status === 'underload' ? '#F59E0B' :
                          entry.status === 'no-data' ? '#9ca3af' :
                          '#10B981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati ACWR per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Trend ACWR nel Tempo */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Trend ACWR nel Tempo</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(riskData, 'rischio_recupero', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {acwrTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={acwrTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekFormatted" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="acwrNum" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="ACWR"
                  />
                  <ReferenceLine y={0.8} stroke="#10B981" strokeDasharray="5 5" label="Min" />
                  <ReferenceLine y={1.3} stroke="#EF4444" strokeDasharray="5 5" label="Max" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di trend ACWR per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Monotonia del Carico */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <AlertTriangle size={20} />
              <h3>Monotonia del Carico</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(riskData, 'rischio_recupero', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={2} stroke="#F59E0B" strokeDasharray="5 5" label="Soglia" />
                  <Bar 
                    dataKey="monotonyNum" 
                    fill="#F59E0B"
                    name="Monotonia"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <AlertTriangle size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di monotonia per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Strain vs Fitness */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Shield size={20} />
              <h3>Strain vs Fitness</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(riskData, 'rischio_recupero', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strain" name="Strain" />
                  <YAxis dataKey="acwrNum" name="ACWR" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Scatter 
                    dataKey="acwrNum" 
                    fill="#8B5CF6"
                    name="ACWR vs Strain"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Shield size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di strain per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Rischio Infortunio */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <AlertTriangle size={20} />
              <h3>Rischio Infortunio</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(riskData, 'rischio_recupero', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="acwrNum" 
                    name="Rischio (ACWR)"
                  >
                    {riskData.map((entry, index) => (
                      <Bar 
                        key={`cell-${index}`} 
                        fill={
                          entry.riskLevel === 'high' ? '#EF4444' :
                          entry.riskLevel === 'medium' ? '#F59E0B' :
                          entry.riskLevel === 'unknown' ? '#9ca3af' :
                          '#10B981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <AlertTriangle size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati di rischio infortunio per il periodo selezionato</p>
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
