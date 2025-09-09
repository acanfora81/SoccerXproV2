import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Euro,
  FileText,
  Users,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/http';
import PageLoader from '../../components/ui/PageLoader';
import '../../styles/contracts.css';

const ExpiringContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  // Carica contratti in scadenza
  const fetchExpiringContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/contracts?expiring=true');
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setContracts(data.data || []);

    } catch (err) {
      console.error('Errore caricamento contratti in scadenza:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica statistiche
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch('/api/contracts/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpiringContracts();
    fetchStats();
  }, [fetchExpiringContracts, fetchStats]);

  // Helper per formattazione
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (days) => {
    if (days <= 30) return 'critical';
    if (days <= 60) return 'high';
    return 'medium';
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'urgency-critical';
      case 'high': return 'urgency-high';
      case 'medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'high': return <Clock size={16} />;
      case 'medium': return <Calendar size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Raggruppa contratti per urgenza
  const contractsByUrgency = contracts.reduce((acc, contract) => {
    const days = getDaysUntilExpiry(contract.endDate);
    const level = getUrgencyLevel(days);
    
    if (!acc[level]) acc[level] = [];
    acc[level].push({ ...contract, daysUntilExpiry: days });
    
    return acc;
  }, {});

  // Ordina per giorni rimanenti
  Object.keys(contractsByUrgency).forEach(level => {
    contractsByUrgency[level].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  });

  if (loading) {
    return <PageLoader message="Caricamento contratti in scadenza..." minHeight={360} />;
  }

  if (error) {
    return (
      <div className="contracts-list">
        <div className="contracts-header">
          <h2>Contratti in Scadenza</h2>
        </div>
        <div className="error-state">
          <p style={{ color: '#EF4444' }}>Errore: {error}</p>
          <button onClick={fetchExpiringContracts} className="btn btn-secondary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contracts-list">
      {/* Header */}
      <div className="contracts-header">
        <div className="header-left">
          <h2>Contratti in Scadenza</h2>
          <p>{contracts.length} contratti in scadenza nei prossimi 90 giorni</p>
        </div>
        <div className="header-right">
          <button className="btn btn-warning">
            <Bell size={20} />
            Invia Notifiche
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="contracts-stats">
        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{contracts.length}</div>
            <div className="stat-label">In Scadenza</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {contractsByUrgency.critical?.length || 0}
            </div>
            <div className="stat-label">Critici (≤30 giorni)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon high">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {contractsByUrgency.high?.length || 0}
            </div>
            <div className="stat-label">Alta Priorità (≤60 giorni)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Euro size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(
                contracts.reduce((sum, contract) => sum + parseFloat(contract.salary), 0)
              )}
            </div>
            <div className="stat-label">Valore Totale</div>
          </div>
        </div>
      </div>

      {/* Lista contratti raggruppati per urgenza */}
      {contracts.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <h3>Nessun contratto in scadenza</h3>
          <p>Tutti i contratti sono in regola per i prossimi 90 giorni</p>
        </div>
      ) : (
        <div className="expiring-contracts">
          {/* Contratti critici */}
          {contractsByUrgency.critical && contractsByUrgency.critical.length > 0 && (
            <div className="urgency-section critical">
              <div className="urgency-header">
                <AlertTriangle size={20} />
                <h3>Contratti Critici (≤30 giorni)</h3>
                <span className="urgency-count">{contractsByUrgency.critical.length}</span>
              </div>
              <div className="contracts-grid">
                {contractsByUrgency.critical.map(contract => (
                  <ExpiringContractCard 
                    key={contract.id} 
                    contract={contract} 
                    urgencyLevel="critical"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contratti alta priorità */}
          {contractsByUrgency.high && contractsByUrgency.high.length > 0 && (
            <div className="urgency-section high">
              <div className="urgency-header">
                <Clock size={20} />
                <h3>Alta Priorità (≤60 giorni)</h3>
                <span className="urgency-count">{contractsByUrgency.high.length}</span>
              </div>
              <div className="contracts-grid">
                {contractsByUrgency.high.map(contract => (
                  <ExpiringContractCard 
                    key={contract.id} 
                    contract={contract} 
                    urgencyLevel="high"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contratti media priorità */}
          {contractsByUrgency.medium && contractsByUrgency.medium.length > 0 && (
            <div className="urgency-section medium">
              <div className="urgency-header">
                <Calendar size={20} />
                <h3>Media Priorità (≤90 giorni)</h3>
                <span className="urgency-count">{contractsByUrgency.medium.length}</span>
              </div>
              <div className="contracts-grid">
                {contractsByUrgency.medium.map(contract => (
                  <ExpiringContractCard 
                    key={contract.id} 
                    contract={contract} 
                    urgencyLevel="medium"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente per la card del contratto in scadenza
const ExpiringContractCard = ({ contract, urgencyLevel }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'urgency-critical';
      case 'high': return 'urgency-high';
      case 'medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'high': return <Clock size={16} />;
      case 'medium': return <Calendar size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className={`contract-card expiring ${getUrgencyColor(urgencyLevel)}`}>
      {/* Header con urgenza */}
      <div className="contract-header">
        <div className="player-info">
          <div className="player-avatar">
            <div className="avatar-circle">
              {contract.players.firstName?.[0]}{contract.players.lastName?.[0]}
            </div>
          </div>
          <div className="player-details">
            <h3 className="player-name">
              {contract.players.firstName} {contract.players.lastName}
            </h3>
            <div className="player-meta">
              {contract.players.position} 
              {contract.players.shirtNumber && ` #${contract.players.shirtNumber}`}
            </div>
          </div>
        </div>
        <div className={`urgency-badge ${getUrgencyColor(urgencyLevel)}`}>
          {getUrgencyIcon(urgencyLevel)}
          <span>{contract.daysUntilExpiry} giorni</span>
        </div>
      </div>

      {/* Informazioni contratto */}
      <div className="contract-details">
        <div className="detail-row">
          <span className="detail-label">Scadenza:</span>
          <span className="detail-value expiry-date">
            {formatDate(contract.endDate)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Stipendio:</span>
          <span className="detail-value salary">
            {formatCurrency(contract.salary, contract.currency)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Tipo:</span>
          <span className="detail-value">{contract.contractType}</span>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="contract-actions">
        <button className="action-btn renew-btn">
          <TrendingUp size={16} />
          Rinnova
        </button>
        <button className="action-btn negotiate-btn">
          <Users size={16} />
          Negozia
        </button>
        <button className="action-btn view-btn">
          <FileText size={16} />
          Visualizza
        </button>
      </div>
    </div>
  );
};

export default ExpiringContracts;
