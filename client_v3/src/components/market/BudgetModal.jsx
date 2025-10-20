// client_v3/src/components/market/BudgetModal.jsx
// Modal per creazione e modifica budget di mercato

import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, TrendingUp, PieChart } from 'lucide-react';
import Button from '@/design-system/ds/Button';
import Card, { CardContent } from '@/design-system/ds/Card';

const BudgetModal = ({ open, onClose, onSubmit, initial, isViewMode = false }) => {
  const [formData, setFormData] = useState({
    season_label: '',
    type: 'PREVENTIVO',
    transfer_budget: '',
    wage_budget: '',
    commission_budget: '',
    committed_fees: '',
    committed_wages: '',
    committed_commissions: '',
    currency: 'EUR'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initial) {
      setFormData({
        season_label: initial.season_label || '',
        type: initial.type || 'PREVENTIVO',
        transfer_budget: initial.transfer_budget || '',
        wage_budget: initial.wage_budget || '',
        commission_budget: initial.commission_budget || '',
        committed_fees: initial.committed_fees || '',
        committed_wages: initial.committed_wages || '',
        committed_commissions: initial.committed_commissions || '',
        currency: initial.currency || 'EUR'
      });
    } else {
      // Reset form for new budget
      setFormData({
        season_label: '',
        type: 'PREVENTIVO',
        transfer_budget: '',
        wage_budget: '',
        commission_budget: '',
        committed_fees: '',
        committed_wages: '',
        committed_commissions: '',
        currency: 'EUR'
      });
    }
    setErrors({});
  }, [initial, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.season_label.trim()) newErrors.season_label = 'Etichetta stagione è obbligatoria';
    if (!formData.transfer_budget || Number(formData.transfer_budget) < 0) {
      newErrors.transfer_budget = 'Budget trasferimenti deve essere maggiore o uguale a 0';
    }
    if (!formData.wage_budget || Number(formData.wage_budget) < 0) {
      newErrors.wage_budget = 'Budget stipendi deve essere maggiore o uguale a 0';
    }

    // Validate committed amounts don't exceed budgets
    if (formData.committed_fees && formData.transfer_budget && 
        Number(formData.committed_fees) > Number(formData.transfer_budget)) {
      newErrors.committed_fees = 'Importo impegnato non può superare il budget trasferimenti';
    }
    if (formData.committed_wages && formData.wage_budget && 
        Number(formData.committed_wages) > Number(formData.wage_budget)) {
      newErrors.committed_wages = 'Importo impegnato non può superare il budget stipendi';
    }
    if (formData.committed_commissions && formData.commission_budget && 
        Number(formData.committed_commissions) > Number(formData.commission_budget)) {
      newErrors.committed_commissions = 'Importo impegnato non può superare il budget commissioni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Convert empty strings to '0' for numeric fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          if (key.includes('budget') || key.includes('committed')) {
            submitData[key] = '0';
          }
        }
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalBudget = Number(formData.transfer_budget || 0) + Number(formData.wage_budget || 0) + Number(formData.commission_budget || 0);
  const totalCommitted = Number(formData.committed_fees || 0) + Number(formData.committed_wages || 0) + Number(formData.committed_commissions || 0);
  const totalRemaining = totalBudget - totalCommitted;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isViewMode ? 'Visualizza Budget' : initial ? 'Modifica Budget' : 'Nuovo Budget'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Informazioni Base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Etichetta Stagione *
                    </label>
                    <input
                      type="text"
                      value={formData.season_label}
                      onChange={(e) => handleInputChange('season_label', e.target.value)}
                      disabled={isViewMode}
                      placeholder="es. 2024/25"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.season_label ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.season_label && <p className="text-red-500 text-xs mt-1">{errors.season_label}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="PREVENTIVO">Preventivo</option>
                      <option value="CONSUNTIVO">Consuntivo</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Allocation */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Allocazione Budget
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget Trasferimenti *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.transfer_budget}
                      onChange={(e) => handleInputChange('transfer_budget', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.transfer_budget ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.transfer_budget && <p className="text-red-500 text-xs mt-1">{errors.transfer_budget}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget Stipendi *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wage_budget}
                      onChange={(e) => handleInputChange('wage_budget', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.wage_budget ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.wage_budget && <p className="text-red-500 text-xs mt-1">{errors.wage_budget}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget Commissioni
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.commission_budget}
                      onChange={(e) => handleInputChange('commission_budget', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valuta
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Committed Amounts */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Importi Impegnati
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trasferimenti Impegnati
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.committed_fees}
                      onChange={(e) => handleInputChange('committed_fees', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.committed_fees ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.committed_fees && <p className="text-red-500 text-xs mt-1">{errors.committed_fees}</p>}
                    {formData.transfer_budget && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rimanente: {(Number(formData.transfer_budget) - Number(formData.committed_fees || 0)).toLocaleString('it-IT')} {formData.currency}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stipendi Impegnati
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.committed_wages}
                      onChange={(e) => handleInputChange('committed_wages', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.committed_wages ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.committed_wages && <p className="text-red-500 text-xs mt-1">{errors.committed_wages}</p>}
                    {formData.wage_budget && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rimanente: {(Number(formData.wage_budget) - Number(formData.committed_wages || 0)).toLocaleString('it-IT')} {formData.currency}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Commissioni Impegnate
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.committed_commissions}
                      onChange={(e) => handleInputChange('committed_commissions', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.committed_commissions ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.committed_commissions && <p className="text-red-500 text-xs mt-1">{errors.committed_commissions}</p>}
                    {formData.commission_budget && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rimanente: {(Number(formData.commission_budget) - Number(formData.committed_commissions || 0)).toLocaleString('it-IT')} {formData.currency}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Riepilogo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalBudget.toLocaleString('it-IT')} {formData.currency}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Budget Totale</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {totalCommitted.toLocaleString('it-IT')} {formData.currency}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Impegnato</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${totalRemaining >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalRemaining.toLocaleString('it-IT')} {formData.currency}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {totalRemaining >= 0 ? 'Disponibile' : 'Sforato'}
                    </div>
                  </div>
                </div>
                {totalBudget > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Utilizzo Budget</span>
                      <span>{((totalCommitted / totalBudget) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          (totalCommitted / totalBudget) >= 0.9 ? 'bg-red-500' : 
                          (totalCommitted / totalBudget) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((totalCommitted / totalBudget) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          {!isViewMode && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvataggio...' : (initial ? 'Aggiorna' : 'Crea')}</span>
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;