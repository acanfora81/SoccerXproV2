import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Users, TrendingUp, Activity, Target, AlertTriangle, Zap } from 'lucide-react';
import { useExport } from '../../../hooks/useExport';
import ExportModal from '../../common/ExportModal';

const ReportCoach = ({ data, players, filters, ...props }) => {
  const { 
    showExportModal, 
    exportFormat, 
    setExportFormat, 
    handleExport, 
    handleExportConfirm, 
    handleExportCancel 
  } = useExport();

  console.log('🟢 ReportCoach component rendered con', data?.length || 0, 'records'); // INFO - rimuovere in produzione

  // 🎯 Modalità Compare: gestione multi-giocatore
  const isCompareMode = props.mode === 'compare';
  const comparePlayerIds = props.comparePlayerIds || [];
  
  console.log('🔵 ReportCoach: modalità', isCompareMode ? 'COMPARE' : 'STANDARD'); // INFO DEV - rimuovere in produzione
  
  // 🔒 SICUREZZA: Se data non è un array, mostra errore
  if (!Array.isArray(data)) {
    console.error('🔴 ERRORE: ReportCoach riceve data non-array:', { 
      dataType: typeof data, 
      data: data 
    });
    return (
      <div className="section-content active">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Users size={20} />
              Report Coach
            </h3>
          </div>
          <div className="chart-content">
            <div className="chart-no-data">
              <Users size={48} />
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
    
    let target;
    if (targetDate) {
      target = new Date(targetDate);
    } else {
      const dates = playerSessions.map(s => {
        const d = s.dateFull || (s.session_date ? s.session_date.split(' ')[0] : null);
        return d ? new Date(d) : null;
      }).filter(Boolean);
      target = new Date(Math.max(...dates));
    }
    
    const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
    const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const acuteSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= acute7Days && sessionDate <= target;
    });
    
    const chronicSessions = playerSessions.filter(session => {
      const dateOnly = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateOnly) return;
      const sessionDate = new Date(dateOnly);
      return sessionDate >= chronic28Days && sessionDate <= target;
    });
    
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
    const chronicLoad = chronicSessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0) / 4;
    
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  };

  // 📊 DATA PROCESSING per report completo
  const reportData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    
    console.log('🟡 Processing coach report data...'); // WARNING - rimuovere in produzione
    
    // Raggruppa per giocatore e calcola tutti i KPI
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
    
    const result = Array.from(playerMap.values()).map(player => {
      const sessions = player.sessions;
      const totalDistance = sessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalLoad = sessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
      const maxSpeed = Math.max(...sessions.map(s => s.top_speed_kmh || 0));
      const avgMetPower = sessions.reduce((sum, s) => sum + (s.avg_metabolic_power_wkg || 0), 0) / sessions.length;
      const totalHSR = sessions.reduce((sum, s) => sum + (s.distance_15_20_kmh_m || 0) + (s.distance_20_25_kmh_m || 0) + (s.distance_over_25_kmh_m || 0), 0);
      const totalAcc = sessions.reduce((sum, s) => sum + (s.num_acc_over_3_ms2 || 0), 0);
      const totalDec = sessions.reduce((sum, s) => sum + (s.num_dec_over_minus3_ms2 || 0), 0);
      
      const acwr = calculateACWR(sessions);
      
      let acwrStatus = 'normal';
      if (acwr === 0) acwrStatus = 'no-data';
      else if (acwr < 0.8) acwrStatus = 'underload';
      else if (acwr > 1.3) acwrStatus = 'overload';
      
      return {
        player: player.playerName,
        position: player.position,
        sessionsCount: sessions.length,
        totalDistance,
        totalMinutes,
        totalLoad,
        maxSpeed,
        avgMetPower,
        totalHSR,
        totalAcc,
        totalDec,
        acwr: acwr.toFixed(2),
        acwrNum: acwr,
        acwrStatus,
        distancePerMin: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        loadPerMin: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        hsrPerMin: totalMinutes > 0 ? (totalHSR / totalMinutes) : 0,
        accPerMin: totalMinutes > 0 ? (totalAcc / totalMinutes) : 0,
        decPerMin: totalMinutes > 0 ? (totalDec / totalMinutes) : 0
      };
    }).sort((a, b) => b.totalLoad - a.totalLoad);
    
    console.log('🟢 Coach report data processed:', result.length, 'players'); // INFO - rimuovere in produzione
    return result;
  }, [data, players]);

  // Dati per distribuzione per ruolo
  const roleDistributionData = useMemo(() => {
    if (!reportData.length) return [];
    
    const roleMap = new Map();
    
    reportData.forEach(player => {
      if (!roleMap.has(player.position)) {
        roleMap.set(player.position, {
          role: player.position,
          count: 0,
          totalLoad: 0,
          totalDistance: 0,
          avgSpeed: 0,
          avgMetPower: 0
        });
      }
      
      const roleData = roleMap.get(player.position);
      roleData.count++;
      roleData.totalLoad += player.totalLoad;
      roleData.totalDistance += player.totalDistance;
      roleData.avgSpeed += player.maxSpeed;
      roleData.avgMetPower += player.avgMetPower;
    });
    
    return Array.from(roleMap.values()).map(role => ({
      ...role,
      avgSpeed: role.count > 0 ? (role.avgSpeed / role.count) : 0,
      avgMetPower: role.count > 0 ? (role.avgMetPower / role.count) : 0
    }));
  }, [reportData]);

  // Dati per trend settimanale
  const weeklyTrendData = useMemo(() => {
    if (!data?.length) return [];
    
    const weekMap = new Map();
    
    data.forEach(session => {
      const dateStr = session.dateFull || (session.session_date ? session.session_date.split(' ')[0] : null);
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          weekFormatted: `Set. ${weekKey.split('-W')[1]}/${weekKey.split('-W')[0].slice(2)}`,
          sessions: []
        });
      }
      weekMap.get(weekKey).sessions.push(session);
    });
    
    return Array.from(weekMap.values()).map(week => {
      const totalDistance = week.sessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
      const totalMinutes = week.sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalLoad = week.sessions.reduce((sum, s) => sum + (s.player_load || s.training_load || 0), 0);
      
      return {
        ...week,
        avgDistance: totalMinutes > 0 ? (totalDistance / totalMinutes) : 0,
        avgLoad: totalMinutes > 0 ? (totalLoad / totalMinutes) : 0,
        sessionsCount: week.sessions.length
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

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <>
    <div className="section-content active">
      <div className="section-header">
        <h2>
          <Users size={24} />
          Report Coach
        </h2>
        <p>Report personalizzati per preparatori atletici</p>
      </div>

      <div className="charts-grid">
        {/* Grafico 1: Report Settimanale - KPI Principali */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={20} />
              <h3>Report Settimanale - KPI Principali</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {reportData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="loadPerMin" 
                    fill="#3B82F6"
                    name="Load/Min"
                  />
                  <Bar 
                    dataKey="distancePerMin" 
                    fill="#10B981"
                    name="Dist/Min (m)"
                  />
                  <Bar 
                    dataKey="hsrPerMin" 
                    fill="#F59E0B"
                    name="HSR/Min (m)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Activity size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per il report settimanale</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 2: Report Mensile - Trend ACWR */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={20} />
              <h3>Report Mensile - Trend ACWR</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {reportData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
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
                    {reportData.map((entry, index) => (
                      <Bar 
                        key={`cell-${index}`} 
                        fill={
                          entry.acwrStatus === 'overload' ? '#EF4444' :
                          entry.acwrStatus === 'underload' ? '#F59E0B' :
                          entry.acwrStatus === 'no-data' ? '#9ca3af' :
                          '#10B981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <TrendingUp size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per il report mensile</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 3: Report per Giocatore - Performance Completa */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={20} />
              <h3>Report per Giocatore - Performance Completa</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {reportData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="maxSpeed" 
                    fill="#EF4444"
                    name="Max Speed (km/h)"
                  />
                  <Bar 
                    dataKey="avgMetPower" 
                    fill="#8B5CF6"
                    name="Avg Met Power (W/kg)"
                  />
                  <Bar 
                    dataKey="accPerMin" 
                    fill="#06B6D4"
                    name="Acc/Min"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Target size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per il report per giocatore</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 4: Report per Ruolo - Distribuzione */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Users size={20} />
              <h3>Report per Ruolo - Distribuzione</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {roleDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Users size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per il report per ruolo</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 5: Report Personalizzato - Trend Settimanale */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Zap size={20} />
              <h3>Report Personalizzato - Trend Settimanale</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {weeklyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekFormatted" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgDistance" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Avg Distance (m/min)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgLoad" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Avg Load (au/min)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessionsCount" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Sessions Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-no-data">
                <Zap size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per il report personalizzato</p>
              </div>
            )}
          </div>
        </div>

        {/* Grafico 6: Alert e Raccomandazioni */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <AlertTriangle size={20} />
              <h3>Alert e Raccomandazioni</h3>
            </div>
            <div className="chart-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleExport(reportData, 'report_coach', players, filters)}
              >
                Esporta Dati
              </button>
            </div>
          </div>
          <div className="chart-content">
            {reportData.length > 0 ? (
              <div style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '16px', color: '#EF4444' }}>⚠️ Giocatori a Rischio</h4>
                {reportData.filter(p => p.acwrStatus === 'overload').map(player => (
                  <div key={player.playerId} style={{ 
                    marginBottom: '8px', 
                    padding: '8px', 
                    backgroundColor: '#FEF2F2', 
                    border: '1px solid #FECACA',
                    borderRadius: '4px'
                  }}>
                    <strong>{player.player}</strong> - ACWR: {player.acwr} (Sovraccarico)
                  </div>
                ))}
                
                <h4 style={{ marginTop: '20px', marginBottom: '16px', color: '#F59E0B' }}>⚠️ Giocatori Sottocarico</h4>
                {reportData.filter(p => p.acwrStatus === 'underload').map(player => (
                  <div key={player.playerId} style={{ 
                    marginBottom: '8px', 
                    padding: '8px', 
                    backgroundColor: '#FFFBEB', 
                    border: '1px solid #FED7AA',
                    borderRadius: '4px'
                  }}>
                    <strong>{player.player}</strong> - ACWR: {player.acwr} (Sottocarico)
                  </div>
                ))}
                
                {reportData.filter(p => p.acwrStatus === 'overload' || p.acwrStatus === 'underload').length === 0 && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#F0FDF4', 
                    border: '1px solid #BBF7D0',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Target size={20} className="text-green-500" />
                    Tutti i giocatori hanno un carico ottimale
                </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="chart-no-data">
                <AlertTriangle size={48} />
                <h3>Nessun dato disponibile</h3>
                <p>Non ci sono dati per gli alert</p>
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

export default ReportCoach;
