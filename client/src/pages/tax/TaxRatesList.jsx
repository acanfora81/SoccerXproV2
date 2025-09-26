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
import useAuthStore from "../../store/authStore";

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
      const response = await axios.get(`/api/taxrates?teamId=${teamId}`);
      setTaxRates(response.data.data || response.data);
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
      await axios.delete(`/api/taxrates/${rate.id}?teamId=${teamId}`);
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
      await axios.put(`/api/taxrates/${updated.id}?teamId=${teamId}`, {
        inpsWorker: updated.inpsWorker,
        inpsEmployer: updated.inpsEmployer,
        inailEmployer: updated.inailEmployer,
        ffcWorker: updated.ffcWorker,
        ffcEmployer: updated.ffcEmployer,
        solidarityWorker: updated.solidarityWorker,
        solidarityEmployer: updated.solidarityEmployer
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
      await axios.post('/api/taxrates', { ...newRate, teamId });
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
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800';
      case 'APPRENTICESHIP': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Caricamento aliquote...</span>
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
              <h1>Aliquote Fiscali</h1>
              <p>Visualizza e gestisci le aliquote fiscali per i contratti</p>
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
              <h2>Aliquote Caricate</h2>
              <p>Elenco delle aliquote fiscali disponibili per il tuo team</p>
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

            {/* Form Aggiunta Manuale */}
            <div className="mb-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Chiudi' : 'Aggiungi Aliquota'}
              </button>
            </div>

            {showAddForm && (
              <div className="add-form" style={{ marginBottom: 24 }}>
                <h3 style={{ textAlign: 'center' }}>➕ Aggiungi Aliquota Stipendi (campi split)</h3>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="input-group">
                    <label>Anno</label>
                    <input type="number" value={newRate.year}
                      onChange={(e)=>setNewRate({ ...newRate, year: parseInt(e.target.value) })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>Tipo Contratto</label>
                    <select value={newRate.type} onChange={(e)=>setNewRate({ ...newRate, type: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="PROFESSIONAL">Professionista</option>
                      <option value="APPRENTICESHIP">Apprendistato</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>INPS Lavoratore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.inpsWorker}
                      onChange={(e)=>setNewRate({ ...newRate, inpsWorker: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>INPS Datore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.inpsEmployer}
                      onChange={(e)=>setNewRate({ ...newRate, inpsEmployer: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>INAIL Datore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.inailEmployer}
                      onChange={(e)=>setNewRate({ ...newRate, inailEmployer: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>FFC Lavoratore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.ffcWorker}
                      onChange={(e)=>setNewRate({ ...newRate, ffcWorker: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>FFC Datore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.ffcEmployer}
                      onChange={(e)=>setNewRate({ ...newRate, ffcEmployer: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>Solidarietà Lavoratore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.solidarityWorker}
                      onChange={(e)=>setNewRate({ ...newRate, solidarityWorker: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="input-group">
                    <label>Solidarietà Datore (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={newRate.solidarityEmployer}
                      onChange={(e)=>setNewRate({ ...newRate, solidarityEmployer: e.target.value })}
                      style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div className="form-actions" style={{ textAlign: 'center' }}>
                  <button className="btn btn-success" onClick={handleCreate} disabled={loading}>Salva</button>
                </div>
              </div>
            )}

            {/* Info Panel sempre visibile */}
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
                        <p className="text-sm text-blue-700">Gestisci manualmente o tramite upload CSV</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <RefreshCw size={16} /> Aggiornamenti
                        </h4>
                        <p className="text-sm text-blue-700">Le aliquote vengono aggiornate in tempo reale</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <CheckCircle size={16} /> Utilizzo
                        </h4>
                        <p className="text-sm text-blue-700">Usate automaticamente nei calcoli contrattuali</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Rates Table */}
            {taxRates.length > 0 ? (
              <div className="mt-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Aliquote Fiscali per Anno e Tipo Contratto
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
                            Tipo Contratto
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">INPS Lav.</th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">INPS Dat.</th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">INAIL Dat.</th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">FFC Lav.</th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">FFC Dat.</th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Totale
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
                        {taxRates
                          .sort((a, b) => {
                            // Sort by year desc, then by type
                            if (a.year !== b.year) return b.year - a.year;
                            return a.type.localeCompare(b.type);
                          })
                          .map((rate, index) => {
                            const inpsW = parseFloat(rate.inpsWorker) || 0;
                            const inpsE = parseFloat(rate.inpsEmployer) || 0;
                            const inailE = parseFloat(rate.inailEmployer) || 0;
                            const ffcW = parseFloat(rate.ffcWorker) || 0;
                            const ffcE = parseFloat(rate.ffcEmployer) || 0;
                            const total = inpsW + inailE + ffcW; // totale a carico lavoratore + INAIL datore (visual)

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
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(rate.type)}`}>
                                    {getTypeLabel(rate.type)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center"><span className="text-sm font-medium text-red-700">{formatPercentage(rate.inpsWorker)}</span></td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center"><span className="text-sm font-medium text-blue-700">{formatPercentage(rate.inpsEmployer)}</span></td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center"><span className="text-sm font-medium text-purple-700">{formatPercentage(rate.inailEmployer)}</span></td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center"><span className="text-sm font-medium text-green-700">{formatPercentage(rate.ffcWorker)}</span></td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center"><span className="text-sm font-medium text-indigo-700">{formatPercentage(rate.ffcEmployer)}</span></td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-bold text-gray-900">
                                    {total.toFixed(2).replace('.', ',')}%
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
                                      title="Modifica aliquota"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(rate)}
                                      className="action-btn delete-icon-only"
                                      title="Elimina aliquota"
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
                  Nessuna aliquota caricata
                </h3>
                <p className="text-gray-500 mb-6">
                  Carica le tue prime aliquote fiscali per iniziare
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/taxrates/upload'}
                  className="btn btn-primary"
                >
                  Carica Aliquote
                </button>
              </div>
            )}

            {/* Refresh Button */}
            {taxRates.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={fetchTaxRates}
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
          message={`Sei sicuro di voler eliminare l'aliquota per ${deleteConfirm.rate?.year} - ${getTypeLabel(deleteConfirm.rate?.type)}?`}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}

      {editingRate && (
        <ConfirmDialog
          isOpen={!!editingRate}
          onClose={closeEdit}
          onConfirm={() => handleSaveEdit(editingRate)}
          title={`Modifica aliquote — ${getTypeLabel(editingRate.type)} (${editingRate.year})`}
          confirmText="Salva"
          cancelText="Annulla"
          type="success"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>INPS Lavoratore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.inpsWorker ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, inpsWorker: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>INPS Datore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.inpsEmployer ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, inpsEmployer: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>INAIL Datore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.inailEmployer ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, inailEmployer: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>FFC Lavoratore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.ffcWorker ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, ffcWorker: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>FFC Datore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.ffcEmployer ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, ffcEmployer: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>Solidarietà Lavoratore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.solidarityWorker ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, solidarityWorker: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div className="input-group">
              <label>Solidarietà Datore (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={editingRate.solidarityEmployer ?? ''}
                onChange={(e)=>setEditingRate({ ...editingRate, solidarityEmployer: e.target.value })}
                style={{ padding: '8px 12px', border: '2px solid var(--border-secondary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
