import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Percent, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Trash2,
  Edit3,
  Info,
  BarChart3
} from "lucide-react";
import { apiFetch } from "@/utils/apiClient";
import useAuthStore from "@/store/authStore";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import PageHeader from "@/design-system/ds/PageHeader";
import GlobalLoader from "@/components/ui/GlobalLoader";
import EmptyState from "@/design-system/ds/EmptyState";
import ConfirmDialog from "@/design-system/ds/ConfirmDialog";
import DataTable from "@/design-system/ds/DataTable";

export default function TaxRatesList({ teamId: teamIdProp }) {
  const { user } = useAuthStore();
  const teamId = teamIdProp || user?.teamId;
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, rate: null });
  const [editingRate, setEditingRate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({ 
    year: new Date().getFullYear(), 
    type: 'PROFESSIONAL',
    inpsWorker: '', inpsEmployer: '',
    inailEmployer: '',
    ffcWorker: '', ffcEmployer: '',
    solidarityWorker: '', solidarityEmployer: ''
  });

  const fetchTaxRates = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/taxrates?teamId=${teamId}`);
      setTaxRates(response.data || response);
    } catch (err) {
      setError("Errore nel caricamento delle aliquote");
      console.error("Errore fetch aliquote:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (rate) => {
    console.log('🔵 Apertura popup conferma eliminazione:', rate.id);
    setDeleteConfirm({ isOpen: true, rate });
  };

  const handleConfirmDelete = async () => {
    const { rate } = deleteConfirm;
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 Eliminazione aliquota:', rate.id);
      await apiFetch(`/api/taxrates/${rate.id}?teamId=${teamId}`, {
        method: 'DELETE'
      });
      await fetchTaxRates();
      setDeleteConfirm({ isOpen: false, rate: null });
    } catch (err) {
      setError("Errore nell'eliminazione dell'aliquota");
      console.error("Errore eliminazione aliquota:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('🔵 Annullamento eliminazione aliquota');
    setDeleteConfirm({ isOpen: false, rate: null });
  };

  const openEdit = (rate) => setEditingRate(rate);
  const closeEdit = () => setEditingRate(null);

  const handleSaveEdit = async (updated) => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/api/taxrates/${updated.id}?teamId=${teamId}`, {
        method: 'PUT',
        body: JSON.stringify({
          inpsWorker: updated.inpsWorker,
          inpsEmployer: updated.inpsEmployer,
          inailEmployer: updated.inailEmployer,
          ffcWorker: updated.ffcWorker,
          ffcEmployer: updated.ffcEmployer,
          solidarityWorker: updated.solidarityWorker,
          solidarityEmployer: updated.solidarityEmployer
        })
      });
      await fetchTaxRates();
      setEditingRate(null);
    } catch (err) {
      setError("Errore nel salvataggio dell'aliquota");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      await apiFetch('/api/taxrates', {
        method: 'POST',
        body: JSON.stringify({ ...newRate, teamId })
      });
      await fetchTaxRates();
      setShowAddForm(false);
    } catch (err) {
      setError("Errore nella creazione dell'aliquota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTaxRates();
    }
  }, [teamId]);

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '-' : `${numValue.toFixed(2).replace('.', ',')}%`;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'PROFESSIONAL': return 'Professionista';
      case 'APPRENTICESHIP': return 'Apprendistato';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'APPRENTICESHIP': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Definizione colonne per DataTable
  const columns = [
    {
      key: 'year',
      label: 'Anno',
      render: (rate) => (
        <div className="flex items-center justify-center">
          <Calendar size={16} className="text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {rate.year}
          </span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo Contratto',
      render: (rate) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(rate.type)}`}>
          {getTypeLabel(rate.type)}
        </span>
      )
    },
    {
      key: 'inpsWorker',
      label: 'INPS Lav.',
      render: (rate) => (
        <span className="text-sm font-medium text-red-700 dark:text-red-400">
          {formatPercentage(rate.inpsWorker)}
        </span>
      )
    },
    {
      key: 'inpsEmployer',
      label: 'INPS Dat.',
      render: (rate) => (
        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
          {formatPercentage(rate.inpsEmployer)}
        </span>
      )
    },
    {
      key: 'inailEmployer',
      label: 'INAIL Dat.',
      render: (rate) => (
        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
          {formatPercentage(rate.inailEmployer)}
        </span>
      )
    },
    {
      key: 'ffcWorker',
      label: 'FFC Lav.',
      render: (rate) => (
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {formatPercentage(rate.ffcWorker)}
        </span>
      )
    },
    {
      key: 'ffcEmployer',
      label: 'FFC Dat.',
      render: (rate) => (
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
          {formatPercentage(rate.ffcEmployer)}
        </span>
      )
    },
    {
      key: 'total',
      label: 'Totale',
      render: (rate) => {
        const inpsW = parseFloat(rate.inpsWorker) || 0;
        const inailE = parseFloat(rate.inailEmployer) || 0;
        const ffcW = parseFloat(rate.ffcWorker) || 0;
        const total = inpsW + inailE + ffcW;
        return (
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {total.toFixed(2).replace('.', ',')}%
          </span>
        );
      }
    },
    {
      key: 'updatedAt',
      label: 'Aggiornato',
      render: (rate) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(rate.updatedAt).toLocaleDateString('it-IT')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (rate) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="info"
            size="sm"
            onClick={() => openEdit(rate)}
            title="Modifica aliquota"
            className="min-w-[32px] h-8"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(rate)}
            title="Elimina aliquota"
            className="min-w-[32px] h-8"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return <GlobalLoader sectionName="Contratti e Finanze" fullscreen />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aliquote Fiscali"
        subtitle="Visualizza e gestisci le aliquote fiscali per i contratti"
        icon={Calculator}
      />

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            <div>
              <strong className="text-red-800 dark:text-red-200">Errore:</strong>
              <span className="ml-2 text-red-700 dark:text-red-300">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Aggiunta Manuale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gestione Aliquote</h3>
            <Button
              variant={showAddForm ? "secondary" : "primary"}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Chiudi' : 'Aggiungi Aliquota'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent>
            <div className="space-y-4">
              <h4 className="text-center font-medium">➕ Aggiungi Aliquota Stipendi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Anno</label>
                  <input
                    type="number"
                    value={newRate.year}
                    onChange={(e) => setNewRate({ ...newRate, year: parseInt(e.target.value) })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Contratto</label>
                  <select
                    value={newRate.type}
                    onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                    className="input-base"
                  >
                    <option value="PROFESSIONAL">Professionista</option>
                    <option value="APPRENTICESHIP">Apprendistato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">INPS Lavoratore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.inpsWorker}
                    onChange={(e) => setNewRate({ ...newRate, inpsWorker: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">INPS Datore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.inpsEmployer}
                    onChange={(e) => setNewRate({ ...newRate, inpsEmployer: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">INAIL Datore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.inailEmployer}
                    onChange={(e) => setNewRate({ ...newRate, inailEmployer: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">FFC Lavoratore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.ffcWorker}
                    onChange={(e) => setNewRate({ ...newRate, ffcWorker: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">FFC Datore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.ffcEmployer}
                    onChange={(e) => setNewRate({ ...newRate, ffcEmployer: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Solidarietà Lavoratore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.solidarityWorker}
                    onChange={(e) => setNewRate({ ...newRate, solidarityWorker: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Solidarietà Datore (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.solidarityEmployer}
                    onChange={(e) => setNewRate({ ...newRate, solidarityEmployer: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="success"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  Salva
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Informazioni
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <BarChart3 size={16} /> Aliquote Visualizzate
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Gestisci manualmente o tramite upload CSV
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <RefreshCw size={16} /> Aggiornamenti
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Le aliquote vengono aggiornate in tempo reale
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <CheckCircle size={16} /> Utilizzo
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Usate automaticamente nei calcoli contrattuali
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Table */}
      {taxRates.length > 0 ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Aliquote Fiscali per Anno e Tipo Contratto
            </h3>
          </CardHeader>
          <CardContent>
            <DataTable
              data={taxRates.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return a.type.localeCompare(b.type);
              })}
              columns={columns}
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={FileText}
          title="Nessuna aliquota caricata"
          description="Carica le tue prime aliquote fiscali per iniziare"
          action={
            <Button
              variant="primary"
              onClick={() => window.location.href = '/dashboard/taxrates/upload'}
            >
              Carica Aliquote
            </Button>
          }
        />
      )}

      {/* Refresh Button */}
      {taxRates.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={fetchTaxRates}
          >
            <RefreshCw size={16} />
            Aggiorna
          </Button>
        </div>
      )}

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        title="Conferma Eliminazione"
        message={`Sei sicuro di voler eliminare l'aliquota per ${deleteConfirm.rate?.year} - ${getTypeLabel(deleteConfirm.rate?.type)}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di modifica */}
      {editingRate && (
        <ConfirmDialog
          open={!!editingRate}
          onOpenChange={(open) => !open && closeEdit()}
          onConfirm={() => handleSaveEdit(editingRate)}
          title={`Modifica aliquote — ${getTypeLabel(editingRate.type)} (${editingRate.year})`}
          confirmText="Salva"
          cancelText="Annulla"
          type="success"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">INPS Lavoratore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.inpsWorker ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, inpsWorker: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">INPS Datore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.inpsEmployer ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, inpsEmployer: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">INAIL Datore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.inailEmployer ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, inailEmployer: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">FFC Lavoratore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.ffcWorker ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, ffcWorker: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">FFC Datore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.ffcEmployer ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, ffcEmployer: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Solidarietà Lavoratore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.solidarityWorker ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, solidarityWorker: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Solidarietà Datore (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate.solidarityEmployer ?? ''}
                onChange={(e) => setEditingRate({ ...editingRate, solidarityEmployer: e.target.value })}
                className="input-base"
              />
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
