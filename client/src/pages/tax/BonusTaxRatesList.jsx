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
import axios from "axios";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function BonusTaxRatesList({ teamId }) {
  const [bonusTaxRates, setBonusTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, rate: null });
  const [editingRate, setEditingRate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({ year: new Date().getFullYear(), type: 'SIGNING_BONUS', taxRate: '' });

  const fetchBonusTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/bonustaxrates?teamId=${teamId}`);
      setBonusTaxRates(response.data.data || response.data);
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
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 Eliminazione aliquota bonus:', rate.id);
      
      await axios.delete(`/api/bonustaxrates/${rate.id}?teamId=${teamId}`);
      
      // Ricarica la lista dopo l'eliminazione
      await fetchBonusTaxRates();
      
      // Chiudi popup di conferma
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
    try {
      setLoading(true);
      setError(null);
      await axios.put(`/api/bonustaxrates/${updated.id}?teamId=${teamId}`, updated);
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
    try {
      setLoading(true);
      setError(null);
      await axios.post('/api/bonustaxrates', { ...newRate, teamId });
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
      case 'IMAGE_RIGHTS': return 'bg-blue-100 text-blue-800';
      case 'LOYALTY_BONUS': return 'bg-green-100 text-green-800';
      case 'SIGNING_BONUS': return 'bg-purple-100 text-purple-800';
      case 'ACCOMMODATION_BONUS': return 'bg-yellow-100 text-yellow-800';
      case 'CAR_ALLOWANCE': return 'bg-indigo-100 text-indigo-800';
      case 'TRANSFER_ALLOWANCE': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Caricamento aliquote bonus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Calculator size={32} color="#3B82F6" />
            <div>
              <h1>Aliquote Bonus e Indennità</h1>
              <p>Visualizza e gestisci le aliquote fiscali per bonus e indennità</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="upload-step-container">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <div className="upload-card">
            <div className="upload-card-header">
              <div className="upload-icon">
                <Percent size={48} color="#3B82F6" />
              </div>
              <h2>Aliquote Bonus Caricate</h2>
              <p>Elenco delle aliquote fiscali per bonus e indennità disponibili per il tuo team</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={20} color="#EF4444" />
                <div className="error-content">
                  <strong>Errore:</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form aggiunta manuale */}
            <div className="mb-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Chiudi' : 'Aggiungi Aliquota'}
              </button>
            </div>

            {showAddForm && (
              <div className="add-form" style={{ marginBottom: 24 }}>
                <h3 style={{ textAlign: 'center' }}>➕ Aggiungi Aliquota Bonus</h3>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="input-group">
                    <label>Anno</label>
                    <input type="number" value={newRate.year}
                      onChange={(e)=>setNewRate({ ...newRate, year: parseInt(e.target.value) })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>Tipo Bonus</label>
                    <select value={newRate.type} onChange={(e)=>setNewRate({ ...newRate, type: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="IMAGE_RIGHTS">Diritti Immagine</option>
                      <option value="LOYALTY_BONUS">Bonus Fedeltà</option>
                      <option value="SIGNING_BONUS">Bonus Firma</option>
                      <option value="ACCOMMODATION_BONUS">Bonus Alloggio</option>
                      <option value="CAR_ALLOWANCE">Indennità Auto</option>
                      <option value="TRANSFER_ALLOWANCE">Indennità di Trasferta</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Aliquota (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.taxRate}
                      onChange={(e)=>setNewRate({ ...newRate, taxRate: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div className="form-actions" style={{ textAlign: 'center' }}>
                  <button className="btn btn-success" onClick={handleCreate} disabled={loading}>Salva</button>
                </div>
              </div>
            )}

            {/* Info Panel (sempre visibile, sopra ai contenuti) */}
            <div className="mt-2 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0"><Info size={24} color="#3B82F6" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Informazioni</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <BarChart3 size={16} /> Aliquote Visualizzate
                        </h4>
                        <p className="text-sm text-blue-700">
                          Qui puoi vedere tutte le aliquote fiscali per bonus e indennità per il tuo team, organizzate per anno e tipo di bonus.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <RefreshCw size={16} /> Aggiornamenti
                        </h4>
                        <p className="text-sm text-blue-700">
                          Le aliquote vengono aggiornate automaticamente da file CSV/Excel oppure manualmente tramite il modulo qui sopra.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <CheckCircle size={16} /> Utilizzo
                        </h4>
                        <p className="text-sm text-blue-700">
                          Le aliquote sono utilizzate automaticamente nei calcoli dei contratti giocatori.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus Tax Rates Table */}
            {bonusTaxRates.length > 0 ? (
              <div className="mt-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Aliquote Fiscali per Anno e Tipo Bonus
                    </h3>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Anno
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Tipo Bonus
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Aliquota
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Aggiornato
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Azioni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {bonusTaxRates
                          .sort((a, b) => {
                            // Sort by year desc, then by type
                            if (a.year !== b.year) return b.year - a.year;
                            return a.type.localeCompare(b.type);
                          })
                          .map((rate, index) => {
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center">
                                    <Calendar size={16} className="text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {rate.year}
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBonusTypeColor(rate.type)}`}>
                                    {getBonusTypeLabel(rate.type)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-medium text-green-700">
                                    {formatPercentage(rate.taxRate)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                  {new Date(rate.updatedAt).toLocaleDateString('it-IT')}
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <div className="actions-inline">
                                    <button
                                      onClick={() => openEdit(rate)}
                                      className="action-btn edit-icon-only"
                                      title="Modifica aliquota bonus"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(rate)}
                                      className="action-btn delete-icon-only"
                                      title="Elimina aliquota bonus"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna aliquota bonus caricata
                </h3>
                <p className="text-gray-500 mb-6">
                  Carica le tue prime aliquote fiscali per bonus e indennità per iniziare
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/bonustaxrates/upload'}
                  className="btn btn-primary"
                >
                  Carica Aliquote Bonus
                </button>
              </div>
            )}

            {/* Refresh Button */}
            {bonusTaxRates.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={fetchBonusTaxRates}
                  className="btn btn-outline"
                >
                  <RefreshCw size={16} />
                  Aggiorna
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Dialog di conferma eliminazione */}
      {deleteConfirm.isOpen && (
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare l'aliquota bonus per ${deleteConfirm.rate?.year} - ${getBonusTypeLabel(deleteConfirm.rate?.type)}?`}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}

      {/* Modale modifica semplice inline usando ConfirmDialog come contenitore */}
      {editingRate && (
        <ConfirmDialog
          isOpen={!!editingRate}
          onClose={closeEdit}
          onConfirm={() => handleSaveEdit(editingRate)}
          title={`Modifica aliquota — ${getBonusTypeLabel(editingRate.type)} (${editingRate.year})`}
          confirmText="Salva"
          cancelText="Annulla"
          type="success"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Aliquota (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={editingRate.taxRate ?? ''}
              onChange={(e) => setEditingRate({ ...editingRate, taxRate: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '2px solid var(--border-secondary)',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
 );
}