// client_v3/src/components/market/OfferModal.jsx
// Modale per la creazione/modifica delle offerte di mercato

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/design-system/ds/Button';

export default function OfferModal({ open, onClose, onSubmit, initial, isViewMode = false }) {
  const [form, setForm] = useState({
    negotiationId: '',
    agentId: '',
    type: 'TRANSFER',
    direction: 'IN',
    fee: '',
    currency: 'EUR',
    salary_offer: '',
    contract_years: '',
    status: 'DRAFT',
    sent_date: '',
    response_date: '',
    notes: ''
  });

  // Inizializza form quando si apre in modalità edit
  useEffect(() => {
    if (initial) {
      setForm({
        negotiationId: initial.negotiationId || '',
        agentId: initial.agentId || '',
        type: initial.type || 'TRANSFER',
        direction: initial.direction || 'IN',
        fee: initial.fee || '',
        currency: initial.currency || 'EUR',
        salary_offer: initial.salary_offer || '',
        contract_years: initial.contract_years || '',
        status: initial.status || 'DRAFT',
        sent_date: initial.sent_date ? initial.sent_date.split('T')[0] : '',
        response_date: initial.response_date ? initial.response_date.split('T')[0] : '',
        notes: initial.notes || ''
      });
    } else {
      // Reset form for new offer
      setForm({
        negotiationId: '',
        agentId: '',
        type: 'TRANSFER',
        direction: 'IN',
        fee: '',
        currency: 'EUR',
        salary_offer: '',
        contract_years: '',
        status: 'DRAFT',
        sent_date: '',
        response_date: '',
        notes: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) return;
    
    const payload = {
      negotiationId: form.negotiationId ? Number(form.negotiationId) : null,
      agentId: form.agentId ? Number(form.agentId) : null,
      type: form.type,
      direction: form.direction,
      fee: form.fee || null,
      currency: form.currency,
      salary_offer: form.salary_offer || null,
      contract_years: form.contract_years ? Number(form.contract_years) : null,
      status: form.status,
      sent_date: form.sent_date || null,
      response_date: form.response_date || null,
      notes: form.notes || null
    };
    onSubmit(payload);
  };

  const getFieldProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    disabled: isViewMode,
    className: `w-full mt-1 rounded-md border px-3 py-2 ${isViewMode ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-[#0f1424]'}`
  });

  const modalTitle = isViewMode ? 'Dettaglio Offerta' : (initial ? 'Modifica Offerta' : 'Nuova Offerta');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Relazioni */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collegamenti</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Trattativa
                  </label>
                  <input type="number" {...getFieldProps('negotiationId')} placeholder="es. 1" />
                  <p className="text-xs text-gray-500 mt-1">Opzionale: collega a una trattativa esistente</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Agente
                  </label>
                  <input type="number" {...getFieldProps('agentId')} placeholder="es. 5" />
                  <p className="text-xs text-gray-500 mt-1">Opzionale: agente coinvolto</p>
                </div>
              </div>
            </section>

            {/* Tipo e Direzione */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tipo Offerta</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select {...getFieldProps('type')} required>
                    <option value="TRANSFER">Trasferimento</option>
                    <option value="LOAN">Prestito</option>
                    <option value="FREE">A Parametro Zero</option>
                    <option value="BUY_OPTION">Opzione d'Acquisto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Direzione <span className="text-red-500">*</span>
                  </label>
                  <select {...getFieldProps('direction')} required>
                    <option value="IN">In Entrata (Acquisto)</option>
                    <option value="OUT">In Uscita (Cessione)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Valori Economici */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valori Economici</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Importo Trasferimento (€)
                  </label>
                  <input {...getFieldProps('fee')} placeholder="es. 5000000" />
                  <p className="text-xs text-gray-500 mt-1">Costo del cartellino</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valuta
                  </label>
                  <select {...getFieldProps('currency')}>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stipendio Offerto (€/anno)
                  </label>
                  <input {...getFieldProps('salary_offer')} placeholder="es. 1500000" />
                  <p className="text-xs text-gray-500 mt-1">Salario lordo annuale</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durata Contratto (anni)
                  </label>
                  <input type="number" {...getFieldProps('contract_years')} placeholder="es. 3" />
                </div>
              </div>
            </section>

            {/* Stato e Date */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stato e Timeline</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stato <span className="text-red-500">*</span>
                  </label>
                  <select {...getFieldProps('status')} required>
                    <option value="DRAFT">Bozza</option>
                    <option value="PENDING">In Attesa</option>
                    <option value="ACCEPTED">Accettata</option>
                    <option value="REJECTED">Rifiutata</option>
                    <option value="EXPIRED">Scaduta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Invio
                  </label>
                  <input type="date" {...getFieldProps('sent_date')} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Risposta/Scadenza
                  </label>
                  <input type="date" {...getFieldProps('response_date')} />
                </div>
              </div>
            </section>

            {/* Note */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Note</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Note Aggiuntive
                </label>
                <textarea {...getFieldProps('notes')} rows="4" placeholder="Dettagli dell'offerta, condizioni particolari, ecc..." />
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {!isViewMode && (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" onClick={handleSubmit}>
                {initial ? 'Aggiorna' : 'Crea Offerta'}
              </Button>
            </>
          )}
          {isViewMode && (
            <Button type="button" onClick={onClose}>
              Chiudi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
