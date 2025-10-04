import React from 'react';
import { X, User, Calendar, Euro, FileText, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ds/ConfirmDialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";

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
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DRAFT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'EXPIRED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'TERMINATED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RENEWED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={24} />
            Dettagli Contratto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informazioni Giocatore */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Informazioni Giocatore</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nome:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.players?.firstName || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cognome:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.players?.lastName || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getPositionLabel(contract.players?.position)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Numero Maglia:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.players?.shirtNumber || 'Non assegnato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Contratto */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Informazioni Contratto</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo Contratto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getTypeLabel(contract.contractType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stato:</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {getStatusLabel(contract.status)}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo nel Contratto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.contractRole ? getContractRoleLabel(contract.contractRole) : 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Numero Protocollo:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.protocolNumber || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identificativi e Registrazioni */}
          {(contract.contractNumber || contract.fifaId || contract.leagueRegistrationId) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Identificativi e Registrazioni</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Numero Contratto:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.contractNumber || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID FIFA:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.fifaId || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Registrazione Lega:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.leagueRegistrationId || 'Non specificato'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date e Periodi */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Date e Periodi</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Inizio:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Fine:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(contract.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Firma:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(contract.signedDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Deposito:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(contract.depositDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Finanziarie */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Euro size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Informazioni Finanziarie</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stipendio:</label>
                  <p className="text-green-600 dark:text-green-400 font-semibold text-lg">{formatCurrency(contract.salary, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valuta:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getCurrencyLabel(contract.currency || 'EUR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Frequenza Pagamento:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.paymentFrequency ? getPaymentFrequencyLabel(contract.paymentFrequency) : 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prezzo di Acquisto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.buyPrice, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stipendio Netto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.netSalary, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Diritti Immagine:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.imageRights, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bonus Fedeltà:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.loyaltyBonus, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bonus Firma:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.signingBonus, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bonus Alloggio:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.accommodationBonus, contract.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Indennità Auto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.carAllowance, contract.currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Prestito */}
          {(contract.loanFromClub || contract.loanToClub || contract.buyOption || contract.obligationToBuy) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Informazioni Prestito</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Club di Provenienza:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.loanFromClub || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Club di Destinazione:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.loanToClub || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Opzione di Acquisto:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.buyOption ? 'Attiva' : 'Non Attiva'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Obbligo di Acquisto:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.obligationToBuy ? 'Presente' : 'Non Presente'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parametri Fiscali e Assicurazioni */}
          {(contract.taxRegime || contract.taxRate || contract.socialContributions || contract.insuranceValue || contract.insuranceProvider || contract.medicalInsurance) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Euro size={20} className="text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold">Parametri Fiscali e Assicurazioni</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Regime Fiscale:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.taxRegime || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aliquota Fiscale:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.taxRate ? `${contract.taxRate}%` : 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contributi Sociali:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.socialContributions, contract.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valore Assicurazione:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.insuranceValue, contract.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fornitore Assicurazione:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.insuranceProvider || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Assicurazione Medica:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{contract.medicalInsurance ? 'Sì' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clausole */}
          {contract.contract_clauses && contract.contract_clauses.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Clausole ({contract.contract_clauses.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.contract_clauses.map((clause, index) => (
                    <div key={clause.id || index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{getClauseTypeLabel(clause.clauseType)}</span>
                        {clause.amount && (
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(clause.amount, clause.currency)}
                          </span>
                        )}
                      </div>
                      {clause.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">{clause.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note e Contatti */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Note e Contatti</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Note:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.notes || 'Nessuna nota'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contatto Agente:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.agentContact || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Responsabile:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{contract.responsibleUserId || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailsModal;