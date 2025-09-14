// client/src/pages/contracts/ContractsDashboard.jsx
// Dashboard contratti con statistiche, grafici e tabelle

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Euro, 
  BarChart3, 
  PieChart, 
  Table,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/http';
import PageLoader from '../../components/ui/PageLoader';
import ContractKPICards from '../../components/contracts/dashboard/ContractKPICards';
import ContractCharts from '../../components/contracts/dashboard/ContractCharts';
import ContractTables from '../../components/contracts/dashboard/ContractTables';
import ContractTimeline from '../../components/contracts/dashboard/ContractTimeline';
import '../../styles/contracts-dashboard.css';

const ContractsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    trends: [],
    distributions: {},
    expiring: [],
    topPlayers: [],
    timeline: [],
    monthlyExpenses: []
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  // Carica dati dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usa il nuovo endpoint ottimizzato che carica tutti i dati in una singola chiamata
      const response = await apiFetch('/api/contracts/dashboard/all');
      
      if (!response.ok) {
        throw new Error(`Errore caricamento dashboard: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Errore nel caricamento dei dati');
      }

      // I dati sono già strutturati correttamente dal backend
      setDashboardData({
        kpis: data.data.kpis || {},
        trends: data.data.trends || [],
        distributions: data.data.distributions || {},
        expiring: data.data.expiring || [],
        topPlayers: data.data.topPlayers || [],
        timeline: data.data.expiring || [], // Riutilizziamo i dati expiring per la timeline
        monthlyExpenses: data.data.monthlyExpenses || []
      });

      setLastUpdated(new Date());

    } catch (err) {
      console.error('❌ Errore caricamento dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carica dati al mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh manuale
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return <PageLoader message="Caricamento dashboard contratti..." minHeight={360} />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Contratti</h1>
        </div>
        <div className="error-container">
          <AlertTriangle size={48} className="error-icon" />
          <h3>Errore nel caricamento</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            <RefreshCw size={16} />
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <BarChart3 size={32} />
            <h1>Dashboard Contratti</h1>
          </div>
          <div className="header-actions">
            <div className="last-updated">
              {lastUpdated && (
                <span>
                  <CheckCircle size={16} />
                  Aggiornato: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button 
              onClick={handleRefresh} 
              className="btn btn-secondary refresh-btn"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <TrendingUp size={24} />
          Metriche Principali
        </h2>
        <ContractKPICards data={dashboardData.kpis} />
      </div>

      {/* Grafici */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <PieChart size={24} />
          Analisi e Trend
        </h2>
        <ContractCharts 
          trends={dashboardData.trends}
          distributions={dashboardData.distributions}
          topPlayers={dashboardData.topPlayers}
          monthlyExpenses={dashboardData.monthlyExpenses}
        />
      </div>

      {/* Tabelle */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <Table size={24} />
          Dettagli e Monitoraggio
        </h2>
        <ContractTables 
          expiring={dashboardData.expiring}
          topPlayers={dashboardData.topPlayers}
        />
      </div>

      {/* Timeline Scadenze */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <Calendar size={24} />
          Timeline Scadenze
        </h2>
        <ContractTimeline data={dashboardData.timeline} />
      </div>
    </div>
  );
};

export default ContractsDashboard;
