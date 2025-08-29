// client/src/components/analytics/ReportPreview.jsx
import React from "react";
import "@/styles/statistics.css";
import "@/styles/dashboard.css";

// Icone
import { AlertTriangle, Award, TrendingUp } from "lucide-react";

const ReportPreview = ({ teamStats = {}, topPlayers = [], alerts = [] }) => {
  return (
    <div className="dashboard-card" style={{ marginTop: "30px" }}>
      <div className="card-header">
        <h2>Anteprima Report</h2>
      </div>

      {/* KPI Squadra */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp /></div>
          <div className="stat-content">
            <h3>Distanza media</h3>
            <p className="stat-number">{teamStats.avgDistance || 0} m</p>
            <p className="stat-detail">per sessione</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><TrendingUp /></div>
          <div className="stat-content">
            <h3>Sprint totali</h3>
            <p className="stat-number">{teamStats.totalSprints || 0} m</p>
            <p className="stat-detail">ultimi 7 giorni</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Award /></div>
          <div className="stat-content">
            <h3>Top Speed record</h3>
            <p className="stat-number">{teamStats.maxSpeed || 0} km/h</p>
            <p className="stat-detail">stagione</p>
          </div>
        </div>
      </div>

      {/* Ranking Giocatori */}
      <div className="detail-card" style={{ marginTop: "30px" }}>
        <h3>Top 5 Giocatori — Distanza Totale</h3>
        <div className="detail-table">
                      <table className="table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Ruolo</th>
                <th>Distanza (m)</th>
                <th>Velocità Max (km/h)</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.length > 0 ? (
                topPlayers.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{i + 1}. {p.firstName} {p.lastName}</strong>
                    </td>
                    <td>{p.position}</td>
                    <td>{p.total_distance_m}</td>
                    <td>{p.top_speed_kmh}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Nessun dato disponibile</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Carichi */}
      {alerts.length > 0 && (
        <div className="mapping-warnings" style={{ marginTop: "30px" }}>
          <div className="warnings-icon"><AlertTriangle size={20} color="#D97706" /></div>
          <div className="warnings-content">
            <h4>Alert Carichi</h4>
            <ul>
              {alerts.map((a, idx) => (
                <li key={idx}>
                  {a.playerName}: {a.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
