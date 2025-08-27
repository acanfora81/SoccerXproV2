// client/src/components/analytics/Reports.jsx
import React, { useState } from "react";
import "@/styles/dashboard.css";
import "@/styles/statistics.css";

// Icone lucide
import { FileText, Calendar, Download, Users } from "lucide-react";

const Reports = ({ onGenerateWeekly, onGenerateMonthly }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (type) => {
    setLoading(true);
    try {
      if (type === "weekly" && onGenerateWeekly) {
        await onGenerateWeekly();
      } else if (type === "monthly" && onGenerateMonthly) {
        await onGenerateMonthly();
      }
    } catch (err) {
      console.error("Errore generazione report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Reports</h1>
        <p>Scarica i riepiloghi ufficiali settimanali e mensili della squadra</p>
      </div>

      <div className="dashboard-grid">
        {/* Report settimanale */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Report Settimanale</h2>
          </div>
          <p>
            Riepilogo di tutte le sessioni della settimana con KPI medi e
            anomalie.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => handleGenerate("weekly")}
            disabled={loading}
          >
            <Calendar size={18} />
            {loading ? "Generazione..." : "Genera Report"}
          </button>
        </div>

        {/* Report mensile */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Report Mensile</h2>
          </div>
          <p>
            Analisi completa delle performance mensili, confronti e ranking
            giocatori.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => handleGenerate("monthly")}
            disabled={loading}
          >
            <FileText size={18} />
            {loading ? "Generazione..." : "Genera Report"}
          </button>
        </div>

        {/* Export CSV/Excel */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Esporta Dati Grezzi</h2>
          </div>
          <p>
            Scarica tutte le sessioni in formato CSV/Excel per analisi esterne o
            condivisione con lo staff.
          </p>
          <button className="btn btn-secondary">
            <Download size={18} />
            Scarica CSV
          </button>
        </div>

        {/* Archivio */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Archivio Report</h2>
          </div>
          <p>
            Elenco degli ultimi report generati con possibilità di riapertura e
            condivisione.
          </p>
          <ul className="activity-list">
            <li className="activity-item">
              <div className="activity-icon">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-message">
                  Report Settimanale — 12/08/2025
                </p>
                <span className="activity-time">scaricato 2 volte</span>
              </div>
            </li>
            <li className="activity-item">
              <div className="activity-icon">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-message">
                  Report Mensile — Luglio 2025
                </p>
                <span className="activity-time">inviato allo staff</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
