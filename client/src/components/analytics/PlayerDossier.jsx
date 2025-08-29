// client/src/components/analytics/PlayerDossier.jsx
// 🎯 PLAYER DOSSIER PROFESSIONALE - Analisi completa individuale (styled to project CSS)

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Calendar, BarChart3, Download, Info, Award, Zap,
  Activity, Target, Heart, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';

import '../../styles/analytics.css';

// 🗣️ Funzione per tradurre le posizioni
const translatePosition = (position) => {
  const translations = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore', 
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return translations[position] || position;
};

const PlayerDossier = ({
  player,
  sessions = [],
  allSessions = [],
  onBack
}) => {
  const [timeRange, setTimeRange] = useState('all'); // 7d, 14d, 30d, 90d, all
  const [chartType, setChartType] = useState('line'); // line, bar, area

  // --- Helpers UI ---
const periodLabel =
  timeRange === 'all' ? 'Tutte le sessioni' :
  timeRange === '7d' ? 'Ultimi 7 giorni' :
  timeRange === '14d' ? 'Ultimi 14 giorni' :
  timeRange === '30d' ? 'Ultimi 30 giorni' :
  timeRange === '90d' ? 'Ultimi 90 giorni' : 'Ultimi 365 giorni';

// Nel file PlayerDossier.jsx - SOSTITUISCI il useMemo filteredSessions con questo:

const filteredSessions = useMemo(() => {
  const base = (allSessions && allSessions.length) ? allSessions : sessions;
  if (!base || !base.length) return [];

  // 🔧 FIX: Gestione corretta per "all"
  if (timeRange === 'all') {
    // Per "all" NON filtrare per data - mostra TUTTO
    console.log('🟢 PlayerDossier filtro "all" - mostrando tutte le sessioni:', base.length);
    return base.slice().sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
  } else {
    // Solo per filtri specifici applica limitazione di giorni
    let daysBack;
    if (timeRange === '7d') daysBack = 7;
    else if (timeRange === '14d') daysBack = 14;
    else if (timeRange === '30d') daysBack = 30;
    else if (timeRange === '90d') daysBack = 90;
    else daysBack = 30; // fallback

    const now = new Date();
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    console.log(`🔵 PlayerDossier filtro ${timeRange} - cutoff: ${cutoff.toLocaleDateString()}`);

    const filtered = base.filter(s => new Date(s.session_date) >= cutoff);
    return filtered.slice().sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
  }
}, [sessions, allSessions, timeRange]);


  // --- Calcoli avanzati + dati grafici ---
  const analytics = useMemo(() => {
    
    if (!filteredSessions.length) {
      return {
        kpis: {},
        acwr: { acwr: '0.00', acwrStatus: 'green', acuteLoad: 0, chronicLoad: 0, monotonia: '0.00', strain: 0 },
        chartData: [],
        alerts: []
      };
    }

    // KPI base
    const kpis = {
      // ================= CAMPI ESISTENTI =================
      totalSessions: filteredSessions.length,
      totalDistance: filteredSessions.reduce((a, s) => a + (s.total_distance_m || 0), 0),
      avgDistance: Math.round(filteredSessions.reduce((a, s) => a + (s.total_distance_m || 0), 0) / filteredSessions.length),
      totalPlayerLoad: filteredSessions.reduce((a, s) => a + (s.player_load || 0), 0),
      avgPlayerLoad: Math.round(filteredSessions.reduce((a, s) => a + (s.player_load || 0), 0) / filteredSessions.length),
      maxSpeed: Math.max(...filteredSessions.map(s => s.top_speed_kmh || 0), 0),
      avgTopSpeed: Math.round((filteredSessions.reduce((a, s) => a + (s.top_speed_kmh || 0), 0) / filteredSessions.length) * 10) / 10,
      avgSpeed: Math.round((filteredSessions.reduce((a, s) => a + (s.avg_speed_kmh || 0), 0) / filteredSessions.length) * 10) / 10,
      totalSprintDistance: filteredSessions.reduce((a, s) => a + (s.sprint_distance_m || 0), 0),
      avgSprintDistance: Math.round(filteredSessions.reduce((a, s) => a + (s.sprint_distance_m || 0), 0) / filteredSessions.length),
      totalHSR: filteredSessions.reduce((a, s) => a + (s.hsr_distance_m || 0), 0),
      avgHSR: Math.round(filteredSessions.reduce((a, s) => a + (s.hsr_distance_m || 0), 0) / filteredSessions.length),
      totalHIRuns: filteredSessions.reduce((a, s) => a + (s.high_intensity_runs || 0), 0),
      avgHIRuns: Math.round(filteredSessions.reduce((a, s) => a + (s.high_intensity_runs || 0), 0) / filteredSessions.length),
      maxHeartRate: Math.max(...filteredSessions.map(s => s.max_heart_rate || 0), 0),
      avgMaxHR: Math.round(filteredSessions.reduce((a, s) => a + (s.max_heart_rate || 0), 0) / filteredSessions.length),
      avgHeartRate: Math.round(filteredSessions.reduce((a, s) => a + (s.avg_heart_rate || 0), 0) / filteredSessions.length),
      trainingCount: filteredSessions.filter(s => s.session_type === 'Training').length,
      matchCount: filteredSessions.filter(s => s.session_type === 'Match').length,
      
      // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
      avgEquivalentDistance: Math.round(filteredSessions.reduce((a, s) => a + (s.equivalent_distance_m || 0), 0) / filteredSessions.length),
      avgDistancePerMin: Math.round((filteredSessions.reduce((a, s) => a + (s.distance_per_min || 0), 0) / filteredSessions.length) * 10) / 10,
      totalDistanceOver15kmh: filteredSessions.reduce((a, s) => a + (s.distance_over_15_kmh_m || 0), 0),
      totalDistanceOver20kmh: filteredSessions.reduce((a, s) => a + (s.distance_over_20_kmh_m || 0), 0),
      totalDistanceOver25kmh: filteredSessions.reduce((a, s) => a + (s.distance_over_25_kmh_m || 0), 0),
      
      // ================= NUOVI CAMPI - POTENZA METABOLICA =================
      avgMetabolicPower: Math.round((filteredSessions.reduce((a, s) => a + (s.avg_metabolic_power_wkg || 0), 0) / filteredSessions.length) * 10) / 10,
      totalDistanceOver20wkg: filteredSessions.reduce((a, s) => a + (s.distance_over_20wkg_m || 0), 0),
      totalDistanceOver35wkg: filteredSessions.reduce((a, s) => a + (s.distance_over_35wkg_m || 0), 0),
      maxPower5s: Math.max(...filteredSessions.map(s => s.max_power_5s_wkg || 0), 0),
      
      // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
      totalAccDistanceOver2ms2: filteredSessions.reduce((a, s) => a + (s.distance_acc_over_2_ms2_m || 0), 0),
      totalDecDistanceOver2ms2: filteredSessions.reduce((a, s) => a + (s.distance_dec_over_minus2_ms2_m || 0), 0),
      avgAccEventsPerMin: Math.round((filteredSessions.reduce((a, s) => a + (s.acc_events_per_min_over_2_ms2 || 0), 0) / filteredSessions.length) * 10) / 10,
      avgDecEventsPerMin: Math.round((filteredSessions.reduce((a, s) => a + (s.dec_events_per_min_over_minus2_ms2 || 0), 0) / filteredSessions.length) * 10) / 10,
      
      // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
      avgTimeUnder5wkg: Math.round(filteredSessions.reduce((a, s) => a + (s.time_under_5wkg_min || 0), 0) / filteredSessions.length),
      avgTime5to10wkg: Math.round(filteredSessions.reduce((a, s) => a + (s.time_5_10_wkg_min || 0), 0) / filteredSessions.length),
      
      // ================= NUOVI CAMPI - INDICI E PROFILI =================
      avgRvpIndex: Math.round((filteredSessions.reduce((a, s) => a + (s.rvp_index || 0), 0) / filteredSessions.length) * 10) / 10,
    };

    // ACWR su tutte le sessioni del giocatore (7d / 28d)
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const acute7 = allSessions.filter(s => new Date(s.session_date) >= d7);
    const chronic28 = allSessions.filter(s => new Date(s.session_date) >= d28);

    const acuteLoad = acute7.reduce((a, s) => a + (s.player_load || 0), 0);
    const chronicLoad = chronic28.reduce((a, s) => a + (s.player_load || 0), 0) / 4; // media settimanale
    const acwrVal = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

    let acwrStatus = 'green';
    if (acwrVal < 0.7 || acwrVal > 1.5) acwrStatus = 'red';
    else if (acwrVal < 0.8 || acwrVal > 1.3) acwrStatus = 'yellow';

    // Monotonia & Strain (Foster)
    const dailyLoads = filteredSessions.map(s => s.player_load || 0);
    const avgLoad = dailyLoads.reduce((a, b) => a + b, 0) / dailyLoads.length;
    const stdDev = Math.sqrt(dailyLoads.reduce((acc, load) => acc + Math.pow(load - avgLoad, 2), 0) / dailyLoads.length);
    const monotonia = avgLoad > 0 ? stdDev / avgLoad : 0;
    const strain = avgLoad * monotonia;

    const acwr = {
      acwr: acwrVal.toFixed(2),
      acwrStatus,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      monotonia: monotonia.toFixed(2),
      strain: Math.round(strain)
    };

    // ✅ Dati grafici: tutto NUMBER, niente stringhe da toFixed
    const chartData = filteredSessions.map(s => {
      // ================= CAMPI ESISTENTI =================
      const totalDistance = Number(s.total_distance_m ?? 0);
      const sprintDistance = Number(s.sprint_distance_m ?? 0);
      const hsrDistance = Number(s.hsr_distance_m ?? 0);
      const playerLoad = Number(s.player_load ?? 0);
      const topSpeed = Number(s.top_speed_kmh ?? 0);
      const avgSpeed = Number(s.avg_speed_kmh ?? 0);
      const maxHeartRate = Number(s.max_heart_rate ?? 0);
      const avgHeartRate = Number(s.avg_heart_rate ?? 0);
      const highIntensityRuns = Number(s.high_intensity_runs ?? 0);
      const duration = Number(s.duration_minutes ?? 0);

      // ================= NUOVI CAMPI =================
      const equivalentDistance = Number(s.equivalent_distance_m ?? 0);
      const distancePerMin = Number(s.distance_per_min ?? 0);
      const distanceOver15kmh = Number(s.distance_over_15_kmh_m ?? 0);
      const distanceOver20kmh = Number(s.distance_over_20_kmh_m ?? 0);
      const distanceOver25kmh = Number(s.distance_over_25_kmh_m ?? 0);
      const avgMetabolicPower = Number(s.avg_metabolic_power_wkg ?? 0);
      const distanceOver20wkg = Number(s.distance_over_20wkg_m ?? 0);
      const distanceOver35wkg = Number(s.distance_over_35wkg_m ?? 0);
      const maxPower5s = Number(s.max_power_5s_wkg ?? 0);
      const accDistanceOver2ms2 = Number(s.distance_acc_over_2_ms2_m ?? 0);
      const decDistanceOver2ms2 = Number(s.distance_dec_over_minus2_ms2_m ?? 0);
      const accEventsPerMin = Number(s.acc_events_per_min_over_2_ms2 ?? 0);
      const decEventsPerMin = Number(s.dec_events_per_min_over_minus2_ms2 ?? 0);
      const timeUnder5wkg = Number(s.time_under_5wkg_min ?? 0);
      const time5to10wkg = Number(s.time_5_10_wkg_min ?? 0);
      const rvpIndex = Number(s.rvp_index ?? 0);

      const intensityRatio = totalDistance > 0 ? (sprintDistance / totalDistance) * 100 : 0;
      const loadPerMinute = duration > 0 ? playerLoad / duration : 0;
      const avgSpeedDuringSession = duration > 0 ? (totalDistance / 1000) / (duration / 60) : 0;

      return {
        date: new Date(s.session_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: s.session_date,
        sessionType: s.session_type || 'Sessione',
        
        // ================= CAMPI ESISTENTI =================
        totalDistance,
        sprintDistance,
        hsrDistance,
        playerLoad,
        topSpeed,
        avgSpeed,
        maxHeartRate: maxHeartRate > 0 ? maxHeartRate : null,
        avgHeartRate: avgHeartRate > 0 ? avgHeartRate : null,
        highIntensityRuns,
        duration,
        
        // ================= NUOVI CAMPI =================
        equivalentDistance,
        distancePerMin,
        distanceOver15kmh,
        distanceOver20kmh,
        distanceOver25kmh,
        avgMetabolicPower,
        distanceOver20wkg,
        distanceOver35wkg,
        maxPower5s,
        accDistanceOver2ms2,
        decDistanceOver2ms2,
        accEventsPerMin,
        decEventsPerMin,
        timeUnder5wkg,
        time5to10wkg,
        rvpIndex,
        
        // ================= CALCOLI DERIVATI =================
        intensityRatio: Number(intensityRatio.toFixed(1)),
        loadPerMinute: Number(loadPerMinute.toFixed(1)),
        avgSpeedDuringSession: Number(avgSpeedDuringSession.toFixed(1)),
      };
    }); // ← QUESTA PARENTESI CHIUDE IL MAP E MANCAVA!!!
    
    // Alerts
    const alerts = [];
    if (acwrStatus === 'red') alerts.push({ type: 'danger', title: 'ACWR Critico', message: `Valore ${acwr.acwr}` });
    else if (acwrStatus === 'yellow') alerts.push({ type: 'warning', title: 'ACWR Attenzione', message: `Valore ${acwr.acwr}` });
    if (parseFloat(acwr.monotonia) > 2) alerts.push({ type: 'warning', title: 'Monotonia Elevata', message: `Variare intensità allenamenti` });

    // Trend carico (ultime 3 vs precedenti 3)
    if (chartData.length >= 6) {
      const recent = chartData.slice(-3);
      const prev = chartData.slice(-6, -3);
      const rAvg = recent.reduce((a, s) => a + s.playerLoad, 0) / 3;
      const pAvg = prev.reduce((a, s) => a + s.playerLoad, 0) / 3;
      if (pAvg > 0 && rAvg > pAvg * 1.3) {
        alerts.push({ type: 'info', title: 'Carico in Aumento', message: `+${(((rAvg - pAvg) / pAvg) * 100).toFixed(1)}%` });
      }
    }

    // PB velocità (periodo vs all-time)
    if (kpis.maxSpeed > 0) {
      const allTimeMax = Math.max(...allSessions.map(s => s.top_speed_kmh || 0), 0);
      if (kpis.maxSpeed >= allTimeMax * 0.95) {
        alerts.push({ type: 'success', title: 'Performance Eccellente', message: `Velocità max ${kpis.maxSpeed} km/h` });
      }
    }

    return { kpis, acwr, chartData, alerts };
  }, [filteredSessions, allSessions]);

  // ✅ Flag: c'è almeno un dato?
  const hasData = analytics.chartData && analytics.chartData.length > 0;
  const hasHeartRateData = hasData && analytics.chartData.some(item => 
    item.maxHeartRate > 0 || item.avgHeartRate > 0
  );

  // ✅ Tooltip robusto: numerifica i valori ed evita null
  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    // Trova il dato corrispondente alla label (data)
    const dataItem = analytics.chartData.find(item => item.date === label);
    if (!dataItem) return null;

    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          <strong>{label}</strong>
          <span className={`session-type ${dataItem.sessionType?.toLowerCase?.() || ''}`}>
            {dataItem.sessionType || 'Sessione'}
          </span>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => {
            if (!entry || entry.value === undefined || entry.value === null) return null;
            
            const value = Number(entry.value);
            return (
              <div key={index} className="tooltip-line">
                <div className="tooltip-color" style={{ backgroundColor: entry.color || '#999' }} />
                <span className="tooltip-label">{entry.name}:</span>
                <span className="tooltip-value">
                  {isNaN(value) ? 'N/D' : value.toLocaleString()}
                </span>
              </div>
            );
          })}
          {dataItem.duration > 0 && (
            <div className="tooltip-extra">
              <small>Durata: {dataItem.duration} min</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Export CSV (si integra con i pulsanti quick-filters) ---
  const handleExport = () => {
    const rows = analytics.chartData;
    const headers = [
      'date','sessionType','totalDistance','sprintDistance','hsrDistance','playerLoad',
      'topSpeed','avgSpeed','maxHeartRate','avgHeartRate','highIntensityRuns',
      'duration','intensityRatio','loadPerMinute','avgSpeedDuringSession'
    ];
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fullName = `${player?.firstName || 'Player'}_${player?.lastName || ''}`.trim().replace(/\s+/g, '');
    a.download = `player_dossier_${fullName}_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!player) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <h3>Nessun giocatore selezionato</h3>
          <button className="btn btn-primary" onClick={onBack}>
            <ArrowLeft size={16} /> Torna indietro
          </button>
        </div>
      </div>
    );
  }

  const capMeta = allSessions && allSessions._meta ? allSessions._meta : null;

  return (
    <div className="analytics-container">
      {/* HEADER */}
      <div className="analytics-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div>
            <h1 style={{margin:0}}>{player.firstName} {player.lastName}</h1>
                         <p className="analytics-subtitle" style={{margin:0}}>
               {translatePosition(player.position)} • #{player.shirtNumber || '-'} • {[timeRange]} • {filteredSessions.length} sessioni
             </p>
          </div>
          <div className="player-avatar" aria-hidden>
            {player.firstName?.[0]}{player.lastName?.[0]}
          </div>
        </div>
        <div>
          <button className="btn btn--ghost back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Lista Giocatori
          </button>
        </div>
      </div>

      {/* FILTRI (rispetta analytics-filters + filter-group + quick-filter-btn) */}
      <div className="analytics-filters">
        <div className="filter-group">
          <Calendar size={16} />
          <span className="filter-label">Periodo Analisi</span>
          <div className="chart-controls">
            {['7d','14d','30d','90d','all'].map(v => (
              <button
                key={v}
                className={`quick-filter-btn ${timeRange === v ? 'active' : ''}`}
                onClick={() => setTimeRange(v)}
              >
                {v === '7d' ? '7 giorni'
                  : v === '14d' ? '14 giorni'
                  : v === '30d' ? '30 giorni'
                  : v === '90d' ? '90 giorni' : 'Tutto'}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <BarChart3 size={16} />
          <span className="filter-label">Tipo Grafico</span>
          <div className="chart-controls">
            {['line','bar','area'].map(v => (
              <button
                key={v}
                className={`quick-filter-btn ${chartType === v ? 'active' : ''}`}
                onClick={() => setChartType(v)}
              >
                {v === 'line' ? 'Linea' : v === 'bar' ? 'Barre' : 'Area'}
              </button>
            ))}
          </div>
        </div>

        <div className="quick-filters" style={{ marginLeft: 'auto' }}>
          <button className="quick-filter-btn" onClick={handleExport}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ALERTS (usa mapping-warnings già stylata) */}
      {capMeta && capMeta.capped && (
        <div className="mapping-warnings section-spacing">
          <Info size={20} />
          <div className="warnings-content">
            <h4>Avviso dati limitati</h4>
            <ul>
              <li>
                Mostrate {capMeta.capLimit} sessioni su {capMeta.total}. Riduci il periodo o esporta i dati.
              </li>
            </ul>
          </div>
        </div>
      )}
      {analytics.alerts.length > 0 && (
        <div className="mapping-warnings section-spacing">
          <Info size={20} />
          <div className="warnings-content">
            <h4>Alert Giocatore ({analytics.alerts.length})</h4>
            <ul>
              {analytics.alerts.map((a, i) => (
                <li key={i} className={`alert-${a.type}`}>
                  <strong>{a.title}:</strong> {a.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KPI OVERVIEW (kpi-overview + kpi-card) */}
      <div className="kpi-overview section-spacing">
        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Target /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Distanza Media</div>
            <div className="kpi-value">{(analytics.kpis.avgDistance || 0).toLocaleString()} <span className="kpi-unit">m</span></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">{(analytics.kpis.totalDistance || 0).toLocaleString()} m totali</span>
            <span className="kpi-period">{periodLabel}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Zap /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Player Load Medio</div>
            <div className="kpi-value">{analytics.kpis.avgPlayerLoad || 0}</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">{analytics.kpis.totalPlayerLoad || 0} totale</span>
            <span className="kpi-period">{periodLabel}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Activity /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Velocità Massima</div>
            <div className="kpi-value">{analytics.kpis.maxSpeed || 0} <span className="kpi-unit">km/h</span></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">{analytics.kpis.avgTopSpeed || 0} km/h media</span>
            <span className="kpi-period">{periodLabel}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Award /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">ACWR</div>
            <div className="kpi-value">
              {analytics.acwr.acwr}
              <span className="kpi-unit"> ({analytics.acwr.acwrStatus})</span>
            </div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">Monotonia {analytics.acwr.monotonia} • Strain {analytics.acwr.strain.toLocaleString()}</span>
            <span className="kpi-period">Acute {analytics.acwr.acuteLoad} • Chronic {analytics.acwr.chronicLoad}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Heart /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">FC Massima</div>
            <div className="kpi-value">{analytics.kpis.maxHeartRate || 0} <span className="kpi-unit">bpm</span></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">{analytics.kpis.avgHeartRate || 0} bpm media</span>
            <span className="kpi-period">{periodLabel}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon"><Clock /></div>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Sprint Medio</div>
            <div className="kpi-value">{(analytics.kpis.avgSprintDistance || 0).toLocaleString()} <span className="kpi-unit">m</span></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-comparison">{(analytics.kpis.totalSprintDistance || 0).toLocaleString()} m totali</span>
            <span className="kpi-period">{periodLabel}</span>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-section">
        {/* Distanze & Player Load */}
        <div className="card chart-card chart-spacing">
          <div className="chart-header">
            <h4 className="chart-title">📏 Distanze e Player Load</h4>
            <Info size={16} title="Evoluzione dei carichi" />
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato disponibile
                </div>
              ) : (
                chartType === 'line' ? (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="distance" orientation="left" />
                    <YAxis yAxisId="load" orientation="right" />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line yAxisId="distance" type="monotone" dataKey="totalDistance" stroke="#3B82F6" strokeWidth={2} name="Distanza (m)" />
                    <Line yAxisId="distance" type="monotone" dataKey="sprintDistance" stroke="#10B981" strokeWidth={2} name="Sprint (m)" />
                    <Line yAxisId="load" type="monotone" dataKey="playerLoad" stroke="#F59E0B" strokeWidth={3} name="Player Load" />
                  </LineChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Bar dataKey="totalDistance" fill="#3B82F6" name="Distanza (m)" />
                    <Bar dataKey="playerLoad" fill="#F59E0B" name="Player Load" />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="totalDistance" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Distanza (m)" />
                    <Area type="monotone" dataKey="sprintDistance" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Sprint (m)" />
                  </AreaChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocità & Intensità */}
        <div className="card chart-card chart-spacing">
          <div className="chart-header">
            <h4 className="chart-title">⚡ Velocità e Intensità</h4>
            <Info size={16} title="Performance di velocità nel tempo" />
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato disponibile
                </div>
              ) : (
                chartType === 'line' ? (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="speed" orientation="left" />
                    <YAxis yAxisId="runs" orientation="right" />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line yAxisId="speed" type="monotone" dataKey="topSpeed" stroke="#EF4444" strokeWidth={3} name="Velocità Max (km/h)" />
                    <Line yAxisId="speed" type="monotone" dataKey="avgSpeed" stroke="#F59E0B" strokeWidth={2} name="Velocità Media (km/h)" />
                    <Line yAxisId="runs" type="monotone" dataKey="highIntensityRuns" stroke="#8B5CF6" strokeWidth={2} name="Corse HI" />
                  </LineChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Bar dataKey="topSpeed" fill="#EF4444" name="Velocità Max (km/h)" />
                    <Bar dataKey="highIntensityRuns" fill="#8B5CF6" name="Corse HI" />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="topSpeed" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Velocità Max (km/h)" />
                    <Area type="monotone" dataKey="avgSpeed" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} name="Velocità Media (km/h)" />
                  </AreaChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frequenza Cardiaca */}
        <div className="card chart-card">
          <div className="chart-header">
            <h4 className="chart-title">❤️ Frequenza Cardiaca</h4>
            <Info size={16} title="Monitoraggio cardiaco durante le sessioni" />
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasHeartRateData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato di frequenza cardiaca disponibile
                </div>
              ) : (
                chartType === 'line' ? (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="maxHeartRate" stroke="#DC2626" strokeWidth={3} name="FC Max (bpm)" />
                    <Line type="monotone" dataKey="avgHeartRate" stroke="#F87171" strokeWidth={2} name="FC Media (bpm)" />
                  </LineChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Bar dataKey="maxHeartRate" fill="#DC2626" name="FC Max (bpm)" />
                    <Bar dataKey="avgHeartRate" fill="#F87171" name="FC Media (bpm)" />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="maxHeartRate" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} name="FC Max (bpm)" />
                    <Area type="monotone" dataKey="avgHeartRate" stroke="#F87171" fill="#F87171" fillOpacity={0.4} name="FC Media (bpm)" />
                  </AreaChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Speed Running & HSR */}
        <div className="card chart-card">
          <div className="chart-header">
            <h4 className="chart-title">🚀 High Speed Running & HSR</h4>
            <Info size={16} title="Distanze ad alta intensità" />
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato disponibile
                </div>
              ) : (
                chartType === 'line' ? (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="hsr" orientation="left" />
                    <YAxis yAxisId="intensity" orientation="right" />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line yAxisId="hsr" type="monotone" dataKey="hsrDistance" stroke="#0EA5E9" strokeWidth={2} name="HSR (m)" />
                    <Line yAxisId="hsr" type="monotone" dataKey="sprintDistance" stroke="#10B981" strokeWidth={2} name="Sprint (m)" />
                    <Line yAxisId="intensity" type="monotone" dataKey="highIntensityRuns" stroke="#8B5CF6" strokeWidth={2} name="Corse HI" />
                  </LineChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Bar dataKey="hsrDistance" fill="#0EA5E9" name="HSR (m)" />
                    <Bar dataKey="sprintDistance" fill="#10B981" name="Sprint (m)" />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="hsrDistance" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.5} name="HSR (m)" />
                    <Area type="monotone" dataKey="sprintDistance" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.5} name="Sprint (m)" />
                  </AreaChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metriche derivate */}
        <div className="card chart-card">
          <div className="chart-header">
            <h4 className="chart-title">🧮 Metriche Derivate</h4>
            <Info size={16} title="Metriche calcolate per analisi avanzata" />

          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato disponibile
                </div>
              ) : (
                chartType === 'line' ? (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="ratio" orientation="left" />
                    <YAxis yAxisId="loadMin" orientation="right" />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line yAxisId="ratio" type="monotone" dataKey="intensityRatio" stroke="#8B5CF6" strokeWidth={2} name="Intensity Ratio (%)" />
                    <Line yAxisId="loadMin" type="monotone" dataKey="loadPerMinute" stroke="#F59E0B" strokeWidth={2} name="Load per Minuto" />
                    <Line yAxisId="loadMin" type="monotone" dataKey="avgSpeedDuringSession" stroke="#3B82F6" strokeWidth={2} name="Velocità Media (km/h)" />
                  </LineChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="ratio" orientation="left" />
                    <YAxis yAxisId="loadMin" orientation="right" />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Bar yAxisId="ratio" dataKey="intensityRatio" fill="#8B5CF6" name="Intensity Ratio (%)" />
                    <Bar yAxisId="loadMin" dataKey="loadPerMinute" fill="#F59E0B" name="Load per Minuto" />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Area type="monotone" dataKey="intensityRatio" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} name="Intensity Ratio (%)" />
                    <Area type="monotone" dataKey="loadPerMinute" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.5} name="Load per Minuto" />
                  </AreaChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlazione Player Load vs Distanza */}
        <div className="card chart-card">
          <div className="chart-header">
            <h4 className="chart-title">📊 Correlazione Player Load vs Distanza</h4>
            <Info size={16} title="Relazione tra carico e distanza percorsa" />
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              {!hasData ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:14,opacity:.7}}>
                  Nessun dato disponibile
                </div>
              ) : (
                <ScatterChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" dataKey="totalDistance" name="Distanza (m)" />
                  <YAxis type="number" dataKey="playerLoad" name="Player Load" />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Scatter name="Sessioni" data={analytics.chartData} fill="#3B82F6" />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SESSION DETAILS TABLE */}
      <div className="card chart-card table-spacing">
        <div className="chart-header">
          <h4 className="chart-title">📋 Dettaglio Sessioni</h4>
          <Info size={16} title="Tabella con tutte le metriche delle sessioni" />
        </div>
        <div className="table-container">
          {/* style locale minimal per pulizia tabella */}
          <style>
            {`
              .sx-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
              .sx-table thead th { position: sticky; top: 0; background: #fff; z-index: 1; }
              .sx-table th, .sx-table td { padding: 10px 12px; border-bottom: 1px solid #EEF2F7; }
              .sx-table th { color: #6B7280; font-weight: 600; text-align: center; }
              .sx-num { text-align: right; font-variant-numeric: tabular-nums; }
              .sx-type { text-transform: uppercase; font-size: 12px; letter-spacing: .3px; }
              .sx-row:nth-child(even) { background: #FAFCFF; }
              .sx-cell-badge { display:inline-block; padding:2px 8px; border-radius:12px; background:#F3F4F6; color:#374151; }
              .sx-cell-badge.match { background:#10B981; color:#FFFFFF; } /* Partita: verde */
              .sx-cell-badge.training { background:#E0F2FE; color:#0369A1; } /* Allenamento: blu delicato */
              .sx-foot { background:#F9FAFB; font-weight:600; }
              @media (max-width: 1200px) { .sx-hide-lg { display:none; } }
            `}
          </style>

          <table className="table sx-table">
            <thead>
              <tr>
                <th style={{width: '90px'}}>Data</th>
                <th style={{width: '100px'}}>Tipo</th>
                <th className="sx-num">Distanza</th>
                <th className="sx-num">Sprint</th>
                <th className="sx-num sx-hide-lg">HSR</th>
                <th className="sx-num">Load</th>
                <th className="sx-num">Vel. Max</th>
                <th className="sx-num">Vel. Media</th>
                <th className="sx-num sx-hide-lg">FC Max</th>
                <th className="sx-num sx-hide-lg">FC Media</th>
                <th className="sx-num">Corse HI</th>
                <th className="sx-num">Durata</th>
                <th className="sx-num sx-hide-lg">Pot. Met.</th>
                <th className="sx-num sx-hide-lg">D {'>'} 20km/h</th>
                <th className="sx-num sx-hide-lg">Acc {'>'} 2m/s²</th>
                <th className="sx-num sx-hide-lg">RVP</th>
              </tr>
            </thead>
            <tbody>
              {analytics.chartData.map((session, index) => (
                <tr key={index} className="sx-row">
                  <td>{session.date}</td>
                  <td>
                    <span className={`sx-cell-badge ${session.sessionType?.toLowerCase() === 'match' ? 'match' : 'training'}`}>
                      {session.sessionType || 'Sessione'}
                    </span>
                  </td>
                  <td className="sx-num">{session.totalDistance.toLocaleString()}&nbsp;m</td>
                  <td className="sx-num">{session.sprintDistance.toLocaleString()}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{session.hsrDistance.toLocaleString()}&nbsp;m</td>
                  <td className="sx-num">{Number(session.playerLoad).toLocaleString()}</td>
                  <td className="sx-num">{session.topSpeed}&nbsp;km/h</td>
                  <td className="sx-num">{session.avgSpeed}&nbsp;km/h</td>
                  <td className="sx-num sx-hide-lg">{session.maxHeartRate || '-'}</td>
                  <td className="sx-num sx-hide-lg">{session.avgHeartRate || '-'}</td>
                  <td className="sx-num">{session.highIntensityRuns}</td>
                  <td className="sx-num">{session.duration}&nbsp;min</td>
                  <td className="sx-num sx-hide-lg">{session.avgMetabolicPower ? session.avgMetabolicPower.toFixed(1) : '-'}&nbsp;W/kg</td>
                  <td className="sx-num sx-hide-lg">{session.distanceOver20kmh ? session.distanceOver20kmh.toLocaleString() : '-'}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{session.accDistanceOver2ms2 ? session.accDistanceOver2ms2.toLocaleString() : '-'}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{session.rvpIndex ? session.rvpIndex.toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
            {analytics.chartData.length > 0 && (
              <tfoot>
                <tr className="sx-foot">
                  <td colSpan={2}>Medie</td>
                  <td className="sx-num">{Math.round(analytics.kpis.avgDistance).toLocaleString()}&nbsp;m</td>
                  <td className="sx-num">{Math.round(analytics.kpis.avgSprintDistance).toLocaleString()}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{(analytics.kpis.totalHSR / analytics.chartData.length).toFixed(0)}&nbsp;m</td>
                  <td className="sx-num">{analytics.kpis.avgPlayerLoad}</td>
                  <td className="sx-num">{analytics.kpis.maxSpeed}</td>
                  <td className="sx-num">{analytics.kpis.avgTopSpeed}</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.maxHeartRate || '-'}</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.avgHeartRate || '-'}</td>
                  <td className="sx-num">-</td>
                  <td className="sx-num">-</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.avgMetabolicPower ? analytics.kpis.avgMetabolicPower.toFixed(1) : '-'}&nbsp;W/kg</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.totalDistanceOver20kmh ? analytics.kpis.totalDistanceOver20kmh.toLocaleString() : '-'}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.totalAccDistanceOver2ms2 ? analytics.kpis.totalAccDistanceOver2ms2.toLocaleString() : '-'}&nbsp;m</td>
                  <td className="sx-num sx-hide-lg">{analytics.kpis.avgRvpIndex ? analytics.kpis.avgRvpIndex.toFixed(1) : '-'}</td>
                </tr>
              </tfoot>
            )}
          </table>

          {!hasData && (
            <div className="table-empty-state">
              Nessuna sessione disponibile per il periodo selezionato
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDossier;