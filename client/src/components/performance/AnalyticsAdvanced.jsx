// client/src/components/performance/AnalyticsAdvanced.jsx
// Modulo Analytics Avanzato per performance dei giocatori

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Clock, Zap } from 'lucide-react';

const AnalyticsAdvanced = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Simuliamo il caricamento dei dati
  useEffect(() => {
    // Simula una chiamata API per i dati analytics
    const loadAnalyticsData = () => {
      setTimeout(() => {
        setAnalyticsData({
          teamOverview: {
            totalSessions: 156,
            activePlayersCount: 24,
            avgPlayerLoad: 285.4,
            avgTopSpeed: 28.7,
            avgDistance: 8420
          },
          topPerformers: [
            { name: "Marco Verratti", playerLoad: 342, topSpeed: 31.2, distance: 9400 },
            { name: "Federico Chiesa", playerLoad: 338, topSpeed: 32.8, distance: 9200 },
            { name: "Nicolo Barella", playerLoad: 335, topSpeed: 30.5, distance: 8950 }
          ],
          sessionBreakdown: [
            { type: "Allenamento", count: 89, avgLoad: 275 },
            { type: "Partita", count: 34, avgLoad: 320 },
            { type: "Preparazione", count: 33, avgLoad: 245 }
          ]
        });
        setIsLoading(false);
      }, 1000);
    };

    loadAnalyticsData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "#3B82F6" }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
        {subtitle && <span className="stat-trend">{subtitle}</span>}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">
          <BarChart3 size={48} />
          <p>Caricamento Analytics Avanzato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-advanced">
      <div className="analytics-header">
        <h1>Analytics Avanzato Performance</h1>
        <p>Analisi dettagliata delle performance del team</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard 
          icon={Users} 
          title="Giocatori Attivi" 
          value={analyticsData.teamOverview.activePlayersCount}
          subtitle="Nelle ultime 4 settimane"
        />
        <StatCard 
          icon={Activity} 
          title="Player Load Medio" 
          value={`${analyticsData.teamOverview.avgPlayerLoad}`}
          subtitle="Carico di lavoro"
          color="#10B981"
        />
        <StatCard 
          icon={Zap} 
          title="Velocità Top Media" 
          value={`${analyticsData.teamOverview.avgTopSpeed} km/h`}
          subtitle="Picco di velocità"
          color="#F59E0B"
        />
        <StatCard 
          icon={Clock} 
          title="Distanza Media" 
          value={`${(analyticsData.teamOverview.avgDistance / 1000).toFixed(1)} km`}
          subtitle="Per sessione"
          color="#EF4444"
        />
      </div>

      {/* Main Content Grid */}
      <div className="analytics-grid">
        {/* Top Performers */}
        <div className="analytics-card">
          <div className="card-header">
            <h2>Top Performers</h2>
            <TrendingUp size={20} />
          </div>
          <div className="performers-list">
            {analyticsData.topPerformers.map((player, index) => (
              <div key={index} className="performer-item">
                <div className="performer-rank">#{index + 1}</div>
                <div className="performer-info">
                  <h4>{player.name}</h4>
                  <div className="performer-stats">
                    <span>Load: {player.playerLoad}</span>
                    <span>Speed: {player.topSpeed} km/h</span>
                    <span>Distance: {(player.distance / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Breakdown */}
        <div className="analytics-card">
          <div className="card-header">
            <h2>Breakdown Sessioni</h2>
            <BarChart3 size={20} />
          </div>
          <div className="session-breakdown">
            {analyticsData.sessionBreakdown.map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-info">
                  <h4>{session.type}</h4>
                  <p>{session.count} sessioni</p>
                </div>
                <div className="session-stats">
                  <div className="session-bar">
                    <div 
                      className="session-fill" 
                      style={{ 
                        width: `${(session.count / 156) * 100}%`,
                        backgroundColor: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B'
                      }}
                    ></div>
                  </div>
                  <span>Load medio: {session.avgLoad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="analytics-card full-width">
          <div className="card-header">
            <h2>Trend Performance</h2>
            <Activity size={20} />
          </div>
          <div className="trends-placeholder">
            <div className="trend-chart">
              <p>📊 Grafico trend performance</p>
              <p>In questa sezione verranno visualizzati i grafici delle performance nel tempo</p>
              <div className="chart-placeholder">
                <BarChart3 size={64} style={{ opacity: 0.3 }} />
                <p>Grafico in sviluppo - Integrazione con Recharts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdvanced;