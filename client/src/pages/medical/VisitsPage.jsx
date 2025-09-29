// client/src/pages/medical/VisitsPage.jsx
// Pagina Visite Mediche standardizzata - VERSIONE CORRETTA

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listVisits, createVisit } from '../../services/medical/visitService';
import VisitsKPICards from '../../components/medical/VisitsKPICards';
import VisitsTimeline from '../../components/medical/VisitsTimeline';
import VisitsCalendar from '../../components/medical/VisitsCalendar';
import TwoFAModal from '../../components/auth/TwoFAModal';
import '../../styles/contracts.css';

export default function VisitsPage() {
  const qc = useQueryClient();
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingVisitData, setPendingVisitData] = useState(null);
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });
  const [players, setPlayers] = useState([]);

  // Query per le visite
  const { data, isLoading, error } = useQuery({
    queryKey: ['visits'],
    queryFn: () => listVisits(),
  });

  // Mutation per creare visita
  const createMut = useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setNewVisitOpen(false);
      setFormData({});
      setFeedbackDialog({ 
        isOpen: true, 
        message: 'Visita medica creata con successo', 
        type: 'success' 
      });
    },
    onError: (error) => {
      if (error.status === 428) {
        setPendingVisitData(formData);
        setShow2FAModal(true);
      } else {
        setFeedbackDialog({
          isOpen: true,
          message: error.message || 'Errore durante la creazione della visita',
          type: 'error'
        });
      }
    }
  });

  // Gestione successo 2FA
  const handleTwoFASuccess = async (twoFAToken) => {
    if (!pendingVisitData) return;

    try {
      const { http } = await import('../../services/medical/http');
      
      await http.post('/medical/visits', pendingVisitData, {
        'X-2FA-Code': twoFAToken
      });

      qc.invalidateQueries({ queryKey: ['visits'] });
      setNewVisitOpen(false);
      setFormData({});
      setPendingVisitData(null);
      setShow2FAModal(false);
      setFeedbackDialog({ 
        isOpen: true, 
        message: 'Visita medica creata con successo (2FA verificato)', 
        type: 'success' 
      });

    } catch (error) {
      setShow2FAModal(false);
      
      let cleanMessage = error.message || 'Errore durante la creazione con 2FA';
      cleanMessage = cleanMessage.replace(/<[^>]*>/g, '');
      if (cleanMessage.includes('Cannot POST')) {
        cleanMessage = 'Impossibile salvare la visita. Verifica i dati inseriti.';
      }
      
      setFeedbackDialog({
        isOpen: true,
        message: cleanMessage,
        type: 'error'
      });
    }
  };

  // Filtra le visite
  const filteredRows = useMemo(() => {
    if (!data?.data?.items) return [];
    
    return data.data.items.filter(visit => {
      const matchesSearch = !searchTerm || 
        (visit.player?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         visit.player?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         visit.doctor?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !statusFilter || visit.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [data?.data, searchTerm, statusFilter]);

  // Gestione creazione visita
  const handleCreateVisit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      visitDate: formData.visitDate || new Date().toISOString(),
      status: formData.status || 'SCHEDULED'
    };
    createMut.mutate(payload);
  };

  // Carica giocatori
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/players', { credentials: 'include' });
        if (!res.ok) throw new Error('Errore caricamento giocatori');
        const json = await res.json();
        const items = (json.data || []).map(p => {
          return {
            id: p.id,
            name: `${p.lastName} ${p.firstName}`,
            sortKey: `${p.lastName} ${p.firstName}`
          };
        }).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        setPlayers(items);
      } catch (e) {
        console.error('Errore fetch players', e.message);
        setPlayers([]);
      }
    };
    fetchPlayers();
  }, []);

  return (
    <div className="medical-page">
      {/* Header stile sezione contratti */}
      <div className="contracts-header">
        <div className="header-left">
          <h2>Visite Mediche</h2>
          <p>{filteredRows.length} visite trovate</p>
        </div>
        <div className="header-right">
          <button className="btn primary" onClick={() => setNewVisitOpen(true)}>
            + Nuova Visita
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {!isLoading && data?.data?.items && (
        <div className="kpi-section" style={{ marginBottom: '24px' }}>
          <VisitsKPICards data={data.data.items} />
        </div>
      )}

      {/* Calendario Visite */}
      {!isLoading && data?.data?.items && (
        <div className="calendar-section" style={{ marginBottom: '24px' }}>
          <VisitsCalendar data={data.data.items} />
        </div>
      )}

      {/* Barra filtri */}
      <div className="contracts-stats" style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom: '12px' }}>
        <div className="search-box">
          <input
            type="text"
            placeholder="Cerca giocatori o medici..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select"
        >
          <option value="">Tutti gli status</option>
          <option value="SCHEDULED">Programmata</option>
          <option value="PENDING">In Attesa</option>
          <option value="COMPLETED">Completata</option>
          <option value="CANCELLED">Annullata</option>
        </select>
      </div>

      {/* Tabella visite */}
      {isLoading ? (
        <div className="table-wrapper">
          <div style={{ padding: '20px', textAlign: 'center' }}>Caricamento...</div>
        </div>
      ) : error ? (
        <div className="table-wrapper">
          <div style={{ padding: '20px', color: 'var(--color-danger)', textAlign: 'center' }}>
            Errore: {error.message}
          </div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="table-wrapper">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Nessuna visita trovata</p>
            <button className="btn primary" onClick={() => setNewVisitOpen(true)}>
              + Nuova Visita
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data e Ora</th>
                <th>Giocatore</th>
                <th>Tipo Visita</th>
                <th>Medico</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="date-content">
                      <span>{new Date(visit.visitDate).toLocaleDateString('it-IT')}</span>
                      <span className="time-info">
                        {new Date(visit.visitDate).toLocaleTimeString('it-IT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="player-info">
                      <span>{visit.player?.firstName} {visit.player?.lastName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="visit-type">
                      {visit.visitType === 'ROUTINE_CHECKUP' && 'Controllo di Routine'}
                      {visit.visitType === 'INJURY_ASSESSMENT' && 'Valutazione Infortunio'}
                      {visit.visitType === 'SPECIALIST_VISIT' && 'Visita Specialistica'}
                      {visit.visitType === 'FITNESS_ASSESSMENT' && 'Valutazione Idoneità'}
                      {visit.visitType === 'EMERGENCY' && 'Emergenza'}
                      {visit.visitType === 'FOLLOW_UP' && 'Controllo Follow-up'}
                      {!visit.visitType && 'Non specificato'}
                    </span>
                  </td>
                  <td>
                    <span>{visit.doctor || 'Non specificato'}</span>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-badge ${visit.status?.toLowerCase()}`}>
                        {visit.status === 'COMPLETED' && 'Completata'}
                        {visit.status === 'SCHEDULED' && 'Programmata'}
                        {visit.status === 'PENDING' && 'In Attesa'}
                        {visit.status === 'CANCELLED' && 'Annullata'}
                        {!visit.status && 'Non specificato'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="visit-notes">
                      {visit.notes ? (visit.notes.length > 50 ? visit.notes.substring(0, 50) + '...' : visit.notes) : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuova Visita */}
      {newVisitOpen && (
        <div className="modal" onClick={() => setNewVisitOpen(false)}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>Nuova Visita Medica</h3>
            <form onSubmit={handleCreateVisit} className="medical-grid">
              <div className="row">
                <select 
                  className="select" 
                  name="playerId" 
                  value={formData.playerId || ''}
                  onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                  required
                >
                  <option value="">Seleziona giocatore</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                
                <select 
                  className="select" 
                  name="visitType" 
                  value={formData.visitType || ''}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  required
                >
                  <option value="">Seleziona tipo visita</option>
                  <option value="ROUTINE_CHECKUP">Controllo di Routine</option>
                  <option value="INJURY_ASSESSMENT">Valutazione Infortunio</option>
                  <option value="SPECIALIST_VISIT">Visita Specialistica</option>
                  <option value="FITNESS_ASSESSMENT">Valutazione Idoneità</option>
                  <option value="EMERGENCY">Emergenza</option>
                  <option value="FOLLOW_UP">Controllo Follow-up</option>
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
                  placeholder="Nome del medico" 
                  value={formData.doctor || ''}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                />
              </div>
              
              <div className="row">
                <select 
                  className="select" 
                  name="status" 
                  value={formData.status || 'SCHEDULED'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="SCHEDULED">Programmata</option>
                  <option value="PENDING">In Attesa</option>
                  <option value="COMPLETED">Completata</option>
                  <option value="CANCELLED">Annullata</option>
                </select>
                
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
                placeholder="Note sulla visita" 
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              
              <div className="row" style={{ justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setNewVisitOpen(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2FA */}
      <TwoFAModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setPendingVisitData(null);
        }}
        mode="verify"
        onSuccess={handleTwoFASuccess}
        title="Verifica 2FA - Creazione Visita Medica"
      />

      {/* Feedback dialog uniforme */}
      {feedbackDialog.isOpen && (
        <div className="modal" onClick={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: feedbackDialog.type === 'error' ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {feedbackDialog.type === 'error' ? 'Attenzione!' : 'Operazione completata'}
            </h3>
            <p style={{ margin: '8px 0 16px 0' }}>{feedbackDialog.message}</p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
              <button className="btn primary" onClick={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Visite per Mese */}
      <div className="dashboard-section" style={{ marginTop: '2rem' }}>
        <VisitsTimeline data={data?.data?.items || []} />
      </div>
    </div>
  );
}