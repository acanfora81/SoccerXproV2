import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listVisits, createVisit } from '../../services/medical/visitService';
import VisitCard from '../../components/medical/VisitCard';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';
import { useMedicalUIStore } from '../../store/medical/useMedicalUIStore';
import { VisitType } from '../../utils/enums';
import SkeletonBox, { SkeletonCard } from '../../components/medical/SkeletonBox';

export default function VisitsPage() {
  const qc = useQueryClient();
  const { newVisitOpen, setNewVisitOpen, visitFilters, setVisitFilters } = useMedicalUIStore();
  const [formData, setFormData] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['visits', visitFilters],
    queryFn: () => listVisits(visitFilters),
  });

  const createMut = useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setNewVisitOpen(false);
      setFormData({});
    },
  });

  const onCreate = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      visitType: formData.visitType || VisitType.INJURY_ASSESSMENT,
      visitDate: formData.visitDate || new Date().toISOString(),
    };
    createMut.mutate(payload);
  };

  const items = data?.items || [];

  return (
    <div className="medical-page">
      <PageHeader
        title="Visite Mediche"
        subtitle="Prenotazioni e visite eseguite"
        actions={<>
          <button className="btn" onClick={() => setNewVisitOpen(true)}>+ Nuova Visita</button>
          <input 
            className="input" 
            type="date" 
            placeholder="Da"
            value={visitFilters.from || ''}
            onChange={(e) => setVisitFilters({ ...visitFilters, from: e.target.value })} 
          />
          <input 
            className="input" 
            type="date" 
            placeholder="A"
            value={visitFilters.to || ''}
            onChange={(e) => setVisitFilters({ ...visitFilters, to: e.target.value })} 
          />
        </>}
      />

      {isLoading && (
        <div className="medical-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && <div className="card" style={{ color:'salmon' }}>Errore: {String(error.message)}</div>}

      {items.length === 0 && !isLoading && !error ? (
        <EmptyState
          title="Nessuna visita trovata"
          message="Inizia programmando una nuova visita medica"
          icon="🩺"
          action={<button className="btn primary" onClick={() => setNewVisitOpen(true)}>+ Nuova Visita</button>}
        />
      ) : !isLoading && !error && items.length > 0 && (
        <div className="medical-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          {items.map(v => (
            <VisitCard 
              key={v.id} 
              v={v} 
              onClick={() => console.log('Visit clicked:', v.id)} 
            />
          ))}
        </div>
      )}

      {/* Modal Nuova Visita */}
      {newVisitOpen && (
        <div className="modal" onClick={() => setNewVisitOpen(false)}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>Nuova Visita</h3>
            <form onSubmit={onCreate} className="medical-grid">
              <div className="row">
                <input 
                  className="input" 
                  name="playerId" 
                  placeholder="ID Giocatore" 
                  value={formData.playerId || ''}
                  onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                  required 
                />
                <select 
                  className="select" 
                  name="visitType" 
                  value={formData.visitType || VisitType.INJURY_ASSESSMENT}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                >
                  {Object.keys(VisitType).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="row">
                <input 
                  className="input" 
                  name="visitDate" 
                  type="datetime-local" 
                  value={formData.visitDate || ''}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  required 
                />
                <input 
                  className="input" 
                  name="doctor" 
                  placeholder="Medico" 
                  value={formData.doctor || ''}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                />
              </div>
              <div className="row">
                <input 
                  className="input" 
                  name="followUp" 
                  type="datetime-local" 
                  placeholder="Follow-up"
                  value={formData.followUp || ''}
                  onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                />
                <input 
                  className="input" 
                  name="injuryId" 
                  placeholder="ID Infortunio (opzionale)"
                  value={formData.injuryId || ''}
                  onChange={(e) => setFormData({ ...formData, injuryId: e.target.value })}
                />
              </div>
              <textarea 
                className="input" 
                name="notes" 
                placeholder="Note" 
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <div className="row" style={{ justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setNewVisitOpen(false)}>Annulla</button>
                <button type="submit" className="btn primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
