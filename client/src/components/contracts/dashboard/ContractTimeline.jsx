// client/src/components/contracts/dashboard/ContractTimeline.jsx
// Componente per la timeline delle scadenze contratti

import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatItalianCurrency } from '../../../utils/italianNumbers';

const ContractTimeline = ({ data }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      case 'RENEWED': return <CheckCircle size={16} className="status-renewed" />;
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

  // Raggruppa contratti per mese
  const groupContractsByMonth = (contracts) => {
    const grouped = {};
    
    contracts?.forEach(contract => {
      const endDate = new Date(contract.endDate);
      const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: endDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
          contracts: []
        };
      }
      
      grouped[monthKey].contracts.push(contract);
    });

    // Ordina per mese
    return Object.keys(grouped)
      .sort()
      .map(key => grouped[key]);
  };

  // Naviga tra i mesi
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Filtra contratti per il mese corrente
  const getCurrentMonthContracts = () => {
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const grouped = groupContractsByMonth(data);
    
    return grouped.find(group => {
      const groupMonthKey = `${new Date(group.contracts[0]?.endDate).getFullYear()}-${String(new Date(group.contracts[0]?.endDate).getMonth() + 1).padStart(2, '0')}`;
      return groupMonthKey === currentMonthKey;
    });
  };

  const currentMonthData = getCurrentMonthContracts();
  const groupedData = groupContractsByMonth(data);

  return (
    <div className="timeline-container">
      {/* Header con navigazione */}
      <div className="timeline-header">
        <div className="timeline-title">
          <Calendar size={24} />
          <h3>Timeline Scadenze Contratti</h3>
        </div>
        
        <div className="timeline-navigation">
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="current-month">
            {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
          
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>


      {/* Dettagli mese corrente */}
      <div className="timeline-details">
        <h4>
          Contratti in Scadenza - {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </h4>
        
        {currentMonthData ? (
          <div className="dashboard-timeline">
            {currentMonthData.contracts
              .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
              .map((contract) => {
                const daysRemaining = getDaysRemaining(contract.endDate);
                
                return (
                  <div key={contract.id} className={`contract-item ${getDaysClass(daysRemaining)}`}>
                    <div className="contract-date">
                      <Calendar size={16} />
                      <span>{formatDate(contract.endDate)}</span>
                    </div>
                    
                    <div className="contract-info">
                      <div className="player-name">
                        {contract.playerName}
                      </div>
                      <div className="contract-details">
                        <span className="role">{contract.role}</span>
                        <span className="salary">
                          {formatCurrency(contract.salary, contract.currency)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="contract-status">
                      <div className="status-info">
                        {getStatusIcon(contract.status)}
                        <span>{getStatusLabel(contract.status)}</span>
                      </div>
                      <div className={`days-remaining ${getDaysClass(daysRemaining)}`}>
                        {daysRemaining < 0 ? 'Scaduto' : `${daysRemaining} giorni`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <p>Nessun contratto in scadenza questo mese</p>
          </div>
        )}
      </div>

      {/* Statistiche mese corrente */}
      {currentMonthData && (
        <div className="timeline-stats">
          <div className="stat-card">
            <div className="stat-value">{currentMonthData.contracts.length}</div>
            <div className="stat-label">Contratti in Scadenza</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {formatCurrency(
                currentMonthData.contracts.reduce((sum, c) => sum + Number(c.salary || 0), 0)
              )}
            </div>
            <div className="stat-label">Valore Totale</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTimeline;
