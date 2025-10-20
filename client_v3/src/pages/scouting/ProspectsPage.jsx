// client_v3/src/pages/scouting/ProspectsPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Search, Plus, Target, Eye, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import GlobalLoader from '@/components/ui/GlobalLoader';
import { apiFetch } from '@/utils/apiClient';
import ProspectCreateModal from './ProspectCreateModal';
import ProspectDetailsModal from './ProspectDetailsModal';

export default function ProspectsPage() {
  const { user } = useContext(AuthContext);
  
  // Normalizza ruolo e determina se mostrare il pulsante Promuovi
  const canPromoteByRole = (role) => {
    if (!role) return false;
    const normalized = String(role).trim().toUpperCase();
    // Gestione varianti localizzate
    const map = {
      'AMMINISTRATORE': 'ADMIN',
      'SUPER AMMINISTRATORE': 'SUPER_ADMIN',
      'DIRETTORE SPORTIVO': 'DIRECTOR_SPORT',
    };
    const resolved = map[normalized] || normalized;
    return ['ADMIN', 'SUPER_ADMIN', 'DIRECTOR_SPORT'].includes(resolved);
  };
  
  // Helper per tradurre i ruoli
  const getPositionLabel = (position) => {
    const positions = {
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'FB': 'Terzino',
      'DM': 'Mediano',
      'CM': 'Centrocampista',
      'AM': 'Trequartista',
      'W': 'Ala',
      'CF': 'Attaccante'
    };
    return positions[position] || position;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [promotingId, setPromotingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [viewingProspect, setViewingProspect] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, prospect: null });
  const [deleting, setDeleting] = useState(false);
  const [promoteConfirm, setPromoteConfirm] = useState({ isOpen: false, prospect: null });
  const [promoting, setPromoting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', mainPosition: '' });
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    mainPosition: '', 
    currentClub: '',
    birthDate: '',
    nationalityPrimary: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filters.search) query.set('q', filters.search);
      if (filters.status) query.set('status', filters.status);
      if (filters.mainPosition) query.set('mainPosition', filters.mainPosition);
      const q = query.toString();
      const url = `/scouting/prospects${q ? `?${q}` : ''}`;
      console.log('Loading prospects with filters:', filters, 'URL:', url);
      const json = await apiFetch(url);
      const data = Array.isArray(json?.data) ? json.data : json;
      setRows(data || []);
    } catch (e) {
      setError(e?.message || 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DISCOVERY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      MONITORING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      ANALYZED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      EVALUATED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      TARGETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      SIGNED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPositionColor = (position) => {
    const colors = {
      GK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      CB: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      FB: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      DM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      CM: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      AM: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      W: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      CF: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    return colors[position] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      DISCOVERY: 'Scoperta',
      MONITORING: 'Monitoraggio',
      ANALYZED: 'Analizzato',
      EVALUATED: 'Valutato',
      TARGETED: 'Obiettivo',
      SIGNED: 'Firmato',
      REJECTED: 'Rifiutato',
      ARCHIVED: 'Archiviato'
    };
    return labels[status] || status;
  };

  const handleDelete = async () => {
    const { prospect } = deleteConfirm;
    if (!prospect) return;
    
    try {
      setDeleting(true);
      await apiFetch(`/scouting/prospects/${prospect.id}`, { method: 'DELETE' });
      await load();
      setDeleteConfirm({ isOpen: false, prospect: null });
    } catch (err) {
      console.error('Errore eliminazione prospect:', err);
      alert('Errore durante l\'eliminazione del prospect');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, prospect: null });
  };

  // Funzione per promuovere un prospect a target
  const handlePromoteToTarget = async () => {
    const { prospect } = promoteConfirm;
    if (!prospect?.id) return;

    try {
      setPromoting(true);
      const response = await apiFetch(`/scouting/prospects/${prospect.id}/promote`, {
        method: 'POST',
        body: JSON.stringify({
          targetNotes: `Promosso da prospect: ${prospect.fullName || `${prospect.firstName} ${prospect.lastName}`}`,
          targetPriority: 3,
          force: "true" // Forza la promozione anche se non è TARGETED (stringa per schema)
        })
      });

      if (response?.success === false) {
        throw new Error(response?.error || 'Errore durante la promozione');
      }

      setPromoteConfirm({ isOpen: false, prospect: null });
      await load(); // Ricarica la lista
      
      // Mostra messaggio di successo
      setSuccessMessage(`Prospect ${prospect.fullName || `${prospect.firstName} ${prospect.lastName}`} promosso a target con successo!`);
      setTimeout(() => setSuccessMessage(null), 5000); // Nasconde dopo 5 secondi
    } catch (error) {
      console.error('Error promoting prospect:', error);
      
      // Traduci i messaggi di errore in italiano
      let errorMsg = error.message;
      if (error.message.includes('Prospect must have status TARGETED')) {
        errorMsg = 'Il prospect deve avere status TARGETED per essere promosso. Contatta un amministratore.';
      } else if (error.message.includes('Only DIRECTOR_SPORT')) {
        errorMsg = 'Solo i Direttori Sportivi possono promuovere i prospect.';
      } else if (error.message.includes('Prospect not found')) {
        errorMsg = 'Prospect non trovato.';
      } else if (error.message.includes('Errore durante la promozione')) {
        errorMsg = error.message; // Mantieni il messaggio originale se già in italiano
      } else {
        errorMsg = `Errore durante la promozione: ${error.message}`;
      }
      
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 8000); // Nasconde dopo 8 secondi
    } finally {
      setPromoting(false);
    }
  };

  const handleCancelPromote = () => {
    setPromoteConfirm({ isOpen: false, prospect: null });
  };

  // Gestione visualizzazione prospect
  const handleViewProspect = (prospect) => {
    setViewingProspect(prospect);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewingProspect(null);
  };

  useEffect(() => { load(); }, [filters]);

  if (loading) return <GlobalLoader />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospect Scouting"
        subtitle="Gestione giocatori osservati e valutazioni"
        actions={
          <Button variant="primary" onClick={() => { setEditingProspect(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Prospect
          </Button>
        }
      />

      {/* Messaggio di successo */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <Target className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-400 hover:text-green-600"
            >
              <span className="sr-only">Chiudi</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messaggio di errore */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <span className="sr-only">Chiudi</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filtri */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtri</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="nome, club, ruolo…" 
                  value={filters.search} 
                  onChange={(e)=>setFilters({...filters, search: e.target.value})} 
                />
              </div>
        </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stato</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filters.status} 
                onChange={(e)=>setFilters({...filters, status: e.target.value})}
              >
            <option value="">Tutti</option>
            <option value="DISCOVERY">Scoperta</option>
            <option value="MONITORING">Monitoraggio</option>
            <option value="ANALYZED">Analizzato</option>
            <option value="EVALUATED">Valutato</option>
            <option value="TARGETED">Obiettivo</option>
            <option value="SIGNED">Firmato</option>
            <option value="REJECTED">Rifiutato</option>
            <option value="ARCHIVED">Archiviato</option>
          </select>
        </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruolo</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filters.mainPosition} 
                onChange={(e)=>setFilters({...filters, mainPosition: e.target.value})}
              >
            <option value="">Tutti</option>
            <option value="GK">Portiere</option>
            <option value="CB">Difensore Centrale</option>
            <option value="FB">Terzino</option>
            <option value="DM">Mediano</option>
            <option value="CM">Centrocampista</option>
            <option value="AM">Trequartista</option>
            <option value="W">Ala</option>
            <option value="CF">Attaccante</option>
          </select>
        </div>
        </div>
        </CardContent>
      </Card>

      {/* Modale creazione/modifica */}
      <ProspectCreateModal
        open={modalOpen}
        editing={editingProspect}
        onClose={() => setModalOpen(false)}
        onSuccess={async ()=>{ await load(); }}
      />

      {/* Modale visualizzazione dettagli */}
      <ProspectDetailsModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        prospect={viewingProspect}
      />
      {/* Tabella Prospects */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prospects ({rows.length})</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ruolo</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Club</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Potenziale</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rischio</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {p.fullName || `${p.firstName} ${p.lastName}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {p.mainPosition ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(p.mainPosition)}`}>
                          {getPositionLabel(p.mainPosition)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {p.currentClub || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {p.potentialScore ? `${p.potentialScore}/100` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {p.riskIndex ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.riskIndex <= 0.2 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          p.riskIndex <= 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          p.riskIndex <= 0.6 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          p.riskIndex <= 0.8 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-800 text-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {Math.round(p.riskIndex * 100)}% {
                            p.riskIndex <= 0.2 ? '🟢' :
                            p.riskIndex <= 0.4 ? '🟡' :
                            p.riskIndex <= 0.6 ? '🟠' :
                            p.riskIndex <= 0.8 ? '🔴' :
                            '⚫'
                          }
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center align-bottom">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewProspect(p)}
                          className="btn-action btn-view"
                          title="Visualizza"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={()=>{ setEditingProspect(p); setModalOpen(true); }}
                          className="btn-action btn-edit"
                          title="Modifica"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* Pulsante Promuovi a Target - ruoli abilitati, inclusi label localizzati */}
                        {canPromoteByRole(user?.role) && (
                          <button
                            onClick={() => setPromoteConfirm({ isOpen: true, prospect: p })}
                            className="btn-action btn-promote"
                            title="Promuovi a Target"
                            style={{ backgroundColor: '#10b981', color: 'white' }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, prospect: p })}
                          className="btn-action btn-delete"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                    <td className="px-6 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                      <div className="flex flex-col items-center">
                        <Eye className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg font-medium">Nessun prospect trovato</p>
                        <p className="text-sm">Crea il tuo primo prospect per iniziare</p>
                      </div>
                    </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </CardContent>
      </Card>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
        onConfirm={handleDelete}
        title="Elimina Prospect"
        message={`Sei sicuro di voler eliminare il prospect ${deleteConfirm.prospect?.fullName || `${deleteConfirm.prospect?.firstName} ${deleteConfirm.prospect?.lastName}`}?`}
        confirmText={deleting ? 'Eliminazione...' : 'Elimina'}
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di conferma promozione */}
      <ConfirmDialog
        open={promoteConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPromote();
          }
        }}
        onConfirm={handlePromoteToTarget}
        title="Promuovi a Target"
        message={`Sei sicuro di voler promuovere il prospect ${promoteConfirm.prospect?.fullName || `${promoteConfirm.prospect?.firstName} ${promoteConfirm.prospect?.lastName}`} a target di mercato?`}
        confirmText={promoting ? 'Promozione...' : 'Promuovi'}
        cancelText="Annulla"
        type="success"
      />
    </div>
  );
}


