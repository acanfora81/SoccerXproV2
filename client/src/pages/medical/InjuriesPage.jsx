import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInjuries, createInjury, updateInjury } from '../../services/medical/injuryService';
import { InjurySeverity, BodyPart, InjuryType, InjuryStatus } from '../../utils/enums';
import MedicalSeverityBadge from '../../components/medical/MedicalSeverityBadge';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';
import { useMedicalUIStore } from '../../store/medical/useMedicalUIStore';

export default function InjuriesPage() {
  const qc = useQueryClient();
  const { newInjuryOpen, setNewInjuryOpen, injuryFilters, setInjuryFilters } = useMedicalUIStore();
  const [formData, setFormData] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['injuries', injuryFilters],
    queryFn: () => listInjuries(injuryFilters),
  });

  const createMut = useMutation({
    mutationFn: createInjury,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['injuries'] });
      setNewInjuryOpen(false);
      setFormData({});
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => updateInjury(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['injuries'] }),
  });

  const onCreate = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      severity: formData.severity || InjurySeverity.MINOR,
      bodyPart: formData.bodyPart || BodyPart.THIGH,
      injuryType: formData.injuryType || InjuryType.OTHER,
      injuryDate: formData.injuryDate || new Date().toISOString(),
      status: InjuryStatus.ACTIVE,
    };
    createMut.mutate(payload);
  };

  const handleCloseInjury = (id) => {
    updateMut.mutate({ 
      id, 
      patch: { 
        status: InjuryStatus.HEALED, 
        actualReturn: new Date().toISOString() 
      } 
    });
  };

  const handlePromoteToCase = (id) => {
    // Placeholder for Sprint 2
    alert('Promuovi a Caso GDPR → apri wizard (Sprint 2)');
  };

  const rows = data?.items || [];

  return (
    <div className="medical-page">
      <PageHeader
        title="Infortuni"
        subtitle="Gestione base per operatività quotidiana"
        actions={<>
          <button className="btn" onClick={() => setNewInjuryOpen(true)}>+ Nuovo Infortunio</button>
          <select 
            className="select" 
            value={injuryFilters.status} 
            onChange={(e) => setInjuryFilters({ status: e.target.value })}
          >
            <option value="">Tutti</option>
            <option value="ACTIVE">Attivi</option>
            <option value="RECOVERING">In recupero</option>
            <option value="HEALED">Guariti</option>
            <option value="CHRONIC">Cronici</option>
          </select>
        </>}
      />

      <div className="card">
        {isLoading && <div>Caricamento…</div>}
        {error && <div style={{ color:'salmon' }}>Errore: {String(error.message)}</div>}
        
        {rows.length === 0 && !isLoading ? (
          <EmptyState
            title="Nessun infortunio trovato"
            subtitle="Inizia registrando un nuovo infortunio"
            cta={<button className="btn primary" onClick={() => setNewInjuryOpen(true)}>+ Nuovo Infortunio</button>}
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Parte Corpo</th>
                <th>Tipo</th>
                <th>Severità</th>
                <th>Data</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.playerName || `Giocatore ${r.playerId}`}</td>
                  <td>{r.bodyPart}</td>
                  <td>{r.injuryType}</td>
                  <td><MedicalSeverityBadge severity={r.severity} /></td>
                  <td>{new Date(r.injuryDate).toLocaleDateString('it-IT')}</td>
                  <td>
                    <span className={`badge medical-status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {r.status === 'ACTIVE' && (
                        <button 
                          className="btn" 
                          onClick={() => handleCloseInjury(r.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Chiudi
                        </button>
                      )}
                  <button 
                    className="btn" 
                    onClick={() => window.location.href = `/medical/cases/new?injuryId=${r.id}`}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Promuovi a Caso GDPR
                  </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuovo Infortunio */}
      {newInjuryOpen && (
        <div className="modal" onClick={() => setNewInjuryOpen(false)}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>Nuovo Infortunio</h3>
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
                  name="bodyPart" 
                  value={formData.bodyPart || 'THIGH'}
                  onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                >
                  {Object.keys(BodyPart).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="row">
                <select 
                  className="select" 
                  name="injuryType" 
                  value={formData.injuryType || 'OTHER'}
                  onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                >
                  {Object.keys(InjuryType).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <select 
                  className="select" 
                  name="severity" 
                  value={formData.severity || InjurySeverity.MINOR}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  {Object.keys(InjurySeverity).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="row">
                <input 
                  className="input" 
                  name="injuryDate" 
                  type="datetime-local" 
                  value={formData.injuryDate || ''}
                  onChange={(e) => setFormData({ ...formData, injuryDate: e.target.value })}
                />
                <input 
                  className="input" 
                  name="expectedReturn" 
                  type="datetime-local" 
                  placeholder="Ritorno previsto"
                  value={formData.expectedReturn || ''}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                />
              </div>
              <textarea 
                className="input" 
                name="description" 
                placeholder="Descrizione dettagliata" 
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="row" style={{ justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setNewInjuryOpen(false)}>Annulla</button>
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
