// client_v3/src/components/market/NegotiationDetailsModal.jsx
// Modale dettagliata per visualizzare e modificare una trattativa

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building, 
  DollarSign, 
  Calendar, 
  Target, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calculator,
  FileText,
  Clock,
  UserCheck,
  Plus
} from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';

const NegotiationDetailsModal = ({ 
  open, 
  onClose, 
  negotiation, 
  isViewMode = false, 
  onSubmit,
  onConvertToPlayer 
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  // === TABS CONFIGURATION ===
  const tabs = [
    { id: 'general', label: 'Dati Generali', icon: FileText },
    { id: 'financial', label: 'Economico', icon: DollarSign },
    { id: 'budget', label: 'Impatto Budget', icon: TrendingUp },
    { id: 'player', label: 'Giocatore', icon: User },
    { id: 'history', label: 'Cronologia', icon: Clock }
  ];

  // === FORM INITIALIZATION ===
  useEffect(() => {
    if (negotiation) {
      setForm({
        stage: negotiation.stage || 'SCOUTING',
        status: negotiation.status || 'OPEN',
        priority: negotiation.priority || 'MEDIUM',
        counterpart: negotiation.counterpart || '',
        notes: negotiation.notes || '',
        requested_fee: negotiation.requested_fee || '',
        requested_salary_net: negotiation.requested_salary_net || '',
        requested_salary_gross: negotiation.requested_salary_gross || '',
        requested_salary_company: negotiation.requested_salary_company || '',
        currency: negotiation.currency || 'EUR',
        agent_commission_fee: negotiation.agent_commission_fee || '',
        bonus_signing_fee: negotiation.bonus_signing_fee || '',
        bonus_performance: negotiation.bonus_performance || '',
        budget_effect_transfer: negotiation.budget_effect_transfer || '',
        budget_effect_wage: negotiation.budget_effect_wage || '',
        budget_effect_commission: negotiation.budget_effect_commission || '',
        budget_included: negotiation.budget_included || false,
        player_first_name: negotiation.player_first_name || '',
        player_last_name: negotiation.player_last_name || '',
        player_nationality: negotiation.player_nationality || '',
        player_position: negotiation.player_position || '',
        player_age: negotiation.player_age || '',
        player_snapshot: negotiation.player_snapshot || ''
      });
    }
  }, [negotiation]);

  // === CALCULATION ===
  const calculateSalary = async () => {
    if (!form.requested_salary_net && !form.requested_salary_gross) return;
    
    try {
      setLoading(true);
      const payload = {
        salary_net: form.requested_salary_net,
        salary_gross: form.requested_salary_gross,
        currency: form.currency
      };
      
      const result = await apiFetch('/api/contracts/calc', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setCalculation(result);
    } catch (e) {
      console.error('Errore calcolo stipendio:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (form.requested_salary_net || form.requested_salary_gross) {
      const timeoutId = setTimeout(calculateSalary, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [form.requested_salary_net, form.requested_salary_gross]);

  // === HANDLERS ===
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isViewMode && onSubmit) {
      onSubmit(form);
    }
  };

  const getFieldProps = (name, required = false) => ({
    name,
    value: form[name] || '',
    onChange: handleChange,
    disabled: isViewMode,
    required: required && !isViewMode,
    className: `w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed`
  });

  const formatCurrency = (amount) => {
    if (!amount) return '€ 0';
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Aperta' },
      AGREEMENT: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Accordo' },
      CLOSED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', label: 'Chiusa' },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rifiutata' }
    };
    
    const config = statusConfig[status] || statusConfig.OPEN;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isViewMode ? 'Dettagli Trattativa' : 'Modifica Trattativa'}
            </h3>
            {negotiation && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {negotiation.player_first_name} {negotiation.player_last_name}
                </span>
                {getStatusBadge(negotiation.status)}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stage
                    </label>
                    <select {...getFieldProps('stage', true)}>
                      <option value="SCOUTING">Scouting</option>
                      <option value="CONTACT">Contatto</option>
                      <option value="OFFER_SENT">Offerta Inviata</option>
                      <option value="COUNTEROFFER">Controfferte</option>
                      <option value="AGREEMENT">Accordo</option>
                      <option value="CLOSED">Chiusa</option>
                      <option value="REJECTED">Rifiutata</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stato
                    </label>
                    <select {...getFieldProps('status', true)}>
                      <option value="OPEN">Aperta</option>
                      <option value="AGREEMENT">Accordo</option>
                      <option value="CLOSED">Chiusa</option>
                      <option value="REJECTED">Rifiutata</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Priorità
                    </label>
                    <select {...getFieldProps('priority')}>
                      <option value="LOW">Bassa</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Controparte
                    </label>
                    <input
                      {...getFieldProps('counterpart')}
                      placeholder="Club o agenzia"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note
                  </label>
                  <textarea
                    {...getFieldProps('notes')}
                    rows={4}
                    placeholder="Note aggiuntive sulla trattativa..."
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                {/* Requested Values */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Valori Richiesti
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fee di Trasferimento
                      </label>
                      <input
                        {...getFieldProps('requested_fee')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Valuta
                      </label>
                      <select {...getFieldProps('currency')}>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stipendio Netto
                      </label>
                      <input
                        {...getFieldProps('requested_salary_net')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stipendio Lordo
                      </label>
                      <input
                        {...getFieldProps('requested_salary_gross')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Costo Azienda
                      </label>
                      <input
                        {...getFieldProps('requested_salary_company')}
                        type="number"
                        placeholder="0"
                        disabled
                        value={calculation?.company_cost || ''}
                      />
                    </div>
                  </div>
                </div>

                {/* Commissions & Bonuses */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Commissioni e Bonus
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Commissione Agente
                      </label>
                      <input
                        {...getFieldProps('agent_commission_fee')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bonus Firma
                      </label>
                      <input
                        {...getFieldProps('bonus_signing_fee')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bonus Performance
                      </label>
                      <input
                        {...getFieldProps('bonus_performance')}
                        type="number"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation Results */}
                {calculation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Calcolo Automatico
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Netto:</span>
                        <span className="ml-2 font-medium">{formatCurrency(calculation.net_salary)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Lordo:</span>
                        <span className="ml-2 font-medium">{formatCurrency(calculation.gross_salary)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Costo Azienda:</span>
                        <span className="ml-2 font-medium">{formatCurrency(calculation.company_cost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Budget Impact Tab */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Impatto Budget
                  </h4>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="budget_included"
                      checked={form.budget_included}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Incluso nel budget
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Impatto Trasferimento
                      </label>
                      <input
                        {...getFieldProps('budget_effect_transfer')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Impatto Stipendio
                      </label>
                      <input
                        {...getFieldProps('budget_effect_wage')}
                        type="number"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Impatto Commissioni
                      </label>
                      <input
                        {...getFieldProps('budget_effect_commission')}
                        type="number"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Player Tab */}
            {activeTab === 'player' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Dati Giocatore
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome
                      </label>
                      <input
                        {...getFieldProps('player_first_name', true)}
                        placeholder="Nome"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cognome
                      </label>
                      <input
                        {...getFieldProps('player_last_name', true)}
                        placeholder="Cognome"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nazionalità
                      </label>
                      <input
                        {...getFieldProps('player_nationality')}
                        placeholder="Es: Italiana"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Posizione
                      </label>
                      <select {...getFieldProps('player_position')}>
                        <option value="">Seleziona posizione</option>
                        <option value="POR">Portiere</option>
                        <option value="DIF">Difensore</option>
                        <option value="CEN">Centrocampista</option>
                        <option value="ATT">Attaccante</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Età
                      </label>
                      <input
                        {...getFieldProps('player_age')}
                        type="number"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Snapshot Giocatore
                    </label>
                    <textarea
                      {...getFieldProps('player_snapshot')}
                      rows={4}
                      placeholder="Dettagli tecnici del giocatore..."
                      className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Convert to Player Button */}
                {negotiation && !negotiation.signed_player_id && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-green-900 dark:text-green-100">
                          Crea Giocatore in Rosa
                        </h5>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Converti questa trattativa in un giocatore della rosa
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onConvertToPlayer && onConvertToPlayer(negotiation)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crea Giocatore</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Already Converted */}
                {negotiation && negotiation.signed_player_id && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <h5 className="font-medium text-blue-900 dark:text-blue-100">
                          Giocatore Creato
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Questo giocatore è già stato aggiunto alla rosa
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Cronologia
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data Creazione
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.createdAt ? new Date(negotiation.createdAt).toLocaleString('it-IT') : '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ultimo Aggiornamento
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.updatedAt ? new Date(negotiation.updatedAt).toLocaleString('it-IT') : '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data Chiusura
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.closed_date ? new Date(negotiation.closed_date).toLocaleString('it-IT') : '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Creato da
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.created_by || '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chiuso da
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.closed_by || '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data Conversione
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {negotiation?.conversion_confirmed_at ? new Date(negotiation.conversion_confirmed_at).toLocaleString('it-IT') : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isViewMode && (
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Annulla
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Salva Modifiche
              </button>
            </div>
          )}
          
          {isViewMode && (
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NegotiationDetailsModal;
