// client/src/components/contracts/ContractHistoryModal.jsx
// Modale per visualizzare la storia completa dei contratti di un giocatore

import React, { useState, useEffect } from 'react';
import { X, Calendar, Euro, FileText, Clock, TrendingUp, User, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../utils/http';
import '../../styles/contract-modal.css';

const ContractHistoryModal = ({ isOpen, onClose, playerId, playerName }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchContractHistory();
    }
  }, [isOpen, playerId]);

  const fetchContractHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/api/contracts/history/${playerId}`);
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHistory(data.data);

    } catch (err) {
      console.error('Errore caricamento storia contratti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'RENEWED':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'EXPIRED':
        return <XCircle size={16} className="text-red-500" />;
      case 'TERMINATED':
        return <XCircle size={16} className="text-red-500" />;
      case 'DRAFT':
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'RENEWED': return 'Attivo';
      case 'EXPIRED': return 'Non Attivo';
      case 'TERMINATED': return 'Non Attivo';
      case 'DRAFT': return 'Sospeso';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'PERMANENT': return 'Permanente';
      case 'PROFESSIONAL': return 'Professionale';
      case 'LOAN': return 'Prestito';
      case 'TRIAL': return 'Prova';
      case 'YOUTH': return 'Giovanile';
      case 'AMATEUR': return 'Dilettante';
      case 'SEMI_PROFESSIONAL': return 'Semi-Professionale';
      case 'TRAINING_AGREEMENT': return 'Accordo formativo';
      case 'APPRENTICESHIP': return 'Apprendistato';
      default: return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content contract-history-modal">
        <div className="modal-header">
          <div className="header-content">
            <User size={24} />
            <div>
              <h2 className="modal-title">Storia Contratti</h2>
              <p className="modal-subtitle">{playerName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Caricamento storia contratti...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p style={{ color: '#EF4444' }}>Errore: {error}</p>
              <button onClick={fetchContractHistory} className="btn btn-secondary">
                Riprova
              </button>
            </div>
          )}

          {history && !loading && !error && (
            <>
              {/* Riepilogo */}
              <div className="history-summary">
                <h3>Riepilogo</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <FileText size={20} />
                    <div>
                      <span className="summary-value">{history.summary.totalContracts}</span>
                      <span className="summary-label">Contratti Totali</span>
                    </div>
                  </div>
                  <div className="summary-item">
                    <CheckCircle size={20} />
                    <div>
                      <span className="summary-value">{history.summary.activeContracts}</span>
                      <span className="summary-label">Attivi</span>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Euro size={20} />
                    <div>
                      <span className="summary-value">{formatCurrency(history.summary.totalValue)}</span>
                      <span className="summary-label">Valore Totale</span>
                    </div>
                  </div>
                  <div className="summary-item">
                    <TrendingUp size={20} />
                    <div>
                      <span className="summary-value">{formatCurrency(history.summary.averageSalary)}</span>
                      <span className="summary-label">Stipendio Medio</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista contratti */}
              <div className="contracts-timeline">
                <h3>Cronologia Contratti</h3>
                <div className="timeline">
                  {history.contracts.map((contract, index) => (
                    <div key={contract.id} className={`timeline-item ${contract.isCurrent ? 'current' : ''}`}>
                      <div className="timeline-marker">
                        {getStatusIcon(contract.status)}
                      </div>
                      <div className="timeline-content">
                        <div className="contract-header">
                          <div className="contract-info">
                            <h4 className="contract-title">
                              {getTypeLabel(contract.contractType)}
                              {contract.isCurrent && <span className="current-badge">Attuale</span>}
                            </h4>
                            <div className="contract-dates">
                              <Calendar size={14} />
                              <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                              <span className="duration">({contract.durationDays} giorni)</span>
                            </div>
                          </div>
                          <div className="contract-salary">
                            <Euro size={16} />
                            <span>{formatCurrency(contract.salary, contract.currency)}</span>
                          </div>
                        </div>

                        <div className="contract-details">
                          <div className="detail-row">
                            <span className="detail-label">Stato:</span>
                            <span className={`detail-value status-${contract.status.toLowerCase()}`}>
                              {getStatusIcon(contract.status)}
                              {getStatusLabel(contract.status)}
                            </span>
                          </div>
                          {contract.signedDate && (
                            <div className="detail-row">
                              <span className="detail-label">Firmato:</span>
                              <span className="detail-value">{formatDate(contract.signedDate)}</span>
                            </div>
                          )}
                          {contract.notes && (
                            <div className="detail-row">
                              <span className="detail-label">Note:</span>
                              <span className="detail-value">{contract.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Clausole */}
                        {contract.clauses && contract.clauses.length > 0 && (
                          <div className="clauses-section">
                            <h5>Clausole ({contract.clauses.length})</h5>
                            <div className="clauses-list">
                              {contract.clauses.map(clause => (
                                <div key={clause.id} className="clause-item">
                                  <span className="clause-type">{clause.clauseType}</span>
                                  {clause.amount && (
                                    <span className="clause-amount">
                                      {formatCurrency(clause.amount, clause.currency)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emendamenti */}
                        {contract.amendments && contract.amendments.length > 0 && (
                          <div className="amendments-section">
                            <h5>Emendamenti ({contract.amendments.length})</h5>
                            <div className="amendments-list">
                              {contract.amendments.map(amendment => (
                                <div key={amendment.id} className="amendment-item">
                                  <div className="amendment-header">
                                    <span className="amendment-type">{amendment.type}</span>
                                    <span className="amendment-date">{formatDate(amendment.signedDate)}</span>
                                  </div>
                                  {amendment.notes && (
                                    <p className="amendment-notes">{amendment.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractHistoryModal;
