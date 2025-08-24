// client/src/components/dashboard/Dashboard.jsx
// Dashboard principale per SoccerXpro V2

import { Users, FileText, Activity, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

const Dashboard = () => {
  // Dati mock per la dashboard
  const stats = {
    totalPlayers: 28,
    activeContracts: 24,
    injuredPlayers: 3,
    contractsExpiring: 5,
    monthlyBudget: 250000,
    spentBudget: 180000
  };

  const recentActivity = [
    { id: 1, type: 'injury', message: 'Marco Verratti - Infortunio muscolare', time: '2 ore fa' },
    { id: 2, type: 'contract', message: 'Nuovo contratto firmato - Alessandro Bastoni', time: '1 giorno fa' },
    { id: 3, type: 'transfer', message: 'Offerta ricevuta per Federico Chiesa', time: '2 giorni fa' },
    { id: 4, type: 'medical', message: 'Visita medica completata - Nicolo Barella', time: '3 giorni fa' }
  ];

  const upcomingEvents = [
    { id: 1, title: 'Visite mediche di routine', date: '2025-08-25', type: 'medical' },
    { id: 2, title: 'Scadenza contratto - Mario Giuffredi', date: '2025-08-30', type: 'contract' },
    { id: 3, title: 'Riunione mercato', date: '2025-09-01', type: 'meeting' }
  ];

  const StatCard = ({ icon: Icon, title, value, trend, color = "blue" }) => ( // eslint-disable-line no-unused-vars
    <div className="stat-card">
      <div className="stat-icon" style={{ color: color === "blue" ? "var(--text-primary)" : color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard SoccerXpro V2</h1>
        <p>Panoramica generale del sistema di gestione</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard 
          icon={Users} 
          title="Giocatori Totali" 
          value={stats.totalPlayers}
          trend="+2 questo mese"
        />
        <StatCard 
          icon={FileText} 
          title="Contratti Attivi" 
          value={stats.activeContracts}
          trend="4 in scadenza"
        />
        <StatCard 
          icon={Activity} 
          title="Giocatori Infortunati" 
          value={stats.injuredPlayers}
          color="#EF4444"
          trend="-1 questa settimana"
        />
        <StatCard 
          icon={TrendingUp} 
          title="Budget Utilizzato" 
          value={`€${(stats.spentBudget / 1000)}k / €${(stats.monthlyBudget / 1000)}k`}
          trend={`${Math.round((stats.spentBudget / stats.monthlyBudget) * 100)}% utilizzato`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Attività Recenti</h2>
            <Activity size={20} />
          </div>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'injury' && <AlertTriangle size={16} color="#EF4444" />}
                  {activity.type === 'contract' && <FileText size={16} color="#10B981" />}
                  {activity.type === 'transfer' && <TrendingUp size={16} color="#F59E0B" />}
                  {activity.type === 'medical' && <Activity size={16} color="#3B82F6" />}
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Prossimi Eventi</h2>
            <Calendar size={20} />
          </div>
          <div className="events-list">
            {upcomingEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-date">
                  {new Date(event.date).toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </div>
                <div className="event-content">
                  <p className="event-title">{event.title}</p>
                  <span className="event-type">{event.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Azioni Rapide</h2>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <Users size={20} />
              <span>Aggiungi Giocatore</span>
            </button>
            <button className="quick-action-btn">
              <FileText size={20} />
              <span>Nuovo Contratto</span>
            </button>
            <button className="quick-action-btn">
              <Activity size={20} />
              <span>Registra Infortunio</span>
            </button>
            <button className="quick-action-btn">
              <TrendingUp size={20} />
              <span>Nuovo Trasferimento</span>
            </button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Budget Overview</h2>
            <TrendingUp size={20} />
          </div>
          <div className="budget-overview">
            <div className="budget-bar">
              <div 
                className="budget-fill" 
                style={{ width: `${(stats.spentBudget / stats.monthlyBudget) * 100}%` }}
              ></div>
            </div>
            <div className="budget-details">
              <div className="budget-item">
                <span>Speso: €{stats.spentBudget.toLocaleString()}</span>
              </div>
              <div className="budget-item">
                <span>Disponibile: €{(stats.monthlyBudget - stats.spentBudget).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;