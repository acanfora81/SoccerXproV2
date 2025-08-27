import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { TrendingUp, BarChart3, Calendar, Target, Users } from 'lucide-react';

// =========================
// UTILITY FUNCTIONS
// =========================

const MS_PER_DAY = 86400000;

const safeDiv = (n, d) =>
  d === 0 || !Number.isFinite(n) || !Number.isFinite(d) ? null : n / d;

const toISO = (d) => d.toISOString().slice(0, 10);

/** Formatta data in formato italiano DD/MM */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit'
  });
};

/** Formatta settimana in formato leggibile */
const formatWeek = (weekKey) => {
  // weekKey è "YYYY-Www", es. "2025-W35"
  const [year, week] = weekKey.split('-W');
  return `Sett. ${week}`;
};

/** Settimana ISO (lun-dom), tz Europe/Rome */
function isoWeekKey(dateISO) {
  // usa sempre "YYYY-Www" (es. 2025-W35)
  const d = new Date(dateISO + "T12:00:00+02:00"); // evita problemi tz
  const day = d.getUTCDay() || 7; // 1..7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((+d - +yearStart) / MS_PER_DAY) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** TL effettivo: usa TL del device, altrimenti proxy */
function effectiveTL(s) {
  if (s.training_load != null) return s.training_load;
  // Proxy semplice e robusto: equivalente se presente, altrimenti distanza
  return s.equivalent_distance_m ?? s.total_distance_m;
}

// =========================
// DATA PROCESSING FUNCTIONS
// =========================

// 1. Distanza Totale per Sessione – Trend temporale
function buildDistanceTrend(sessions) {
  return sessions
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map(s => ({
      date: s.session_date,
      dateFormatted: formatDate(s.session_date),
      playerId: s.playerId,
      total_distance_m: s.total_distance_m,
      m_per_min: safeDiv(s.total_distance_m, s.duration_min)
    }));
}

// 2. Distanza Equivalente vs Reale – Confronto
function buildEqVsReal(sessions) {
  return sessions
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map(s => {
      const eq = s.equivalent_distance_m ?? null;
      const eq_pct = (eq !== null) ? safeDiv(eq, s.total_distance_m) * 100 : null;
      return {
        date: s.session_date,
        dateFormatted: formatDate(s.session_date),
        real_m: s.total_distance_m,
        equivalent_m: eq,
        eq_pct
      };
    });
}

// 3. Training Load Settimanale – Carico settimanale
function buildWeeklyLoad(sessions) {
  const byWeek = new Map();
  for (const s of sessions) {
    const w = isoWeekKey(s.session_date);
    byWeek.set(w, (byWeek.get(w) ?? 0) + effectiveTL(s));
  }
  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, load_sum]) => ({ 
      week, 
      weekFormatted: formatWeek(week),
      load_sum 
    }));
}

// 4. ACWR per Giocatore – Acute:Chronic Workload Ratio
// (RIMOSSO - ora usiamo la logica della pagina Analytics normale)

