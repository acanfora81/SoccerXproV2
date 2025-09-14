// client/src/components/contracts/dashboard/ContractTables.jsx
// Componente per le tabelle dettagliate della dashboard contratti

import { useState } from 'react';
import { 
  Calendar, 
  Euro, 
  AlertTriangle, 
  Clock, 
  User, 
  TrendingUp,
  Eye,
  Edit,
  CheckCircle
} from 'lucide-react';
import { formatItalianCurrency } from '../../../utils/italianNumbers';

const ContractTables = ({ expiring, topPlayers }) => {
  const [activeTable, setActiveTable] = useState('expiring');

  // Formatta valuta
  const formatCurrency = (amount, currency = 'EUR') => {
    return formatItalianCurrency(amount || 0, currency);
  };

  // Formatta data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcola giorni rimanenti
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Ottieni classe CSS per giorni rimanenti
  const getDaysClass = (days) => {
    if (days < 0) return 'expired';
    if (days <= 30) return 'critical';
    if (days <= 60) return 'warning';
    return 'normal';
  };

  // Ottieni icona per status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Clock size={16} className="status-active" />;
      case 'RENEWED': return <TrendingUp size={16} className="status-renewed" />;
      case 'EXPIRED': return <AlertTriangle size={16} className="status-expired" />;
      default: return <Clock size={16} className="status-default" />;
    }
  };

  // Traduce status in italiano
  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'RENEWED': return 'Rinnovato';
      case 'EXPIRED': return 'Scaduto';
      case 'TERMINATED': return 'Terminato';
      case 'DRAFT': return 'Bozza';
      case 'SUSPENDED': return 'Sospeso';
      default: return status;
    }
  };

  // Traduce ruoli in italiano
  const getRoleLabel = (role) => {
    switch (role) {
      case 'PROFESSIONAL_PLAYER': return 'Giocatore Professionista';
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      case 'STRIKER': return 'Attaccante';
      case 'WINGER': return 'Centrocampista';
      case 'CENTER_BACK': return 'Difensore';
      case 'FULL_BACK': return 'Difensore';
      case 'DEFENSIVE_MIDFIELDER': return 'Centrocampista';
      case 'ATTACKING_MIDFIELDER': return 'Centrocampista';
      default: return role || 'Non specificato';
    }
  };

  // Tabella Contratti in Scadenza
  const ExpiringTable = () => (
    <div className="table-container">
      <div className="table-header">
        <h3>
          <AlertTriangle size={20} />
          Contratti in Scadenza
        </h3>
        <span className="table-count">{expiring?.length || 0} contratti</span>
      </div>
      
      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Giocatore</th>
              <th>Ruolo</th>
              <th>Stipendio</th>
              <th>Data Scadenza</th>
              <th>Giorni Rimanenti</th>
              <th>Status</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {expiring?.map((contract) => {
              const daysRemaining = getDaysRemaining(contract.endDate);
              return (
                <tr key={contract.id} className={getDaysClass(daysRemaining)}>
                  <td>
                    <div className="player-info">
                      <User size={16} />
                      <span>{contract.playerName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge">{getRoleLabel(contract.role)}</span>
                  </td>
                  <td>
                    <span className="salary-value">
                      {formatCurrency(contract.salary, contract.currency)}
                    </span>
                  </td>
                  <td>{formatDate(contract.endDate)}</td>
                  <td>
                    <span className={`days-remaining ${getDaysClass(daysRemaining)}`}>
                      {daysRemaining < 0 ? 'Scaduto' : `${daysRemaining} giorni`}
                    </span>
                  </td>
                  <td>
                    <div className="status-cell">
                      {getStatusIcon(contract.status)}
                      <span>{getStatusLabel(contract.status)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Visualizza">
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon" title="Modifica">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {(!expiring || expiring.length === 0) && (
        <div className="empty-state">
          <CheckCircle size={48} className="empty-icon" />
          <p>Nessun contratto in scadenza nei prossimi 90 giorni</p>
        </div>
      )}
    </div>
  );

  // Tabella Top Giocatori
  const TopPlayersTable = () => (
    <div className="table-container">
      <div className="table-header">
        <h3>
          <TrendingUp size={20} />
          Top Giocatori per Stipendio
        </h3>
        <span className="table-count">{topPlayers?.length || 0} giocatori</span>
      </div>
      
      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Posizione</th>
              <th>Giocatore</th>
              <th>Ruolo</th>
              <th>Stipendio Annuo</th>
              <th>Stipendio Mensile</th>
              <th>Status Contratto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers?.map((player, index) => (
              <tr key={player.id}>
                <td>
                  <span className="position-badge">
                    #{index + 1}
                  </span>
                </td>
                <td>
                  <div className="player-info">
                    <User size={16} />
                    <span>{player.playerName}</span>
                  </div>
                </td>
                <td>
                  <span className="role-badge">{getRoleLabel(player.role)}</span>
                </td>
                <td>
                  <span className="salary-value annual">
                    {formatCurrency(player.salary, player.currency)}
                  </span>
                </td>
                <td>
                  <span className="salary-value monthly">
                    {formatCurrency(player.salary / 12, player.currency)}
                  </span>
                </td>
                <td>
                  <div className="status-cell">
                    {getStatusIcon(player.status)}
                    <span>{getStatusLabel(player.status)}</span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Visualizza">
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon" title="Modifica">
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {(!topPlayers || topPlayers.length === 0) && (
        <div className="empty-state">
          <User size={48} className="empty-icon" />
          <p>Nessun giocatore trovato</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="tables-container">
      {/* Tab Navigation */}
      <div className="tables-tabs">
        <button
          className={`table-tab ${activeTable === 'expiring' ? 'active' : ''}`}
          onClick={() => setActiveTable('expiring')}
        >
          <AlertTriangle size={20} />
          Contratti in Scadenza
        </button>
        <button
          className={`table-tab ${activeTable === 'topPlayers' ? 'active' : ''}`}
          onClick={() => setActiveTable('topPlayers')}
        >
          <TrendingUp size={20} />
          Top Giocatori
        </button>
      </div>

      {/* Table Content */}
      <div className="table-content">
        {activeTable === 'expiring' && <ExpiringTable />}
        {activeTable === 'topPlayers' && <TopPlayersTable />}
      </div>
    </div>
  );
};

export default ContractTables;
