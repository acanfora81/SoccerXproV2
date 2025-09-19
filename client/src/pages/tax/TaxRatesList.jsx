import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Percent, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Trash2
} from "lucide-react";
import axios from "axios";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function TaxRatesList({ teamId }) {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, rate: null });

  const fetchTaxRates = async () => {
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
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 Eliminazione aliquota:', rate.id);
      
      await axios.delete(`/api/taxrates/${rate.id}?teamId=${teamId}`);
      
      // Ricarica la lista dopo l'eliminazione
      await fetchTaxRates();
      
      // Chiudi popup di conferma
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

            {/* Info Banner - Horizontal */}
            {taxRates.length > 0 && (
              <div className="mt-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Calculator size={24} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        💡 Informazioni
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">
                            📊 Aliquote Visualizzate
                          </h4>
                          <p className="text-sm text-blue-700">
                            Qui puoi vedere tutte le aliquote fiscali caricate per il tuo team, organizzate per anno e tipo di contratto.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">
                            🔄 Aggiornamenti
                          </h4>
                          <p className="text-sm text-blue-700">
                            Le aliquote vengono aggiornate automaticamente quando carichi nuovi file CSV o Excel.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">
                            📝 Utilizzo
                          </h4>
                          <p className="text-sm text-blue-700">
                            Queste aliquote vengono utilizzate automaticamente nei calcoli dei contratti dei giocatori.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            INPS
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            INAIL
                          </th>
                          <th className="border border-gray-300 px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                            FFC
                          </th>
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
                            const inps = parseFloat(rate.inps) || 0;
                            const inail = parseFloat(rate.inail) || 0;
                            const ffc = parseFloat(rate.ffc) || 0;
                            const total = inps + inail + ffc;

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
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-medium text-red-700">
                                    {formatPercentage(rate.inps)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-medium text-orange-700">
                                    {formatPercentage(rate.inail)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-medium text-green-700">
                                    {formatPercentage(rate.ffc)}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <span className="text-sm font-bold text-gray-900">
                                    {total.toFixed(2).replace('.', ',')}%
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                  {new Date(rate.updatedAt).toLocaleDateString('it-IT')}
                                </td>
                                <td className="border border-gray-300 px-8 py-4 whitespace-nowrap text-center">
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => handleDelete(rate)}
                                      className="action-btn delete-btn"
                                      style={{ fontSize: '0.65rem', padding: '0.2rem 0.2rem' }}
                                      title="Elimina aliquota"
                                    >
                                      <Trash2 size={10} />
                                      Elimina
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
                  onClick={() => window.location.href = '/taxrates/upload'}
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
    </div>
  );
}