// 5. Distribuzione Carico per Tipologia – Pie chart
function buildLoadByTypology(sessions, fromISO, toISO) {
  const from = fromISO ? new Date(fromISO) : null;
  const to = toISO ? new Date(toISO) : null;

  const filtered = sessions.filter(s => {
    const d = new Date(s.session_date);
    return (!from || d >= from) && (!to || d <= to);
  });

  const map = new Map();
  for (const s of filtered) {
    const key = s.typology ?? (s.drill_name ? "Drill" : (s.is_match ? "Match" : "Other"));
    map.set(key, (map.get(key) ?? 0) + effectiveTL(s));
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
  return [...map.entries()].map(([typology, load_sum]) => ({
    typology,
    load_sum,
    pct: (load_sum / total) * 100
  }));
}

// =========================
// COMPONENT
// =========================

const CaricoVolumi = ({ data, players, sessionsByPlayer }) => {
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

  // 1. Distanza totale per sessione/partita (trend nel tempo)
  const distanceTrendData = useMemo(() => {
    if (!data.length) return [];
    return buildDistanceTrend(data);
  }, [data]);

  // 2. Distanza equivalente vs reale
  const equivalentDistanceData = useMemo(() => {
    if (!data.length) return [];
    return buildEqVsReal(data);
  }, [data]);

  // 3. Training load settimanale
  const weeklyLoadData = useMemo(() => {
    if (!data.length) return [];
    return buildWeeklyLoad(data);
  }, [data]);

  // 4. ACWR per giocatore - USANDO LA LOGICA DELLA PAGINA ANALYTICS NORMALE
  const acwrData = useMemo(() => {
    if (!data.length || !players.length) return [];
    
    console.log('🔍 Debug ACWR - Dati ricevuti:', {
      totale_sessioni: data.length,
      totale_giocatori: players.length,
      primi_3_sessioni: data.slice(0, 3).map(s => ({
        id: s.id,
        playerId: s.playerId,
        session_date: s.session_date,
        training_load: s.training_load,
        equivalent_distance_m: s.equivalent_distance_m,
        total_distance_m: s.total_distance_m
      }))
    });
    
    // 🎯 LOGICA ACWR DELLA PAGINA ANALYTICS NORMALE
    const now = new Date();
    const result = players.slice(0, 8).map(player => {
      // Filtra sessioni per questo giocatore
      const playerSessions = data.filter(s => s.playerId === player.id);
      
      if (playerSessions.length === 0) {
        return {
          player: `${player.firstName} ${player.lastName}`,
          acwr: null,
          acuteLoad: null,
          chronicLoad: null,
          status: 'no-data'
        };
      }

      // Calcola ACWR (7-day acute / 28-day chronic) su TUTTI i dati
      const last7Days = playerSessions.filter(s => {
        const sessionDate = new Date(s.session_date);
        const days7Ago = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        return sessionDate >= days7Ago;
      });

      const last28Days = playerSessions.filter(s => {
        const sessionDate = new Date(s.session_date);
        const days28Ago = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
        return sessionDate >= days28Ago;
      });

      // Usa player_load se disponibile, altrimenti training_load, altrimenti proxy
      const acuteLoad = last7Days.reduce((acc, s) => acc + (s.player_load || s.training_load || s.equivalent_distance_m || s.total_distance_m || 0), 0);
      const chronicLoad = last28Days.reduce((acc, s) => acc + (s.player_load || s.training_load || s.equivalent_distance_m || s.total_distance_m || 0), 0) / 4; // media settimanale
      
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
      // Determina status
      let status = 'normal'; // 0.8 - 1.3 = verde
      if (acwr < 0.7 || acwr > 1.5) {
        status = 'overload'; // Alto rischio
      } else if (acwr < 0.8 || acwr > 1.3) {
        status = 'underload'; // Attenzione
      }

      console.log(`🔍 Debug ACWR - Giocatore ${player.firstName} ${player.lastName}:`, {
        playerId: player.id,
        sessioni_totali: playerSessions.length,
        sessioni_7d: last7Days.length,
        sessioni_28d: last28Days.length,
        acuteLoad,
        chronicLoad,
        acwr: acwr.toFixed(2),
        status
      });

      return {
        player: `${player.firstName} ${player.lastName}`,
        acwr: acwr > 0 ? acwr : null,
        acuteLoad: acuteLoad > 0 ? acuteLoad : null,
        chronicLoad: chronicLoad > 0 ? chronicLoad : null,
        status
      };
    });
    
    console.log('🔍 Debug ACWR - Risultato finale:', {
      totale_risultati: result.length,
      risultati: result.map(r => ({
        player: r.player,
        acwr: r.acwr,
        status: r.status
      }))
    });
    
    return result;
  }, [data, players]);

  // 5. Distribuzione carico per tipologia
  const loadDistributionData = useMemo(() => {
    if (!data.length) return [];
    return buildLoadByTypology(data);
  }, [data]);

  // =========================
  // CUSTOM TOOLTIP
  // =========================

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Data: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value !== null ? entry.value.toLocaleString() : '—'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // =========================
  // RENDER FUNCTIONS
  // =========================

  const renderDistanceTrendChart = () => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp size={20} />
          <h3>Distanza Totale per Sessione</h3>
        </div>
        <div className="chart-actions">
          <button className="btn-secondary">Esporta</button>
          <button className="btn-primary">Dettagli</button>
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
                dataKey="total_distance_m" 
                stroke={colors.primary} 
                strokeWidth={2}
                name="Distanza (m)"
                dot={false}
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
          <button className="btn-primary">Dettagli</button>
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
          <button className="btn-primary">Dettagli</button>
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
              <Bar dataKey="load_sum" fill={colors.primary} name="TL settimanale" />
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
          <button className="btn-primary">Dettagli</button>
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
              <Bar 
                dataKey="acwr" 
                fill="#000000"
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
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.success }}></div>
          <span>Normale (0.8-1.3)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.warning }}></div>
          <span>Sottocarico (&lt;0.8)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colors.danger }}></div>
          <span>Sovraccarico (&gt;1.3)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#9ca3af' }}></div>
          <span>Dati insufficienti</span>
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
          <button className="btn-primary">Dettagli</button>
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
                label={({ typology, pct }) => `${typology} ${pct.toFixed(1)}%`}
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
  // MAIN RENDER
  // =========================

  return (
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
};

export default CaricoVolumi;
