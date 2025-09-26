import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCases, updateCase } from '../../services/medical/casesService';
import CaseKanban from '../../components/medical/CaseKanban';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';

export default function CasesBoard() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '' });

  const { data, isLoading, error } = useQuery({ 
    queryKey: ['cases', filters], 
    queryFn: () => listCases(filters) 
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => updateCase(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });

  const handleSelectCase = (caseData) => {
    window.location.href = `/medical/cases/${caseData.id}`;
  };

  const handleStatusChange = (caseId, newStatus) => {
    updateMut.mutate({ id: caseId, patch: { status: newStatus } });
  };

  const items = data?.items || [];

  return (
    <div className="medical-page">
      <PageHeader 
        title="Casi Medici (GDPR)" 
        subtitle="Gestione avanzata crittografata" 
        actions={<>
          <button className="btn" onClick={() => window.location.href = '/medical/cases/new'}>
            + Nuovo Caso
          </button>
          <select 
            className="select" 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="OPEN">Aperti</option>
            <option value="IN_TREATMENT">In Trattamento</option>
            <option value="CLOSED">Chiusi</option>
          </select>
        </>}
      />
      
      {isLoading && <div className="card">Caricamento casi medici...</div>}
      {error && <div className="card" style={{ color: 'salmon' }}>Errore: {String(error.message)}</div>}
      
      {items.length === 0 && !isLoading ? (
        <EmptyState
          title="Nessun caso medico trovato"
          subtitle="Inizia creando un nuovo caso medico GDPR"
          icon="🏥"
          cta={<button className="btn primary" onClick={() => window.location.href = '/medical/cases/new'}>+ Nuovo Caso</button>}
        />
      ) : (
        <CaseKanban 
          cases={items} 
          onSelect={handleSelectCase}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
