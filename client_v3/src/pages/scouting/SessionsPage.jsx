// client_v3/src/pages/scouting/SessionsPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Activity, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import GlobalLoader from '@/components/ui/GlobalLoader';
import { apiFetch } from '@/utils/apiClient';
import SessionCreateModal from './SessionCreateModal';
import SessionDetailsModal from './SessionDetailsModal';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';

export default function SessionsPage() {
  // Helper per tradurre i tipi di osservazione
  const getObservationTypeLabel = (type) => {
    const types = {
      'LIVE': 'Partita Live',
      'VIDEO': 'Video',
      'TRAINING': 'Allenamento',
      'TOURNAMENT': 'Torneo'
    };
    return types[type] || type;
  };

  const getObservationTypeColor = (type) => {
    const colors = {
      'LIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'VIDEO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'TRAINING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'TOURNAMENT': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getRatingColor = (rating) => {
    if (!rating) return 'text-gray-500 dark:text-gray-400';
    
    if (rating >= 0 && rating < 6) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    } else if (rating >= 6 && rating < 8) {
      return 'text-orange-600 dark:text-orange-400 font-semibold';
    } else if (rating >= 8 && rating <= 10) {
      return 'text-green-600 dark:text-green-400 font-semibold';
    }
    
    return 'text-gray-500 dark:text-gray-400';
  };

  const [searchParams] = useSearchParams();
  const prospectId = searchParams.get('prospectId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, session: null });
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ search: '', observationType: '', rolePlayed: '' });

  const load = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (prospectId) query.set('prospectId', prospectId);
      if (filters.search) query.set('q', filters.search);
      if (filters.observationType) query.set('observationType', filters.observationType);
      if (filters.rolePlayed) query.set('rolePlayed', filters.rolePlayed);
      const q = query.toString();
      const url = `/scouting/sessions${q ? `?${q}` : ''}`;
      const json = await apiFetch(url);
      const data = Array.isArray(json?.data) ? json.data : json;
      setRows(data || []);
    } catch (e) {
      setError(e?.message || 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  // Gestione visualizzazione sessione
  const handleViewSession = (session) => {
    console.log('handleViewSession called with:', session);
    if (!session || !session.id) {
      console.error('Invalid session data:', session);
      return;
    }
    setViewingSession(session);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewingSession(null);
  };

  // Gestione eliminazione sessione
  const handleDelete = async () => {
    const { session } = deleteConfirm;
    if (!session) return;
    
    try {
      setDeleting(true);
      await apiFetch(`/scouting/sessions/${session.id}`, { method: 'DELETE' });
      await load();
      setDeleteConfirm({ isOpen: false, session: null });
    } catch (err) {
      console.error('Errore eliminazione sessione:', err);
      alert('Errore durante l\'eliminazione della sessione');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, session: null });
  };

  useEffect(() => { load(); }, [filters]);

  if (loading) return <GlobalLoader />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessioni Scouting"
        subtitle={prospectId ? `Sessioni per prospect ${prospectId}` : 'Gestione sessioni di osservazione'}
        actions={
          <Button variant="primary" onClick={() => { setEditingSession(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Sessione
          </Button>
        }
      />

      {/* Filtri */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ricerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="prospect, luogo, avversario…" 
                  value={filters.search} 
                  onChange={(e)=>setFilters({...filters, search: e.target.value})} 
          />
        </div>
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Osservazione</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filters.observationType} 
                onChange={(e)=>setFilters({...filters, observationType: e.target.value})}
              >
                <option value="">Tutti</option>
                <option value="LIVE">Partita Live</option>
                <option value="VIDEO">Video</option>
                <option value="TRAINING">Allenamento</option>
                <option value="TOURNAMENT">Torneo</option>
              </select>
        </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruolo Giocato</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filters.rolePlayed} 
                onChange={(e)=>setFilters({...filters, rolePlayed: e.target.value})}
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
      <SessionCreateModal
        open={modalOpen}
        editing={editingSession}
        prospectId={prospectId}
        onClose={() => setModalOpen(false)}
        onSuccess={async ()=>{ await load(); }}
      />

      {/* Tabella Sessioni */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sessioni ({rows.length})</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prospect</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Luogo</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avversario</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {s.prospect?.fullName || `${s.prospect?.firstName || ''} ${s.prospect?.lastName || ''}`.trim() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getObservationTypeColor(s.observationType || 'LIVE')}`}>
                        {getObservationTypeLabel(s.observationType || 'LIVE')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {s.dateObserved ? (
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(s.dateObserved).toLocaleDateString('it-IT')}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {s.location ? (
                        <div className="flex items-center justify-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {s.location}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {s.opponent || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {s.rating ? (
                        <span className={getRatingColor(s.rating)}>
                          {s.rating}/10
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewSession(s)}
                          className="btn-action btn-view"
                          title="Visualizza"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={()=>{ setEditingSession(s); setModalOpen(true); }}
                          className="btn-action btn-edit"
                          title="Modifica"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, session: s })}
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
                        <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg font-medium">Nessuna sessione trovata</p>
                        <p className="text-sm">Crea la tua prima sessione per iniziare</p>
                      </div>
                    </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </CardContent>
      </Card>

      {/* Modale visualizzazione dettagli */}
      <SessionDetailsModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        session={viewingSession}
      />

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
        onConfirm={handleDelete}
        title="Elimina Sessione"
        message={`Sei sicuro di voler eliminare questa sessione di osservazione?`}
        confirmText={deleting ? 'Eliminazione...' : 'Elimina'}
        cancelText="Annulla"
        type="danger"
      />
    </div>
  );
}



