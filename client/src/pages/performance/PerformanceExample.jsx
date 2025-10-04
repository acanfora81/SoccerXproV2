import React from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  BarChart3, 
  Download, 
  Filter,
  Plus,
  Eye,
  Edit3
} from 'lucide-react';

// Esempio di come dovrebbe apparire la sezione Performance modernizzata
// seguendo il pattern Automation Mail-like

const PerformanceExample = () => {
  // Dati di esempio per i KPI
  const performanceKPIs = [
    {
      id: 'avg-performance',
      label: 'Performance Media',
      value: '7.8',
      subtitle: 'Ultimi 30 giorni',
      icon: TrendingUp
    },
    {
      id: 'goals-scored',
      label: 'Gol Segnati',
      value: '24',
      subtitle: 'Questa stagione',
      icon: Target
    },
    {
      id: 'active-players',
      label: 'Giocatori Attivi',
      value: '18',
      subtitle: 'In campo',
      icon: Users
    },
    {
      id: 'matches-played',
      label: 'Partite Giocate',
      value: '12',
      subtitle: 'Stagione corrente',
      icon: BarChart3
    }
  ];

  // Dati di esempio per la tabella performance
  const performanceData = [
    { id: 1, name: 'Alessandro Rossi', position: 'Attaccante', matches: 12, goals: 8, assists: 3, rating: 8.2, status: 'Attivo' },
    { id: 2, name: 'Marco Bianchi', position: 'Centrocampista', matches: 11, goals: 2, assists: 7, rating: 7.8, status: 'Attivo' },
    { id: 3, name: 'Giuseppe Verdi', position: 'Difensore', matches: 10, goals: 1, assists: 1, rating: 7.5, status: 'Attivo' },
    { id: 4, name: 'Francesco Neri', position: 'Portiere', matches: 12, goals: 0, assists: 0, rating: 7.9, status: 'Attivo' }
  ];

  return (
    <div className="min-h-screen bg-bg p-xl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header sezione - Pattern Automation Mail-like */}
        <div className="section-header">
          <div>
            <h1>Performance Squadra</h1>
            <p className="text-text-secondary opacity-70 mt-xs">Analisi dettagliata delle performance dei giocatori</p>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-outline">
              <Download size={20} />
              Esporta Report
            </button>
            <button className="btn btn-primary">
              <Plus size={20} />
              Nuova Analisi
            </button>
          </div>
        </div>

        {/* Grid KPI - Pattern Automation Mail-like */}
        <div className="kpi-grid mb-lg">
          {performanceKPIs.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.id} className="kpi-card">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="text-primary">
                    <Icon size={24} />
                  </div>
                  <span className="kpi-card__label">{kpi.label}</span>
                </div>
                <div className="kpi-card__value">{kpi.value}</div>
                <div className="text-xs text-text-muted opacity-70">{kpi.subtitle}</div>
              </div>
            );
          })}
        </div>

        {/* Filtri - Pattern Automation Mail-like */}
        <div className="card mb-lg">
          <div className="flex flex-wrap items-center gap-md">
            <div className="flex items-center gap-sm">
              <Filter size={20} className="text-text-muted" />
              <span className="text-sm font-medium text-text">Filtri:</span>
            </div>
            <select className="form-select" style={{ width: '200px' }}>
              <option>Tutte le posizioni</option>
              <option>Attaccanti</option>
              <option>Centrocampisti</option>
              <option>Difensori</option>
              <option>Portieri</option>
            </select>
            <select className="form-select" style={{ width: '150px' }}>
              <option>Ultimi 30 giorni</option>
              <option>Ultimi 3 mesi</option>
              <option>Stagione corrente</option>
            </select>
            <input 
              type="text" 
              placeholder="Cerca giocatore..." 
              className="form-input" 
              style={{ width: '250px' }}
            />
          </div>
        </div>

        {/* Tabella Performance - Pattern Automation Mail-like */}
        <div className="card">
          <div className="flex justify-between items-center mb-md">
            <h2 className="text-lg font-semibold text-text">Performance Giocatori</h2>
            <div className="flex gap-sm">
              <button className="btn btn-outline">
                <Eye size={16} />
                Vista Dettagli
              </button>
              <button className="btn btn-outline">
                <Edit3 size={16} />
                Modifica
              </button>
            </div>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Posizione</th>
                <th>Partite</th>
                <th>Gol</th>
                <th>Assist</th>
                <th>Rating</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map(player => (
                <tr key={player.id}>
                  <td>
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-text">{player.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="px-sm py-xs bg-primary/10 text-primary text-xs rounded-md">
                      {player.position}
                    </span>
                  </td>
                  <td className="text-text">{player.matches}</td>
                  <td className="text-text font-medium">{player.goals}</td>
                  <td className="text-text font-medium">{player.assists}</td>
                  <td>
                    <span className={`px-sm py-xs text-xs rounded-md font-medium ${
                      player.rating >= 8 ? 'bg-success/10 text-success' :
                      player.rating >= 7 ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {player.rating}
                    </span>
                  </td>
                  <td>
                    <span className={`px-sm py-xs text-xs rounded-md ${
                      player.status === 'Attivo' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                    }`}>
                      {player.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-xs">
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card aggiuntiva per grafici - Pattern Automation Mail-like */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-lg">
          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-md">Performance per Posizione</h3>
            <div className="h-64 bg-surface rounded-md flex items-center justify-center">
              <span className="text-text-muted">Grafico a barre - Performance per posizione</span>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-md">Trend Ultimi 30 Giorni</h3>
            <div className="h-64 bg-surface rounded-md flex items-center justify-center">
              <span className="text-text-muted">Grafico a linee - Trend performance</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceExample;
