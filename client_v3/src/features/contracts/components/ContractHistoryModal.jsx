// client_v3/src/features/contracts/components/ContractHistoryModal.jsx
// Modale per visualizzare la storia completa dei contratti di un giocatore

import React, { useState, useEffect } from 'react';
import { X, Calendar, Euro, FileText, Clock, TrendingUp, User, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ds/ConfirmDialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import KPICard from "@/design-system/ds/KPICard";
import EmptyState from "@/design-system/ds/EmptyState";

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

      const data = await apiFetch(`/api/contracts/history/${playerId}`);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold">Storia Contratti</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{playerName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Caricamento storia contratti...</p>
            </div>
          )}

          {error && (
            <EmptyState
              icon={XCircle}
              title="Errore nel caricamento"
              description={error}
              action={
                <Button onClick={fetchContractHistory} variant="secondary">
                  Riprova
                </Button>
              }
            />
          )}

          {history && !loading && !error && (
            <>
              {/* Riepilogo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Contratti Totali"
                  value={history.summary.totalContracts.toString()}
                  subtitle="Storico completo"
                  icon={FileText}
                  color="primary"
                />
                <KPICard
                  title="Contratti Attivi"
                  value={history.summary.activeContracts.toString()}
                  subtitle="Attualmente attivi"
                  icon={CheckCircle}
                  color="success"
                />
                <KPICard
                  title="Valore Totale"
                  value={formatCurrency(history.summary.totalValue)}
                  subtitle="Valore complessivo"
                  icon={Euro}
                  color="info"
                />
                <KPICard
                  title="Stipendio Medio"
                  value={formatCurrency(history.summary.averageSalary)}
                  subtitle="Media storica"
                  icon={TrendingUp}
                  color="warning"
                />
              </div>

              {/* Lista contratti */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Cronologia Contratti</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {history.contracts.map((contract, index) => (
                      <div key={contract.id} className={`relative ${index !== history.contracts.length - 1 ? 'pb-6' : ''}`}>
                        {/* Timeline line */}
                        {index !== history.contracts.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                        )}
                        
                        <div className={`flex gap-4 ${contract.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800' : ''}`}>
                          {/* Timeline marker */}
                          <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center">
                            {getStatusIcon(contract.status)}
                          </div>
                          
                          {/* Contract content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {getTypeLabel(contract.contractType)}
                                  </h4>
                                  {contract.isCurrent && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Attuale
                                    </span>
                                  )}
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(contract.salary, contract.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <Calendar size={14} />
                              <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                              <span className="text-gray-400">({contract.durationDays} giorni)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stato</label>
                                <div className="flex items-center gap-1 mt-1">
                                  {getStatusIcon(contract.status)}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {getStatusLabel(contract.status)}
                                  </span>
                                </div>
                              </div>
                              {contract.signedDate && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Firma</label>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                    {formatDate(contract.signedDate)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Durata</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                  {contract.durationDays} giorni
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valuta</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                  {contract.currency || 'EUR'}
                                </p>
                              </div>
                            </div>

                            {contract.notes && (
                              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Note</label>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{contract.notes}</p>
                              </div>
                            )}

                            {/* Clausole */}
                            {contract.clauses && contract.clauses.length > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Clausole Contrattuali</h5>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">({contract.clauses.length})</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {contract.clauses.map(clause => (
                                    <div key={clause.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                      <div className="font-medium text-sm text-gray-900 dark:text-white">{clause.clauseType}</div>
                                      {clause.amount && (
                                        <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
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
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Emendamenti</h5>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">({contract.amendments.length})</span>
                                </div>
                                <div className="space-y-2">
                                  {contract.amendments.map(amendment => (
                                    <div key={amendment.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white">{amendment.type}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(amendment.signedDate)}</div>
                                      </div>
                                      {amendment.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{amendment.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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

export default ContractHistoryModal;