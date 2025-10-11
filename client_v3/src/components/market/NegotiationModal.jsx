// client_v3/src/components/market/NegotiationModal.jsx
// Modale per creare una nuova trattativa

import React, { useState, useEffect } from 'react';
import { X, User, Building, Target, DollarSign } from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';

const NegotiationModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    stage: 'SCOUTING',
    status: 'OPEN',
    priority: 'MEDIUM',
    counterpart: '',
    notes: '',
    requested_fee: '',
    requested_salary_net: '',
    requested_salary_gross: '',
    currency: 'EUR',
    agent_commission_fee: '',
    bonus_signing_fee: '',
    bonus_performance: '',
    player_first_name: '',
    player_last_name: '',
    player_nationality: '',
    player_position: '',
    player_age: '',
    player_snapshot: '',
    targetId: '',
    agentId: ''
  });

  const [targets, setTargets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  // === LOAD DATA ===
  useEffect(() => {
    if (open) {
      loadTargets();
      loadAgents();
    }
  }, [open]);

  const loadTargets = async () => {
    try {
      const json = await apiFetch('/api/market/targets');
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento target');
      setTargets(json.data || []);
    } catch (e) {
      console.error('Errore caricamento target:', e);
    }
  };

  const loadAgents = async () => {
    try {
      const json = await apiFetch('/api/market/agents');
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento agenti');
      setAgents(json.data || []);
    } catch (e) {
      console.error('Errore caricamento agenti:', e);
    }
  };

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
    if (onSubmit) {
      onSubmit(form);
    }
  };

  const getFieldProps = (name, required = false) => ({
    name,
    value: form[name] || '',
    onChange: handleChange,
    required: required,
    className: `w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Nuova Trattativa
          </h3>
          <button 
            onClick={onClose} 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Dati Generali */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dati Generali
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stage <span className="text-red-500">*</span>
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
                  <select {...getFieldProps('status')}>
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
                  rows={3}
                  placeholder="Note aggiuntive sulla trattativa..."
                  className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Target e Agente */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Target e Agente
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target
                  </label>
                  <select {...getFieldProps('targetId')}>
                    <option value="">Seleziona un target</option>
                    {targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.first_name} {target.last_name}
                        {target.club && ` - ${target.club}`}
                        {target.position && ` (${target.position})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agente
                  </label>
                  <select {...getFieldProps('agentId')}>
                    <option value="">Seleziona un agente</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                        {agent.agency && ` - ${agent.agency}`}
                        {agent.is_verified && ' ✓'}
                        {agent.is_certified && ' 🏆'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dati Giocatore */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dati Giocatore
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...getFieldProps('player_first_name', true)}
                    placeholder="Nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cognome <span className="text-red-500">*</span>
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
                  rows={3}
                  placeholder="Dettagli tecnici del giocatore..."
                  className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Valori Economici */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Valori Economici
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
          </div>

          {/* Footer */}
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
              Crea Trattativa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NegotiationModal;