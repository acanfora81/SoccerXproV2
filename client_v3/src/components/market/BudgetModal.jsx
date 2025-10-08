// client_v3/src/components/market/BudgetModal.jsx
// Modale per la creazione/modifica dei budget di mercato

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/design-system/ds/Button';

export default function BudgetModal({ open, onClose, onSubmit, initial, isViewMode = false }) {
  const [form, setForm] = useState({
    season_label: '',
    type: 'PREVENTIVO',
    transfer_budget: '',
    wage_budget: '',
    commission_budget: '',
    committed_fees: '0',
    committed_wages: '0',
    committed_commissions: '0',
    currency: 'EUR'
  });

  // Inizializza form quando si apre in modalità edit
  useEffect(() => {
    if (initial) {
      setForm({
        season_label: initial.season_label || '',
        type: initial.type || 'PREVENTIVO',
        transfer_budget: initial.transfer_budget || '',
        wage_budget: initial.wage_budget || '',
        commission_budget: initial.commission_budget || '',
        committed_fees: initial.committed_fees || '0',
        committed_wages: initial.committed_wages || '0',
        committed_commissions: initial.committed_commissions || '0',
        currency: initial.currency || 'EUR'
      });
    } else {
      // Reset form for new budget
      setForm({
        season_label: '',
        type: 'PREVENTIVO',
        transfer_budget: '',
        wage_budget: '',
        commission_budget: '',
        committed_fees: '0',
        committed_wages: '0',
        committed_commissions: '0',
        currency: 'EUR'
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) return;
    
    const payload = {
      season_label: form.season_label,
      type: form.type,
      transfer_budget: form.transfer_budget || '0',
      wage_budget: form.wage_budget || '0',
      commission_budget: form.commission_budget || '0',
      committed_fees: form.committed_fees || '0',
      committed_wages: form.committed_wages || '0',
      committed_commissions: form.committed_commissions || '0',
      currency: form.currency
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

  const modalTitle = isViewMode ? 'Dettaglio Budget' : (initial ? 'Modifica Budget' : 'Nuovo Budget');

  // Calcola totali
  const totalBudget = (Number(form.transfer_budget) || 0) + (Number(form.wage_budget) || 0) + (Number(form.commission_budget) || 0);
  const totalCommitted = (Number(form.committed_fees) || 0) + (Number(form.committed_wages) || 0) + (Number(form.committed_commissions) || 0);
  const totalRemaining = totalBudget - totalCommitted;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
            {/* Informazioni Base */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informazioni Base</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stagione <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...getFieldProps('season_label')} 
                    required 
                    placeholder="es. 2024/25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: AAAA/AA</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select {...getFieldProps('type')} required>
                    <option value="PREVENTIVO">Preventivo</option>
                    <option value="CONSUNTIVO">Consuntivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valuta <span className="text-red-500">*</span>
                  </label>
                  <select {...getFieldProps('currency')} required>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Budget Allocati */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Allocati</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget Trasferimenti <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...getFieldProps('transfer_budget')} 
                    required
                    placeholder="es. 10000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Budget per acquisti giocatori</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget Stipendi <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...getFieldProps('wage_budget')} 
                    required
                    placeholder="es. 5000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Budget per salari annuali</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget Commissioni
                  </label>
                  <input 
                    {...getFieldProps('commission_budget')} 
                    placeholder="es. 500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Budget per commissioni agenti</p>
                </div>
              </div>
            </section>

            {/* Importi Impegnati */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Importi Impegnati</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trasferimenti Impegnati
                  </label>
                  <input 
                    {...getFieldProps('committed_fees')} 
                    placeholder="es. 2000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Già spesi o impegnati</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stipendi Impegnati
                  </label>
                  <input 
                    {...getFieldProps('committed_wages')} 
                    placeholder="es. 500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Già spesi o impegnati</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Commissioni Impegnate
                  </label>
                  <input 
                    {...getFieldProps('committed_commissions')} 
                    placeholder="es. 50000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Già spese o impegnate</p>
                </div>
              </div>
            </section>

            {/* Riepilogo Totali */}
            <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riepilogo Totali</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Budget Totale</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalBudget.toLocaleString('it-IT')} {form.currency}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Totale Impegnato</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalCommitted.toLocaleString('it-IT')} {form.currency}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Disponibile</div>
                  <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalRemaining.toLocaleString('it-IT')} {form.currency}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Utilizzo Budget</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {totalBudget > 0 ? ((totalCommitted / totalBudget) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      (totalCommitted / totalBudget) >= 0.9 ? 'bg-red-500' : 
                      (totalCommitted / totalBudget) >= 0.7 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((totalCommitted / totalBudget) * 100, 100)}%` }}
                  />
                </div>
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
                {initial ? 'Aggiorna Budget' : 'Crea Budget'}
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

