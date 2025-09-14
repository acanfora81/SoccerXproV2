import React from 'react';
import { X, User, Calendar, Euro, FileText, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatItalianCurrency } from '../../utils/italianNumbers';
import './ContractDetailsModal.css';

const ContractDetailsModal = ({ isOpen, onClose, contract }) => {
  if (!isOpen || !contract) return null;

  // Helper per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificato';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  // Helper per formattare la valuta
  const formatCurrency = (amount, currency = 'EUR') => {
    if (amount === null || amount === undefined) return '€0,00';
    return formatItalianCurrency(amount, currency);
  };

  // Helper per tradurre i ruoli
  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position;
    }
  };

  // Helper per tradurre i tipi di contratto
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

  // Helper per tradurre gli stati
  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'DRAFT': return 'Bozza';
      case 'EXPIRED': return 'Non Attivo';
      case 'TERMINATED': return 'Non Attivo';
      case 'RENEWED': return 'Attivo';
      case 'SUSPENDED': return 'Sospeso';
      default: return status;
    }
  };

  // Helper per i colori degli stati
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-green';
      case 'DRAFT': return 'status-blue';
      case 'EXPIRED': return 'status-red';
      case 'TERMINATED': return 'status-red';
      case 'RENEWED': return 'status-green';
      case 'SUSPENDED': return 'status-yellow';
      default: return 'status-default';
    }
  };

  // Helper per tradurre i tipi di clausola
  const getClauseTypeLabel = (clauseType) => {
    switch (clauseType) {
      case 'BONUS': return 'Bonus';
      case 'PENALTY': return 'Penale';
      case 'RELEASE_CLAUSE': return 'Clausola di Rilascio';
      case 'SIGNING_BONUS': return 'Bonus di Firma';
      case 'APPEARANCE_BONUS': return 'Bonus Presenza';
      case 'GOAL_BONUS': return 'Bonus Gol';
      case 'ASSIST_BONUS': return 'Bonus Assist';
      case 'CLEAN_SHEET_BONUS': return 'Bonus Porta Inviolata';
      case 'CHAMPIONSHIP_BONUS': return 'Bonus Campionato';
      case 'CUP_BONUS': return 'Bonus Coppa';
      case 'EUROPEAN_BONUS': return 'Bonus Europeo';
      case 'INTERNATIONAL_BONUS': return 'Bonus Nazionale';
      case 'LOYALTY_BONUS': return 'Bonus Fedeltà';
      case 'EXTENSION_BONUS': return 'Bonus Rinnovo';
      case 'TRANSFER_BONUS': return 'Bonus Trasferimento';
      case 'OTHER': return 'Altro';
      default: return clauseType;
    }
  };

  // Helper per tradurre le frequenze di pagamento
  const getPaymentFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'WEEKLY': return 'Settimanale';
      case 'MONTHLY': return 'Mensile';
      case 'QUARTERLY': return 'Trimestrale';
      case 'SEMI_ANNUAL': return 'Semestrale';
      case 'ANNUAL': return 'Annuale';
      case 'LUMP_SUM': return 'Unica Soluzione';
      default: return frequency;
    }
  };

  // Helper per tradurre i ruoli nel contratto
  const getContractRoleLabel = (role) => {
    switch (role) {
      case 'CAPTAIN': return 'Capitano';
      case 'VICE_CAPTAIN': return 'Vice Capitano';
      case 'STARTER': return 'Titolare';
      case 'SUBSTITUTE': return 'Riserva';
      case 'YOUTH_PLAYER': return 'Giocatore Giovanile';
      case 'DEVELOPMENT_PLAYER': return 'Giocatore in Sviluppo';
      case 'LOAN_PLAYER': return 'Giocatore in Prestito';
      case 'TRIAL_PLAYER': return 'Giocatore in Prova';
      case 'Professional_player': return 'Giocatore Professionista';
      case 'PROFESSIONAL_PLAYER': return 'Giocatore Professionista';
      default: return role;
    }
  };

  // Helper per tradurre le valute
  const getCurrencyLabel = (currency) => {
    switch (currency) {
      case 'EUR': return 'Euro (€)';
      case 'USD': return 'Dollaro USA ($)';
      case 'GBP': return 'Sterlina Britannica (£)';
      case 'CHF': return 'Franco Svizzero (CHF)';
      case 'JPY': return 'Yen Giapponese (¥)';
      case 'CAD': return 'Dollaro Canadese (C$)';
      case 'AUD': return 'Dollaro Australiano (A$)';
      default: return currency;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content contract-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FileText size={24} />
            Dettagli Contratto
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Informazioni Giocatore */}
          <div className="details-section">
            <div className="section-header">
              <User size={20} />
              <h3>Informazioni Giocatore</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Nome:</span>
                <span className="detail-value">{contract.players?.firstName || 'Non specificato'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cognome:</span>
                <span className="detail-value">{contract.players?.lastName || 'Non specificato'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ruolo:</span>
                <span className="detail-value">{getPositionLabel(contract.players?.position)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Numero Maglia:</span>
                <span className="detail-value">{contract.players?.shirtNumber || 'Non assegnato'}</span>
              </div>
            </div>
          </div>

          {/* Informazioni Contratto */}
          <div className="details-section">
            <div className="section-header">
              <FileText size={20} />
              <h3>Informazioni Contratto</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Tipo Contratto:</span>
                <span className="detail-value">{getTypeLabel(contract.contractType)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stato:</span>
                <span className={`detail-value status-badge ${getStatusColor(contract.status)}`}>
                  {getStatusLabel(contract.status)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ruolo nel Contratto:</span>
                <span className="detail-value">{contract.contractRole ? getContractRoleLabel(contract.contractRole) : 'Non specificato'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Numero Protocollo:</span>
                <span className="detail-value">{contract.protocolNumber || 'Non specificato'}</span>
              </div>
            </div>
          </div>

          {/* Identificativi e Registrazioni */}
          {(contract.contractNumber || contract.fifaId || contract.leagueRegistrationId) && (
            <div className="details-section">
              <div className="section-header">
                <FileText size={20} />
                <h3>Identificativi e Registrazioni</h3>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Numero Contratto:</span>
                  <span className="detail-value">{contract.contractNumber || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ID FIFA:</span>
                  <span className="detail-value">{contract.fifaId || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ID Registrazione Lega:</span>
                  <span className="detail-value">{contract.leagueRegistrationId || 'Non specificato'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Date e Periodi */}
          <div className="details-section">
            <div className="section-header">
              <Calendar size={20} />
              <h3>Date e Periodi</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Data Inizio:</span>
                <span className="detail-value">{formatDate(contract.startDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data Fine:</span>
                <span className="detail-value">{formatDate(contract.endDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data Firma:</span>
                <span className="detail-value">{formatDate(contract.signedDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data Deposito:</span>
                <span className="detail-value">{formatDate(contract.depositDate)}</span>
              </div>
            </div>
          </div>

          {/* Informazioni Finanziarie */}
          <div className="details-section">
            <div className="section-header">
              <Euro size={20} />
              <h3>Informazioni Finanziarie</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Stipendio:</span>
                <span className="detail-value salary">{formatCurrency(contract.salary, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Valuta:</span>
                <span className="detail-value">{getCurrencyLabel(contract.currency || 'EUR')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Frequenza Pagamento:</span>
                <span className="detail-value">{contract.paymentFrequency ? getPaymentFrequencyLabel(contract.paymentFrequency) : 'Non specificato'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Prezzo di Acquisto:</span>
                <span className="detail-value">{formatCurrency(contract.buyPrice, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stipendio Netto:</span>
                <span className="detail-value">{formatCurrency(contract.netSalary, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Diritti Immagine:</span>
                <span className="detail-value">{formatCurrency(contract.imageRights, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bonus Fedeltà:</span>
                <span className="detail-value">{formatCurrency(contract.loyaltyBonus, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bonus Firma:</span>
                <span className="detail-value">{formatCurrency(contract.signingBonus, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bonus Alloggio:</span>
                <span className="detail-value">{formatCurrency(contract.accommodationBonus, contract.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Indennità Auto:</span>
                <span className="detail-value">{formatCurrency(contract.carAllowance, contract.currency)}</span>
              </div>
            </div>
          </div>

          {/* Informazioni Prestito */}
          {(contract.loanFromClub || contract.loanToClub || contract.buyOption || contract.obligationToBuy) && (
            <div className="details-section">
              <div className="section-header">
                <Building2 size={20} />
                <h3>Informazioni Prestito</h3>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Club di Provenienza:</span>
                  <span className="detail-value">{contract.loanFromClub || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Club di Destinazione:</span>
                  <span className="detail-value">{contract.loanToClub || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Opzione di Acquisto:</span>
                  <span className="detail-value">{contract.buyOption ? 'Attiva' : 'Non Attiva'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Obbligo di Acquisto:</span>
                  <span className="detail-value">{contract.obligationToBuy ? 'Presente' : 'Non Presente'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Parametri Fiscali e Assicurazioni */}
          {(contract.taxRegime || contract.taxRate || contract.socialContributions || contract.insuranceValue || contract.insuranceProvider || contract.medicalInsurance) && (
            <div className="details-section">
              <div className="section-header">
                <Euro size={20} />
                <h3>Parametri Fiscali e Assicurazioni</h3>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Regime Fiscale:</span>
                  <span className="detail-value">{contract.taxRegime || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Aliquota Fiscale:</span>
                  <span className="detail-value">{contract.taxRate ? `${contract.taxRate}%` : 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contributi Sociali:</span>
                  <span className="detail-value">{formatCurrency(contract.socialContributions, contract.currency)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Valore Assicurazione:</span>
                  <span className="detail-value">{formatCurrency(contract.insuranceValue, contract.currency)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fornitore Assicurazione:</span>
                  <span className="detail-value">{contract.insuranceProvider || 'Non specificato'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assicurazione Medica:</span>
                  <span className="detail-value">{contract.medicalInsurance ? 'Sì' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Clausole */}
          {contract.contract_clauses && contract.contract_clauses.length > 0 && (
            <div className="details-section">
              <div className="section-header">
                <FileText size={20} />
                <h3>Clausole ({contract.contract_clauses.length})</h3>
              </div>
              <div className="clauses-list">
                {contract.contract_clauses.map((clause, index) => (
                  <div key={clause.id || index} className="clause-item">
                    <div className="clause-header">
                      <span className="clause-type">{getClauseTypeLabel(clause.clauseType)}</span>
                      {clause.amount && (
                        <span className="clause-amount">
                          {formatCurrency(clause.amount, clause.currency)}
                        </span>
                      )}
                    </div>
                    {clause.description && (
                      <div className="clause-description">{clause.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note e Contatti */}
          <div className="details-section">
            <div className="section-header">
              <FileText size={20} />
              <h3>Note e Contatti</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item full-width">
                <span className="detail-label">Note:</span>
                <span className="detail-value">{contract.notes || 'Nessuna nota'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contatto Agente:</span>
                <span className="detail-value">{contract.agentContact || 'Non specificato'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Responsabile:</span>
                <span className="detail-value">{contract.responsibleUserId || 'Non specificato'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsModal;
