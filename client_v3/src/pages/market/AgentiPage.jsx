// client_v3/src/pages/market/AgentiPage.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, UserCheck, Eye } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import PageLoading from '@/design-system/ds/PageLoading';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import DataTable from '@/design-system/ds/DataTable';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { AuthContext } from '@/contexts/AuthContext';
import { apiFetch } from '@/utils/apiClient';
import AgentModal from '@/components/market/AgentModal';

export default function AgentiPage() {
  const { user } = useContext(AuthContext);
  const canEdit = useMemo(() => ['ADMIN', 'DIRECTOR_SPORT'].includes(user?.role), [user?.role]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, agent: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  const load = async () => {
    setLoading(true); 
    setError('');
    try {
      const json = await apiFetch('/api/market/agents');
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento');
      setData(json.data || []);
    } catch (e) {
      setError(e.message || 'Errore caricamento');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const json = await apiFetch('/api/market/agents', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore salvataggio');
      setOpenModal(false); 
      setEditRow(null); 
      await load();
      setFeedbackDialog({ isOpen: true, message: 'Agente creato con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      setOpenModal(false); 
      setEditRow(null); 
      setIsViewMode(false); 
      await load();
      setFeedbackDialog({ isOpen: true, message: 'Agente aggiornato con successo!', type: 'success' });
    } catch (e) { 
      console.error('Errore aggiornamento agente:', e);
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleDelete = (agent) => {
    setDeleteConfirm({ isOpen: true, agent });
  };

  const handleConfirmDelete = async () => {
    const { agent } = deleteConfirm;
    try {
      setLoading(true);
      
      const json = await apiFetch(`/api/market/agents/${agent.id}`, {
        method: 'DELETE'
      });
      
      if (json?.success === false) {
        throw new Error(json?.error || 'Errore eliminazione');
      }
      
      await load();
      setDeleteConfirm({ isOpen: false, agent: null });
      setFeedbackDialog({ isOpen: true, message: 'Agente eliminato con successo!', type: 'success' });
      
    } catch (e) {
      console.error('Errore eliminazione agente:', e);
      setDeleteConfirm({ isOpen: false, agent: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, agent: null });
  };

  if (loading) {
    return (
      <PageLoading
        title="Agenti"
        description="Gestione degli agenti e procuratori"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Agenti" 
          subtitle="Gestione degli agenti e procuratori" 
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={UserCheck}
              title="Errore nel caricamento"
              description={`Errore: ${error}`}
            >
              <Button onClick={load} variant="outline">
                Riprova
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenti"
        subtitle="Gestione degli agenti e procuratori"
        actions={
          <Button onClick={() => { setEditRow(null); setOpenModal(true); }} variant="primary">
            <Plus size={16} />
            Nuovo Agente
          </Button>
        }
      />

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={UserCheck}
              title="Nessun agente trovato"
              description="Inizia creando il primo agente"
            >
              <Button onClick={() => { setEditRow(null); setOpenModal(true); }} variant="primary">
                <Plus size={16} />
                Crea Primo Agente
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <DataTable
              data={data}
              columns={[
                { 
                  header: "ID", 
                  accessor: (row) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {row.id}
                    </span>
                  ),
                  align: 'left'
                },
                { 
                  header: "Nome", 
                  accessor: (row) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {row.first_name} {row.last_name}
                      </span>
                      {row.is_certified && (
                        <svg 
                          className="w-4 h-4" 
                          viewBox="0 0 40 40" 
                          fill="none"
                          title="Licenza Certificata"
                        >
                          <circle cx="20" cy="20" r="20" fill="#0095F6"/>
                          <path 
                            d="M17.5 26.5L11 20L12.75 18.25L17.5 23L27.25 13.25L29 15L17.5 26.5Z" 
                            fill="white"
                          />
                        </svg>
                      )}
                      {row.is_verified && (
                        <span 
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full" 
                          style={{ backgroundColor: row.verification_badge_color || '#eab308' }}
                          title="Verificato"
                        >
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  ),
                  align: 'left'
                },
                { 
                  header: "Agenzia", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.agency || '-'}
                    </span>
                  )
                },
                { 
                  header: "Stato", 
                  accessor: (row) => (
                    <div className="flex gap-1">
                      {row.active ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          ✓ Attivo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                          ⚠ Inattivo
                        </span>
                      )}
                    </div>
                  )
                },
                { 
                  header: "Email", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.email || '-'}
                    </span>
                  )
                },
                { 
                  header: "Telefono", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.phone || '-'}
                    </span>
                  )
                },
                { 
                  header: "Creato", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('it-IT') : '-'}
                    </span>
                  )
                },
                {
                  header: "Azioni",
                  accessor: (row) => (
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="primary"
                        size="sm"
                        title="Visualizza dettagli agente"
                        onClick={() => { setEditRow(row); setIsViewMode(true); setOpenModal(true); }}
                        className="min-w-[32px] h-8"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        title="Modifica agente"
                        onClick={() => { setEditRow(row); setIsViewMode(false); setOpenModal(true); }}
                        className="min-w-[32px] h-8"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Elimina agente"
                        onClick={() => handleDelete(row)}
                        className="min-w-[32px] h-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      )}

      <AgentModal
        open={openModal}
        onClose={() => { setOpenModal(false); setEditRow(null); setIsViewMode(false); }}
        initial={editRow}
        isViewMode={isViewMode}
        onSubmit={(payload) => editRow ? handleUpdate(editRow.id, payload) : handleCreate(payload)}
      />

      {/* Dialog conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Elimina Agente"
        message={`Sei sicuro di voler eliminare l'agente ${deleteConfirm.agent?.first_name} ${deleteConfirm.agent?.last_name}?`}
      />

      {/* Dialog standardizzato esiti operazioni */}
      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog({ isOpen: false, message: '', type: 'success' });
          }
        }}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
      />
    </div>
  );
}
