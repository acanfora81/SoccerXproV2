import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Calendar,
  Euro,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';
import { apiFetch } from '../../utils/http';
import PageLoader from '../../components/ui/PageLoader';
import '../../styles/contracts.css';

const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showExpiring, setShowExpiring] = useState(false);
  const [stats, setStats] = useState({});

  // Carica contratti
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterType !== 'all') params.set('contractType', filterType);
      if (showExpiring) params.set('expiring', 'true');

      const response = await apiFetch(`/api/contracts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setContracts(data.data || []);
      setStats(data.stats || {});

    } catch (err) {
      console.error('Errore caricamento contratti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterType, showExpiring]);

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
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filtra contratti
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.players.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.players.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'DRAFT': return 'status-draft';
      case 'EXPIRED': return 'status-expired';
      case 'TERMINATED': return 'status-terminated';
      case 'RENEWED': return 'status-renewed';
      default: return 'status-default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'DRAFT': return 'Bozza';
      case 'EXPIRED': return 'Scaduto';
      case 'TERMINATED': return 'Rescisso';
      case 'RENEWED': return 'Rinnovato';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'PERMANENT': return 'Permanente';
      case 'LOAN': return 'Prestito';
      case 'TRIAL': return 'Prova';
      case 'YOUTH': return 'Giovanile';
      default: return type;
    }
  };

  const isExpiring = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  };

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <PageLoader message="Caricamento contratti..." minHeight={360} />;
  }

  if (error) {
    return (
      <div className="contracts-list">
        <div className="contracts-header">
          <h2>Gestione Contratti</h2>
        </div>
        <div className="error-state">
          <p style={{ color: '#EF4444' }}>Errore: {error}</p>
          <button onClick={fetchContracts} className="btn btn-secondary">
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
          <h2>Gestione Contratti</h2>
          <p>{filteredContracts.length} contratti trovati</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Plus size={20} />
            Nuovo Contratto
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="contracts-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Totale Contratti</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active || 0}</div>
            <div className="stat-label">Attivi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.expiring || 0}</div>
            <div className="stat-label">In Scadenza</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Euro size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalValue || 0)}</div>
            <div className="stat-label">Valore Totale</div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="contracts-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca giocatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutti gli stati</option>
            <option value="ACTIVE">Attivi</option>
            <option value="DRAFT">Bozze</option>
            <option value="EXPIRED">Scaduti</option>
            <option value="TERMINATED">Rescissi</option>
            <option value="RENEWED">Rinnovati</option>
          </select>
        </div>

        <div className="filter-box">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutti i tipi</option>
            <option value="PERMANENT">Permanenti</option>
            <option value="LOAN">Prestiti</option>
            <option value="TRIAL">Prove</option>
            <option value="YOUTH">Giovanili</option>
          </select>
        </div>

        <div className="filter-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showExpiring}
              onChange={(e) => setShowExpiring(e.target.checked)}
            />
            <span>In scadenza (90 giorni)</span>
          </label>
        </div>
      </div>

      {/* Lista contratti */}
      {filteredContracts.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>Nessun contratto trovato</h3>
          <p>
            {contracts.length === 0 
              ? 'Inizia creando il primo contratto'
              : 'Prova a modificare i filtri di ricerca'
            }
          </p>
          {contracts.length === 0 && (
            <button className="btn btn-primary">
              <Plus size={20} />
              Crea Primo Contratto
            </button>
          )}
        </div>
      ) : (
        <div className="contracts-grid">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="contract-card">
              {/* Header con info giocatore */}
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
                <div className={`status-badge ${getStatusColor(contract.status)}`}>
                  {getStatusLabel(contract.status)}
                </div>
              </div>

              {/* Informazioni contratto */}
              <div className="contract-details">
                <div className="detail-row">
                  <span className="detail-label">Tipo:</span>
                  <span className="detail-value">{getTypeLabel(contract.contractType)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Stipendio:</span>
                  <span className="detail-value salary">
                    {formatCurrency(contract.salary, contract.currency)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Periodo:</span>
                  <span className="detail-value">
                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                  </span>
                </div>
                {contract.signedDate && (
                  <div className="detail-row">
                    <span className="detail-label">Firmato:</span>
                    <span className="detail-value">{formatDate(contract.signedDate)}</span>
                  </div>
                )}
              </div>

              {/* Alert scadenza */}
              {contract.status === 'ACTIVE' && isExpiring(contract.endDate) && (
                <div className="expiry-alert">
                  <AlertTriangle size={16} />
                  <span>Scade tra {getDaysUntilExpiry(contract.endDate)} giorni</span>
                </div>
              )}

              {/* Clausole */}
              {contract.contract_clauses && contract.contract_clauses.length > 0 && (
                <div className="clauses-section">
                  <div className="clauses-header">
                    <span>Clausole ({contract.contract_clauses.length})</span>
                  </div>
                  <div className="clauses-list">
                    {contract.contract_clauses.slice(0, 2).map(clause => (
                      <div key={clause.id} className="clause-item">
                        <span className="clause-type">{clause.clauseType}</span>
                        {clause.amount && (
                          <span className="clause-amount">
                            {formatCurrency(clause.amount, clause.currency)}
                          </span>
                        )}
                      </div>
                    ))}
                    {contract.contract_clauses.length > 2 && (
                      <div className="clause-more">
                        +{contract.contract_clauses.length - 2} altre
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Azioni */}
              <div className="contract-actions">
                <button className="action-btn view-btn" title="Visualizza contratto">
                  <Eye size={16} />
                  Visualizza
                </button>
                <button className="action-btn edit-btn" title="Modifica contratto">
                  <Edit3 size={16} />
                  Modifica
                </button>
                <button className="action-btn delete-btn" title="Elimina contratto">
                  <Trash2 size={16} />
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractsList;
