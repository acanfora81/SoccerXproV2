// client/src/components/analytics/sections/CaricoVolumi.jsx
// 🎯 VERSIONE CORRETTA - Carico & Volumi con dati reali del database

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
  ReferenceLine,
  LabelList
} from 'recharts';
import { 
  BarChart3, 
  Calendar, 
  Target, 
  Users, 
  TrendingUp,
  Activity 
} from 'lucide-react';

// =========================
// UTILITY FUNCTIONS
// =========================

// Training Load effettivo (usa i campi reali del DB)
const effectiveTL = (session) => {
  return session.training_load || session.player_load || 0;
};

// Formattazione date
const formatDate = (dateStr) => {
  try {
    // Gestisce il formato '2025-07-01 00:00:00'
    const dateOnly = dateStr.split(' ')[0];
    return new Date(dateOnly).toLocaleDateString('it-IT');
  } catch {
    return dateStr;
  }
};

// Chiave settimana ISO
const isoWeekKey = (dateStr) => {
  try {
    // Gestisce il formato '2025-07-01 00:00:00'
    const dateOnly = dateStr.split(' ')[0];
    const date = new Date(dateOnly);
    const year = date.getFullYear();
    const week = getISOWeek(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

// Calcola settimana ISO
const getISOWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Formattazione settimana
const formatWeek = (weekStr) => {
  const [year, week] = weekStr.split('-W');
  return `Set. ${week}/${year.slice(2)}`;
};

// Divisione sicura
const safeDiv = (a, b) => (b !== 0 && b != null) ? a / b : 0;

// =========================
// CALCOLO ACWR
// =========================

const calculateACWR = (playerSessions, targetDate = null) => {
  if (!playerSessions || playerSessions.length === 0) return 0;
  
  // Se non viene specificata una data target, usa la data più recente dai dati
  let target;
  if (targetDate) {
    target = new Date(targetDate);
  } else {
    // Trova la data più recente dalle sessioni
    const dates = playerSessions.map(s => new Date(s.session_date.split(' ')[0]));
    target = new Date(Math.max(...dates));
  }
  
  const acute7Days = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
  const chronic28Days = new Date(target.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  // Sessioni ultimi 7 giorni (Acute)
  const acuteSessions = playerSessions.filter(session => {
    const dateOnly = session.session_date.split(' ')[0];
    const sessionDate = new Date(dateOnly);
    return sessionDate >= acute7Days && sessionDate <= target;
  });
  
  // Sessioni ultimi 28 giorni (Chronic)
  const chronicSessions = playerSessions.filter(session => {
    const dateOnly = session.session_date.split(' ')[0];
    const sessionDate = new Date(dateOnly);
    return sessionDate >= chronic28Days && sessionDate <= target;
  });
  
  const acuteLoad = acuteSessions.reduce((sum, s) => sum + effectiveTL(s), 0);
  const chronicLoad = chronicSessions.reduce((sum, s) => sum + effectiveTL(s), 0) / 4; // Media settimanale
  

  
  return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
};

// =========================
// DATA BUILDERS
// =========================

// 1. Trend Distanza nel Tempo
function buildDistanceTrend(sessions) {
  return sessions
    .sort((a, b) => {
      const dateA = new Date(a.session_date.split(' ')[0]);
      const dateB = new Date(b.session_date.split(' ')[0]);
      return dateA - dateB;
    })
    .map(s => ({
      date: s.session_date,
      dateFormatted: formatDate(s.session_date),
      distance_m: s.total_distance_m || 0,
      session_type: s.session_type || 'N/A',
      isMatch: s.session_type === 'Partita'
    }));
}

// 2. Distanza Equivalente vs Reale
function buildEqVsReal(sessions) {
  return sessions
    .filter(s => s.equivalent_distance_m != null)
    .sort((a, b) => {
      const dateA = new Date(a.session_date.split(' ')[0]);
      const dateB = new Date(b.session_date.split(' ')[0]);
      return dateA - dateB;
    })
    .map(s => {
      const eq = s.equivalent_distance_m || 0;
      const real = s.total_distance_m || 0;
      const eq_pct = safeDiv(eq, real) * 100;
      return {
        date: s.session_date,
        dateFormatted: formatDate(s.session_date),
        real_m: real,
        equivalent_m: eq,
        eq_pct: eq_pct.toFixed(1)
      };
    });
}

// 3. Training Load Settimanale
function buildWeeklyLoad(sessions) {
  const byWeek = new Map();
  
  sessions.forEach(s => {
    const weekKey = isoWeekKey(s.session_date);
    const currentLoad = byWeek.get(weekKey) || 0;
    byWeek.set(weekKey, currentLoad + effectiveTL(s));
  });
  
  return Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, load_sum]) => ({
      week,
      weekFormatted: formatWeek(week),
      load_sum: Math.round(load_sum)
    }));
}

// 4. ACWR per Giocatore
function buildACWRByPlayer(sessions, players) {
  const playerMap = new Map();
  
  // Raggruppa per giocatore
  sessions.forEach(s => {
    // Converte playerId stringa in numero per il match
    const playerIdNum = parseInt(s.playerId, 10);
    if (!playerMap.has(playerIdNum)) {
      playerMap.set(playerIdNum, []);
    }
    playerMap.get(playerIdNum).push(s);
  });
  
  // Calcola ACWR per ogni giocatore
  const result = Array.from(playerMap.entries()).map(([playerId, playerSessions]) => {
    const player = players.find(p => p.id === playerId);
    const playerName = player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`;
    
    const acwr = calculateACWR(playerSessions);
    
    let status = 'normal';
    if (acwr === 0) status = 'no-data';
    else if (acwr < 0.8) status = 'underload';
    else if (acwr > 1.3) status = 'overload';
    
    return {
      player: playerName,
      playerId,
      acwr: acwr.toFixed(2),
      acwrNum: acwr,
      status
    };
  });
  
  return result;
}

// 5. Distribuzione Carico per Tipologia
function buildLoadByTypology(sessions) {
  const typeMap = new Map();
  
  sessions.forEach(s => {
    const type = s.session_type || 'Altro';
    const currentLoad = typeMap.get(type) || 0;
    typeMap.set(type, currentLoad + effectiveTL(s));
  });
  
  const total = Array.from(typeMap.values()).reduce((sum, load) => sum + load, 0);
  
  return Array.from(typeMap.entries())
    .map(([typology, load_sum]) => ({
      typology,
      load_sum: Math.round(load_sum),
      pct: total > 0 ? (load_sum / total) * 100 : 0
    }))
    .sort((a, b) => b.load_sum - a.load_sum);
}

// =========================
// COMPONENT
// =========================

const CaricoVolumi = ({ data, players, viewMode = 'charts' }) => {
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e'
  };

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // =========================
  // DATA PROCESSING
  // =========================

  const distanceTrendData = useMemo(() => {
    if (!data?.length) return [];
    return buildDistanceTrend(data);
  }, [data]);

  const equivalentDistanceData = useMemo(() => {
    if (!data?.length) return [];
    return buildEqVsReal(data);
  }, [data]);

  const weeklyLoadData = useMemo(() => {
    if (!data?.length) return [];
    return buildWeeklyLoad(data);
  }, [data]);

  const acwrData = useMemo(() => {
    if (!data?.length || !players?.length) return [];
    return buildACWRByPlayer(data, players);
  }, [data, players]);

  const loadDistributionData = useMemo(() => {
    if (!data?.length) return [];
    return buildLoadByTypology(data);
  }, [data]);

  // =========================
  // CUSTOM COMPONENTS
  // =========================

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <p className="tooltip-label" style={{ 
            margin: '0 0 8px 0', 
            fontWeight: '600',
            borderBottom: '1px solid #555',
            paddingBottom: '4px'
          }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '4px 0',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: '600' }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // =========================
  // RENDER CHARTS
  // =========================

  const renderDistanceTrendChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp size={20} />
          <h3>Trend Distanza nel Tempo</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
        </div>
      </div>
      <div className="chart-content">
        {distanceTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={distanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateFormatted" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="distance_m" 
                stroke={colors.primary} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Distanza (m)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <TrendingUp size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distanza per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEquivalentDistanceChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <BarChart3 size={20} />
          <h3>Distanza Equivalente vs Reale</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
        </div>
      </div>
      <div className="chart-content">
        {equivalentDistanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={equivalentDistanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateFormatted" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
                                             <Bar dataKey="real_m" fill={colors.primary} name="Reale (m)" />
                <Bar dataKey="equivalent_m" fill={colors.secondary} name="Equivalente (m)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <BarChart3 size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distanza equivalente per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWeeklyLoadChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Calendar size={20} />
          <h3>Training Load Settimanale</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
        </div>
      </div>
      <div className="chart-content">
        {weeklyLoadData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyLoadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="weekFormatted" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
                             <Bar dataKey="load_sum" fill={colors.primary} name="TL settimanale">
                 <LabelList 
                   dataKey="load_sum" 
                   position="top" 
                   formatter={(value) => Math.round(value)}
                   style={{ fontSize: '11px', fontWeight: '600', fill: colors.primary }}
                 />
               </Bar>
              <ReferenceLine y={1500} stroke={colors.warning} strokeDasharray="5 5" label="Soglia Alta" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Calendar size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di training load per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderACWRChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Target size={20} />
          <h3>ACWR per Giocatore</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
        </div>
      </div>
      <div className="chart-content">
        {acwrData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={acwrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="player" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0.8} stroke={colors.warning} strokeDasharray="5 5" label="Min" />
              <ReferenceLine y={1.3} stroke={colors.danger} strokeDasharray="5 5" label="Max" />
                             <Bar 
                 dataKey="acwrNum" 
                 name="ACWR"
               >
                 {acwrData.map((entry, index) => (
                   <Cell 
                     key={`cell-${index}`} 
                     fill={
                       entry.status === 'overload' ? colors.danger :
                       entry.status === 'underload' ? colors.warning :
                       entry.status === 'no-data' ? '#9ca3af' :
                       colors.success
                     }
                   />
                 ))}
                 <LabelList 
                   dataKey="acwrNum" 
                   position="top" 
                   formatter={(value) => value.toFixed(2)}
                   style={{ fontSize: '12px', fontWeight: '600', fill: '#333' }}
                 />
               </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Target size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati ACWR per i giocatori selezionati</p>
          </div>
        )}
      </div>
             <div className="chart-legend" style={{
         display: 'flex',
         justifyContent: 'center',
         gap: '20px',
         marginTop: '16px',
         padding: '12px',
         backgroundColor: '#f8fafc',
         borderRadius: '8px',
         border: '1px solid #e2e8f0'
       }}>
         <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="legend-color" style={{ 
             backgroundColor: colors.success, 
             width: '16px', 
             height: '16px', 
             borderRadius: '4px',
             border: '1px solid #ddd'
           }}></div>
           <span style={{ fontSize: '14px', fontWeight: '500' }}>Normale (0.8-1.3)</span>
         </div>
         <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="legend-color" style={{ 
             backgroundColor: colors.warning, 
             width: '16px', 
             height: '16px', 
             borderRadius: '4px',
             border: '1px solid #ddd'
           }}></div>
           <span style={{ fontSize: '14px', fontWeight: '500' }}>Sottocarico (&lt;0.8)</span>
         </div>
         <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="legend-color" style={{ 
             backgroundColor: colors.danger, 
             width: '16px', 
             height: '16px', 
             borderRadius: '4px',
             border: '1px solid #ddd'
           }}></div>
           <span style={{ fontSize: '14px', fontWeight: '500' }}>Sovraccarico (&gt;1.3)</span>
         </div>
         <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="legend-color" style={{ 
             backgroundColor: '#9ca3af', 
             width: '16px', 
             height: '16px', 
             borderRadius: '4px',
             border: '1px solid #ddd'
           }}></div>
           <span style={{ fontSize: '14px', fontWeight: '500' }}>Dati insufficienti</span>
         </div>
       </div>
    </div>
  );

  const renderLoadDistributionChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Users size={20} />
          <h3>Distribuzione Carico per Tipologia</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
        </div>
      </div>
      <div className="chart-content">
        {loadDistributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                             <Pie
                 data={loadDistributionData}
                 cx="50%"
                 cy="50%"
                 labelLine={false}
                 outerRadius={80}
                 fill="#8884d8"
                 dataKey="load_sum"
               >
                {loadDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-no-data">
            <Users size={48} />
            <h3>Nessun dato disponibile</h3>
            <p>Non ci sono dati di distribuzione carico per il periodo selezionato</p>
          </div>
        )}
      </div>
    </div>
  );

  // =========================
  // RENDER VIEWS
  // =========================

  const renderCompactView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi - Vista Compatta</h2>
        <p>KPI principali e statistiche essenziali</p>
      </div>

      <div className="compact-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{data?.length || 0}</div>
          <div className="kpi-label">Sessioni Totali</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + (s.total_distance_m || 0), 0) / 1000) : 0} km
          </div>
          <div className="kpi-label">Distanza Totale</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)) : 0} min
          </div>
          <div className="kpi-label">Tempo Totale</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">
            {data?.length ? Math.round(data.reduce((sum, s) => sum + effectiveTL(s), 0)) : 0}
          </div>
          <div className="kpi-label">Training Load Totale</div>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi - Vista Tabellare</h2>
        <p>Dati grezzi in formato tabella</p>
      </div>

      <div className="table-container">
        <table className="table data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Giocatore</th>
              <th>Tipo</th>
              <th>Distanza (m)</th>
              <th>Durata (min)</th>
              <th>Training Load</th>
              <th>Distanza Equiv. (m)</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((session, index) => {
              const player = players?.find(p => p.id === session.playerId);
              return (
                <tr key={index}>
                  <td>{formatDate(session.session_date)}</td>
                  <td>{player ? `${player.firstName} ${player.lastName}` : 'N/A'}</td>
                  <td>{session.session_type || 'N/A'}</td>
                  <td>{session.total_distance_m || 0}</td>
                  <td>{session.duration_minutes || 0}</td>
                  <td>{Math.round(effectiveTL(session))}</td>
                  <td>{session.equivalent_distance_m || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChartsView = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Carico Globale & Volumi</h2>
        <p>Analisi del carico di lavoro e dei volumi di allenamento</p>
      </div>

      <div className="charts-grid">
        {renderDistanceTrendChart()}
        {renderEquivalentDistanceChart()}
        {renderWeeklyLoadChart()}
        {renderACWRChart()}
        {renderLoadDistributionChart()}
      </div>
    </div>
  );

  // =========================
  // MAIN RENDER
  // =========================

  return (
    <>
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'charts' && renderChartsView()}
    </>
  );
};

export default CaricoVolumi;