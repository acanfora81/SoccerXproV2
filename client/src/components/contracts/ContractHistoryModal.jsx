// client/src/components/contracts/ContractHistoryModal.jsx
// Modale per visualizzare la storia completa dei contratti di un giocatore

import React, { useState, useEffect } from 'react';
import { X, Calendar, Euro, FileText, Clock, TrendingUp, User, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../utils/http';
import { formatItalianCurrency } from '../../utils/italianNumbers';
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
    return formatItalianCurrency(amount, currency);
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
                    <div className="summary-icon">
                      <FileText size={20} />
                    </div>
                    <div className="summary-content">
                      <div className="summary-value">{history.summary.totalContracts}</div>
                      <div className="summary-label">CONTRATTI TOTALI</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="summary-content">
                      <div className="summary-value">{history.summary.activeContracts}</div>
                      <div className="summary-label">ATTIVI</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon">
                      <Euro size={20} />
                    </div>
                    <div className="summary-content">
                      <div className="summary-value">{formatCurrency(history.summary.totalValue)}</div>
                      <div className="summary-label">VALORE TOTALE</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon">
                      <TrendingUp size={20} />
                    </div>
                    <div className="summary-content">
                      <div className="summary-value">{formatCurrency(history.summary.averageSalary)}</div>
                      <div className="summary-label">STIPENDIO MEDIO</div>
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
                          <div className="contract-main-info">
                            <div className="contract-title-row">
                              <h4 className="contract-title">
                                {getTypeLabel(contract.contractType)}
                              </h4>
                              {contract.isCurrent && <span className="current-badge">Attuale</span>}
                            </div>
                            <div className="contract-salary-large">
                              {formatCurrency(contract.salary, contract.currency)}
                            </div>
                          </div>
                          <div className="contract-dates">
                            <Calendar size={14} />
                            <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                            <span className="duration">({contract.durationDays} giorni)</span>
                          </div>
                        </div>

                        <div className="contract-info-grid">
                          <div className="info-item">
                            <div className="info-label">Stato Contratto</div>
                            <div className={`info-value status-${contract.status.toLowerCase()}`}>
                              {getStatusIcon(contract.status)}
                              {getStatusLabel(contract.status)}
                            </div>
                          </div>
                          {contract.signedDate && (
                            <div className="info-item">
                              <div className="info-label">Data Firma</div>
                              <div className="info-value">{formatDate(contract.signedDate)}</div>
                            </div>
                          )}
                          <div className="info-item">
                            <div className="info-label">Durata</div>
                            <div className="info-value">{contract.durationDays} giorni</div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">Valuta</div>
                            <div className="info-value">{contract.currency || 'EUR'}</div>
                          </div>
                        </div>

                        {contract.notes && (
                          <div className="contract-notes">
                            <div className="notes-label">Note</div>
                            <div className="notes-content">{contract.notes}</div>
                          </div>
                        )}

                        {/* Clausole */}
                        {contract.clauses && contract.clauses.length > 0 && (
                          <div className="contract-clauses">
                            <div className="section-header">
                              <h5>Clausole Contrattuali</h5>
                              <span className="section-count">({contract.clauses.length})</span>
                            </div>
                            <div className="clauses-grid">
                              {contract.clauses.map(clause => (
                                <div key={clause.id} className="clause-card">
                                  <div className="clause-type">{clause.clauseType}</div>
                                  {clause.amount && (
                                    <div className="clause-amount">
                                      {formatCurrency(clause.amount, clause.currency)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emendamenti */}
                        {contract.amendments && contract.amendments.length > 0 && (
                          <div className="contract-amendments">
                            <div className="section-header">
                              <h5>Emendamenti</h5>
                              <span className="section-count">({contract.amendments.length})</span>
                            </div>
                            <div className="amendments-list">
                              {contract.amendments.map(amendment => (
                                <div key={amendment.id} className="amendment-card">
                                  <div className="amendment-header">
                                    <div className="amendment-type">{amendment.type}</div>
                                    <div className="amendment-date">{formatDate(amendment.signedDate)}</div>
                                  </div>
                                  {amendment.notes && (
                                    <div className="amendment-notes">{amendment.notes}</div>
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
