// client_v3/src/pages/market/TrattativePage.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, FileText } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import DataTable from '@/design-system/ds/DataTable';
import EmptyState from '@/design-system/ds/EmptyState';
import { AuthContext } from '@/contexts/AuthContext';
import { apiFetch } from '@/utils/http';
import NegotiationModal from '@/components/market/NegotiationModal';

export default function TrattativePage() {
  const { user } = useContext(AuthContext);
  const canEdit = useMemo(() => ['ADMIN', 'DIRECTOR_SPORT'].includes(user?.role), [user?.role]);
  
  // Debug: log del ruolo utente per verificare
  console.log('🔍 [DEBUG] User role:', user?.role, 'Can edit:', canEdit);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const load = async () => {
    setLoading(true); 
    setError('');
    try {
      const res = await apiFetch('/api/market/negotiations');
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || 'Errore caricamento');
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
      const res = await apiFetch('/api/market/negotiations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || 'Errore salvataggio');
      setOpenModal(false); 
      setEditRow(null); 
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      const res = await apiFetch(`/api/market/negotiations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      load();
    } catch (e) { 
      alert(e.message); 
    }
  };

  const handleDelete = async (row) => {
    if (!confirm('Chiudere la trattativa?')) return;
    await handleUpdate(row.id, { status: 'CLOSED' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Trattative" 
          subtitle="Gestione delle trattative di mercato" 
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Trattative" 
          subtitle="Gestione delle trattative di mercato" 
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
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
        title="Trattative"
        subtitle="Gestione delle trattative di mercato"
        actions={
          <Button onClick={() => { setEditRow(null); setOpenModal(true); }} variant="primary">
            <Plus size={16} />
            Nuova Trattativa
          </Button>
        }
      />

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Nessuna trattativa trovata"
              description="Inizia creando la prima trattativa"
            >
              <Button onClick={() => { setEditRow(null); setOpenModal(true); }} variant="primary">
                <Plus size={16} />
                Crea Prima Trattativa
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
                  header: "Target", 
                  accessor: (row) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {row.target?.external_name || `#${row.targetId}`}
                    </span>
                  ),
                  align: 'left'
                },
                { 
                  header: "Agente", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.agent ? `${row.agent.first_name} ${row.agent.last_name}` : '-'}
                    </span>
                  )
                },
                { 
                  header: "Stage", 
                  accessor: (row) => (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {row.stage}
                    </span>
                  )
                },
                { 
                  header: "Status", 
                  accessor: (row) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      row.status === 'OPEN' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {row.status}
                    </span>
                  )
                },
                { 
                  header: "Controparte", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.counterpart || '-'}
                    </span>
                  )
                },
                { 
                  header: "Aggiornato", 
                  accessor: (row) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString('it-IT') : '-'}
                    </span>
                  )
                },
                ...(canEdit ? [{
                  header: "Azioni",
                  accessor: (row) => (
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="warning"
                        size="sm"
                        title="Modifica trattativa"
                        onClick={() => { setEditRow(row); setOpenModal(true); }}
                        className="min-w-[32px] h-8"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Chiudi trattativa"
                        onClick={() => handleDelete(row)}
                        className="min-w-[32px] h-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )
                }] : [])
              ]}
            />
          </CardContent>
        </Card>
      )}

      <NegotiationModal
        open={openModal}
        onClose={() => { setOpenModal(false); setEditRow(null); }}
        initial={editRow}
        onSubmit={(payload) => editRow ? handleUpdate(editRow.id, payload) : handleCreate(payload)}
      />
    </div>
  );
}




