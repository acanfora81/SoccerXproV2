// client_v3/src/pages/market/BudgetsPage.jsx
// Pagina dedicata alla gestione dei budget di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import BudgetModal from '@/components/market/BudgetModal';

const BudgetsPage = () => {
  // === STATE MANAGEMENT ===
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, budget: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === API CALLS ===
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (searchTerm) params.set('season_label', searchTerm);
      
      const json = await apiFetch(`/api/market/budgets?${params.toString()}`);
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento budget');
      
      setBudgets(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const json = await apiFetch('/api/market/budgets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore creazione');
      
      setIsModalOpen(false);
      setSelectedBudget(null);
      await fetchBudgets();
      setFeedbackDialog({ isOpen: true, message: 'Budget creato con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedBudget?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/budgets/${selectedBudget.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      
      setIsModalOpen(false);
      setSelectedBudget(null);
      await fetchBudgets();
      setFeedbackDialog({ isOpen: true, message: 'Budget aggiornato con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleConfirmDelete = async () => {
    const { budget } = deleteConfirm;
    if (!budget?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/budgets/${budget.id}`, {
        method: 'DELETE'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore eliminazione');
      
      setDeleteConfirm({ isOpen: false, budget: null });
      await fetchBudgets();
      setFeedbackDialog({ isOpen: true, message: 'Budget eliminato con successo!', type: 'success' });
    } catch (e) {
      setDeleteConfirm({ isOpen: false, budget: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${e.message}`, type: 'danger' });
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    fetchBudgets();
  }, [filterType]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') fetchBudgets();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // === FILTERED DATA ===
  const filteredBudgets = useMemo(() => {
    let filtered = budgets;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.season_label?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [budgets, searchTerm]);

  // === STATS ===
  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => 
      sum + Number(b.transfer_budget || 0) + Number(b.wage_budget || 0) + Number(b.commission_budget || 0), 0
    );
    const totalCommitted = budgets.reduce((sum, b) => 
      sum + Number(b.committed_fees || 0) + Number(b.committed_wages || 0) + Number(b.committed_commissions || 0), 0
    );
    
    return {
      total: budgets.length,
      totalBudget,
      totalCommitted,
      remaining: totalBudget - totalCommitted,
      utilizationRate: totalBudget > 0 ? ((totalCommitted / totalBudget) * 100).toFixed(1) : 0
    };
  }, [budgets]);

  // === HELPER FUNCTIONS ===
  const calculatePercentage = (committed, total) => {
    if (!total || total === 0) return 0;
    return ((Number(committed) / Number(total)) * 100).toFixed(1);
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // === RENDER FUNCTIONS ===
  const renderBudgetCard = (budget) => {
    const transferPerc = calculatePercentage(budget.committed_fees, budget.transfer_budget);
    const wagePerc = calculatePercentage(budget.committed_wages, budget.wage_budget);
    const commissionPerc = calculatePercentage(budget.committed_commissions, budget.commission_budget);
    
    const totalBudget = Number(budget.transfer_budget) + Number(budget.wage_budget) + Number(budget.commission_budget);
    const totalCommitted = Number(budget.committed_fees) + Number(budget.committed_wages) + Number(budget.committed_commissions);
    const totalRemaining = totalBudget - totalCommitted;
    const totalPerc = calculatePercentage(totalCommitted, totalBudget);
    
    return (
      <Card key={budget.id} className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Stagione {budget.season_label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {budget.type === 'PREVENTIVO' ? 'Budget Preventivo' : 'Budget Consuntivo'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              totalPerc >= 90 ? 'bg-red-100 text-red-800' : 
              totalPerc >= 70 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {totalPerc}% Utilizzato
            </span>
          </div>

          {/* Budget Overview */}
          <div className="space-y-4 mb-6">
            {/* Transfer Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget Trasferimenti
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {Number(budget.committed_fees).toLocaleString('it-IT')} / {Number(budget.transfer_budget).toLocaleString('it-IT')} {budget.currency}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getProgressBarColor(transferPerc)}`}
                  style={{ width: `${Math.min(transferPerc, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rimanente: {(Number(budget.transfer_budget) - Number(budget.committed_fees)).toLocaleString('it-IT')} {budget.currency}
              </p>
            </div>

            {/* Wage Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget Stipendi
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {Number(budget.committed_wages).toLocaleString('it-IT')} / {Number(budget.wage_budget).toLocaleString('it-IT')} {budget.currency}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getProgressBarColor(wagePerc)}`}
                  style={{ width: `${Math.min(wagePerc, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rimanente: {(Number(budget.wage_budget) - Number(budget.committed_wages)).toLocaleString('it-IT')} {budget.currency}
              </p>
            </div>

            {/* Commission Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget Commissioni
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {Number(budget.committed_commissions).toLocaleString('it-IT')} / {Number(budget.commission_budget).toLocaleString('it-IT')} {budget.currency}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getProgressBarColor(commissionPerc)}`}
                  style={{ width: `${Math.min(commissionPerc, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rimanente: {(Number(budget.commission_budget) - Number(budget.committed_commissions)).toLocaleString('it-IT')} {budget.currency}
              </p>
            </div>
          </div>

          {/* Total Summary */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900 dark:text-white">Totale</span>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalCommitted.toLocaleString('it-IT')} / {totalBudget.toLocaleString('it-IT')} {budget.currency}
                </div>
                <div className={`text-sm font-medium ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalRemaining >= 0 ? (
                    <span className="flex items-center justify-end">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Disponibile: {totalRemaining.toLocaleString('it-IT')} {budget.currency}
                    </span>
                  ) : (
                    <span className="flex items-center justify-end">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      Sforato: {Math.abs(totalRemaining).toLocaleString('it-IT')} {budget.currency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBudget(budget);
                setIsViewMode(true);
                setIsModalOpen(true);
              }}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizza
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBudget(budget);
                setIsViewMode(false);
                setIsModalOpen(true);
              }}
              className="text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: true, budget })}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Elimina
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // === MAIN RENDER ===
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Budget di Mercato"
        subtitle="Gestione budget annuali per trasferimenti, stipendi e commissioni"
        actions={
          <Button onClick={() => { setSelectedBudget(null); setIsViewMode(false); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuovo Budget</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Totale Budget</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBudget.toLocaleString('it-IT')} €
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Impegnato</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalCommitted.toLocaleString('it-IT')} €
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Disponibile</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.remaining.toLocaleString('it-IT')} €
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Utilizzo</div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.utilizationRate}%
                </div>
              </div>
              <PieChart className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search by Season */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca per stagione (es. 2024/25)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutti i tipi</option>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CONSUNTIVO">Consuntivo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Budgets Grid */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredBudgets.length === 0 && (
        <EmptyState
          icon={DollarSign}
          title="Nessun budget trovato"
          description="Inizia creando il tuo primo budget di mercato"
          action={
            <Button onClick={() => { setSelectedBudget(null); setIsViewMode(false); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Budget
            </Button>
          }
        />
      )}

      {!loading && !error && filteredBudgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBudgets.map(renderBudgetCard)}
        </div>
      )}

      {/* Modals */}
      <BudgetModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedBudget(null); }}
        onSubmit={selectedBudget ? handleUpdate : handleCreate}
        initial={selectedBudget}
        isViewMode={isViewMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, budget: null })}
        onConfirm={handleConfirmDelete}
        title="Elimina Budget"
        message={`Sei sicuro di voler eliminare il budget per la stagione ${deleteConfirm.budget?.season_label}? L'operazione non può essere annullata.`}
      />

      {/* Feedback Dialog */}
      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => !open && setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
      />
    </div>
  );
};

export default BudgetsPage;

