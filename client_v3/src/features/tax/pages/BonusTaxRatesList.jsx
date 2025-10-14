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

export default function BonusTaxRatesList({ teamId: teamIdProp }) {
  const { user } = useAuthStore();
  const teamId = teamIdProp || user?.teamId;
  const [bonusTaxRates, setBonusTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, rate: null });
  const [editingRate, setEditingRate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({ year: new Date().getFullYear(), type: 'SIGNING_BONUS', taxRate: '' });

  const fetchBonusTaxRates = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/bonustaxrates?teamId=${teamId}`);
      setBonusTaxRates(response.data || response);
    } catch (err) {
      setError("Errore nel caricamento delle aliquote bonus");
      console.error("Errore fetch aliquote bonus:", err);
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
      console.log('🔵 Eliminazione aliquota bonus:', rate.id);
      await apiFetch(`/api/bonustaxrates/${rate.id}?teamId=${teamId}`, {
        method: 'DELETE'
      });
      await fetchBonusTaxRates();
      setDeleteConfirm({ isOpen: false, rate: null });
    } catch (err) {
      setError("Errore nell'eliminazione dell'aliquota bonus");
      console.error("Errore eliminazione aliquota bonus:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('🔵 Annullamento eliminazione aliquota bonus');
    setDeleteConfirm({ isOpen: false, rate: null });
  };

  const openEdit = (rate) => {
    setEditingRate(rate);
  };

  const closeEdit = () => setEditingRate(null);

  const handleSaveEdit = async (updated) => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/api/bonustaxrates/${updated.id}?teamId=${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      await fetchBonusTaxRates();
      setEditingRate(null);
    } catch (err) {
      setError("Errore nel salvataggio dell'aliquota bonus");
      console.error('Errore salvataggio aliquota bonus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError(null);
      await apiFetch('/api/bonustaxrates', {
        method: 'POST',
        body: JSON.stringify({ ...newRate, teamId })
      });
      await fetchBonusTaxRates();
      setShowAddForm(false);
    } catch (err) {
      setError("Errore nella creazione dell'aliquota bonus");
      console.error('Errore creazione aliquota bonus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchBonusTaxRates();
    }
  }, [teamId]);

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '-' : `${numValue.toFixed(2).replace('.', ',')}%`;
  };

  const getBonusTypeLabel = (type) => {
    switch (type) {
      case 'IMAGE_RIGHTS': return 'Diritti Immagine';
      case 'LOYALTY_BONUS': return 'Bonus Fedeltà';
      case 'SIGNING_BONUS': return 'Bonus Firma';
      case 'ACCOMMODATION_BONUS': return 'Bonus Alloggio';
      case 'CAR_ALLOWANCE': return 'Indennità Auto';
      case 'TRANSFER_ALLOWANCE': return 'Indennità di Trasferta';
      default: return type;
    }
  };

  const getBonusTypeColor = (type) => {
    switch (type) {
      case 'IMAGE_RIGHTS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'LOYALTY_BONUS': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SIGNING_BONUS': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ACCOMMODATION_BONUS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CAR_ALLOWANCE': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'TRANSFER_ALLOWANCE': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
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
      label: 'Tipo Bonus',
      render: (rate) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBonusTypeColor(rate.type)}`}>
          {getBonusTypeLabel(rate.type)}
        </span>
      )
    },
    {
      key: 'taxRate',
      label: 'Aliquota',
      render: (rate) => (
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {formatPercentage(rate.taxRate)}
        </span>
      )
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
            title="Modifica aliquota bonus"
            className="min-w-[32px] h-8"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(rate)}
            title="Elimina aliquota bonus"
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
        title="Aliquote Bonus e Indennità"
        subtitle="Visualizza e gestisci le aliquote fiscali per bonus e indennità"
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
            <h3 className="text-lg font-semibold">Gestione Aliquote Bonus</h3>
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
              <h4 className="text-center font-medium">➕ Aggiungi Aliquota Bonus</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Tipo Bonus</label>
                  <select
                    value={newRate.type}
                    onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                    className="input-base"
                  >
                    <option value="IMAGE_RIGHTS">Diritti Immagine</option>
                    <option value="LOYALTY_BONUS">Bonus Fedeltà</option>
                    <option value="SIGNING_BONUS">Bonus Firma</option>
                    <option value="ACCOMMODATION_BONUS">Bonus Alloggio</option>
                    <option value="CAR_ALLOWANCE">Indennità Auto</option>
                    <option value="TRANSFER_ALLOWANCE">Indennità di Trasferta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aliquota (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRate.taxRate}
                    onChange={(e) => setNewRate({ ...newRate, taxRate: e.target.value })}
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
                    Qui puoi vedere tutte le aliquote fiscali per bonus e indennità per il tuo team, organizzate per anno e tipo di bonus.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <RefreshCw size={16} /> Aggiornamenti
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Le aliquote vengono aggiornate automaticamente da file CSV/Excel oppure manualmente tramite il modulo qui sopra.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <CheckCircle size={16} /> Utilizzo
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Le aliquote sono utilizzate automaticamente nei calcoli dei contratti giocatori.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Tax Rates Table */}
      {bonusTaxRates.length > 0 ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Aliquote Fiscali per Anno e Tipo Bonus
            </h3>
          </CardHeader>
          <CardContent>
            <DataTable
              data={bonusTaxRates.sort((a, b) => {
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
          title="Nessuna aliquota bonus caricata"
          description="Carica le tue prime aliquote fiscali per bonus e indennità per iniziare"
          action={
            <Button
              variant="primary"
              onClick={() => window.location.href = '/dashboard/bonustaxrates/upload'}
            >
              Carica Aliquote Bonus
            </Button>
          }
        />
      )}

      {/* Refresh Button */}
      {bonusTaxRates.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={fetchBonusTaxRates}
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
        message={`Sei sicuro di voler eliminare l'aliquota bonus per ${deleteConfirm.rate?.year} - ${getBonusTypeLabel(deleteConfirm.rate?.type)}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Modale modifica semplice inline usando ConfirmDialog come contenitore */}
      {editingRate && (
        <ConfirmDialog
          open={!!editingRate}
          onOpenChange={(open) => !open && closeEdit()}
          onConfirm={() => handleSaveEdit(editingRate)}
          title={`Modifica aliquota — ${getBonusTypeLabel(editingRate.type)} (${editingRate.year})`}
          confirmText="Salva"
          cancelText="Annulla"
          type="success"
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium">Aliquota (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={editingRate.taxRate ?? ''}
              onChange={(e) => setEditingRate({ ...editingRate, taxRate: e.target.value })}
              className="input-base"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
