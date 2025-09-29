import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInjuries, createInjury, updateInjury } from '../../services/medical/injuryService';
import { InjurySeverity, BodyPart, InjuryType, InjuryStatus } from '../../utils/enums';
import MedicalSeverityBadge from '../../components/medical/MedicalSeverityBadge';
import EmptyState from '../../components/medical/EmptyState';
import { useMedicalUIStore } from '../../store/medical/useMedicalUIStore';
import SkeletonBox, { SkeletonTable } from '../../components/medical/SkeletonBox';
import StatusBadge from '../../components/medical/StatusBadge';
import TwoFAModal from '../../components/auth/TwoFAModal';
import InjuryTimeline from '../../components/medical/InjuryTimeline';
import InjuryKPICards from '../../components/medical/InjuryKPICards';
import '../../styles/contracts.css';

export default function InjuriesPage() {
  // Dizionari etichette ITA per select
  const BodyPartLabels = useMemo(() => ({
    HEAD: 'Testa',
    NECK: 'Collo',
    SHOULDER: 'Spalla',
    ARM: 'Braccio',
    ELBOW: 'Gomito',
    WRIST: 'Polso',
    HAND: 'Mano',
    FINGER: 'Dito',
    CHEST: 'Torace',
    BACK: 'Schiena',
    HIP: 'Anca',
    THIGH: 'Coscia',
    KNEE: 'Ginocchio',
    CALF: 'Polpaccio',
    ANKLE: 'Caviglia',
    FOOT: 'Piede',
    TOE: 'Dito del piede',
    OTHER: 'Altro'
  }), []);

  const InjuryTypeLabels = useMemo(() => ({
    MUSCLE_STRAIN: 'Stiramento muscolare',
    LIGAMENT_TEAR: 'Lesione legamentosa',
    BONE_FRACTURE: 'Frattura ossea',
    CONCUSSION: 'Commozione cerebrale',
    BRUISE: 'Contusione',
    CUT: 'Taglio',
    SPRAIN: 'Distorsione',
    OVERUSE: 'Sovraccarico',
    OTHER: 'Altro'
  }), []);

  const SeverityLabels = useMemo(() => ({
    MINOR: 'Lieve',
    MODERATE: 'Moderata',
    SEVERE: 'Grave'
  }), []);

  const humanize = (key) => key.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  const qc = useQueryClient();
  const { newInjuryOpen, setNewInjuryOpen, injuryFilters, setInjuryFilters } = useMedicalUIStore();
  const [formData, setFormData] = useState({});
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingInjuryData, setPendingInjuryData] = useState(null);

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
      setPendingInjuryData(null);
      setFeedbackDialog({ isOpen: true, message: 'Infortunio creato con successo', type: 'success' });
    },
    onError: (error) => {
      // Se è errore 428 (Precondition Required), richiedi 2FA
      if (error.message.includes('428') || error.message.includes('2FA richiesta') || error.message.includes('Precondition Required')) {
        setPendingInjuryData(formData);
        setShow2FAModal(true);
      } else {
        // Pulisci il messaggio di errore da HTML
        let cleanMessage = error.message || 'Errore durante la creazione dell\'infortunio';
        // Rimuovi tag HTML se presenti
        cleanMessage = cleanMessage.replace(/<[^>]*>/g, '');
        // Traduci messaggi comuni
        if (cleanMessage.includes('Cannot POST')) {
          cleanMessage = 'Impossibile salvare l\'infortunio. Verifica i dati inseriti.';
        }
        
        setFeedbackDialog({
          isOpen: true,
          message: cleanMessage,
          type: 'error'
        });
      }
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => updateInjury(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['injuries'] }),
  });

  const onCreate = (e) => {
    e.preventDefault();
    const payload = {
      playerId: formData.playerId,
      bodyPart: formData.bodyPart,
      injuryType: formData.injuryType,
      severity: formData.severity,
      injuryDate: formData.injuryDate || new Date().toISOString(),
      expectedReturn: formData.expectedReturn || null,
      description: formData.description || '',
      status: InjuryStatus.ACTIVE,
    };
    createMut.mutate(payload);
  };

  // Funzione per retry con 2FA dopo verifica codice
  const handleTwoFASuccess = async (twoFAToken) => {
    if (!pendingInjuryData) return;

    try {
      // Chiama il servizio createInjury con il token 2FA nell'header
      const { http } = await import('../../services/medical/http');
      
      await http.post('/medical/injuries', pendingInjuryData, {
        'X-2FA-Code': twoFAToken
      });

      // Se arriviamo qui, la chiamata è andata a buon fine
      // Successo - aggiorna la cache e UI
      qc.invalidateQueries({ queryKey: ['injuries'] });
      setNewInjuryOpen(false);
      setFormData({});
      setPendingInjuryData(null);
      setShow2FAModal(false);
      setFeedbackDialog({ 
        isOpen: true, 
        message: 'Infortunio creato con successo (2FA verificato)', 
        type: 'success' 
      });

    } catch (error) {
      setShow2FAModal(false);
      
      // Pulisci il messaggio di errore da HTML
      let cleanMessage = error.message || 'Errore durante la creazione con 2FA';
      // Rimuovi tag HTML se presenti
      cleanMessage = cleanMessage.replace(/<[^>]*>/g, '');
      // Traduci messaggi comuni
      if (cleanMessage.includes('Cannot POST')) {
        cleanMessage = 'Impossibile salvare l\'infortunio. Verifica i dati inseriti.';
      }
      
      setFeedbackDialog({
        isOpen: true,
        message: cleanMessage,
        type: 'error'
      });
    }
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
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let r = rows;
    if (term) {
      r = r.filter((i) => (i.playerName || '').toLowerCase().includes(term));
    }
    if (injuryFilters?.status) {
      r = r.filter((i) => i.status === injuryFilters.status);
    }
    return r;
  }, [rows, searchTerm, injuryFilters]);

  // Carica lista giocatori per select a tendina
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/players', { credentials: 'include' });
        if (!res.ok) throw new Error('Errore caricamento giocatori');
        const json = await res.json();
        const items = (json.data || []).map(p => {
          const last = (p.lastName || '').trim();
          const first = (p.firstName || '').trim();
          const display = `${last ? last.toUpperCase() : ''}${last && first ? ' ' : ''}${first}`.trim() || p.email || `#${p.id}`;
          return { id: p.id, name: display, sortKey: `${last.toUpperCase()}|${first.toUpperCase()}` };
        }).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        setPlayers(items);
      } catch (e) {
        console.error('Errore fetch players', e.message);
        setPlayers([]);
      }
    };
    if (newInjuryOpen) fetchPlayers();
  }, [newInjuryOpen]);

  const filteredPlayersList = useMemo(() => {
    const q = playerSearchTerm.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.name.toLowerCase().includes(q));
  }, [players, playerSearchTerm]);

  return (
    <div className="medical-page">
      {/* Header stile sezione contratti */}
      <div className="contracts-header">
        <div className="header-left">
          <h2>Infortuni</h2>
          <p>{filteredRows.length} infortuni trovati</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => setNewInjuryOpen(true)}>
            + Nuovo Infortunio
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {!isLoading && data?.data && (
        <div className="kpi-section" style={{ marginBottom: '24px' }}>
          <InjuryKPICards data={data.data} />
        </div>
      )}

      {/* Barra filtri */}
      <div className="contracts-stats" style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom: '12px' }}>
        <div className="search-box">
          <input
            type="text"
            placeholder="Cerca giocatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            className="filter-select"
            value={injuryFilters.status}
            onChange={(e) => setInjuryFilters({ status: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="ACTIVE">Attivi</option>
            <option value="RECOVERING">In recupero</option>
            <option value="HEALED">Guariti</option>
            <option value="CHRONIC">Cronici</option>
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading && <SkeletonTable rows={5} columns={7} />}
        {error && <div style={{ color:'salmon' }}>Errore: {String(error.message)}</div>}
        
        {rows.length === 0 && !isLoading && !error ? (
          <EmptyState
            title="Nessun infortunio trovato"
            message="Inizia registrando un nuovo infortunio"
            icon="🩹"
            action={<button className="btn primary" onClick={() => setNewInjuryOpen(true)}>+ Nuovo Infortunio</button>}
          />
        ) : !isLoading && !error && rows.length > 0 && (
          <table className="table-enterprise">
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
                  <td><StatusBadge status={r.status} /></td>
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
                <select
                  className="select"
                  name="playerId"
                  value={formData.playerId || ''}
                  onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                  required
                >
                  <option value="" disabled>Seleziona giocatore…</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select 
                  className="select" 
                  name="bodyPart" 
                  value={formData.bodyPart || ''}
                  onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                >
                  <option value="" disabled>Seleziona parte del corpo…</option>
                  {Object.keys(BodyPart).map(k => (
                    <option key={k} value={k}>{BodyPartLabels[k] || humanize(k)}</option>
                  ))}
                </select>
              </div>
              <div className="row">
                <select 
                  className="select" 
                  name="injuryType" 
                  value={formData.injuryType || ''}
                  onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                >
                  <option value="" disabled>Seleziona tipo di infortunio…</option>
                  {Object.keys(InjuryType).map(k => (
                    <option key={k} value={k}>{InjuryTypeLabels[k] || humanize(k)}</option>
                  ))}
                </select>
                <select 
                  className="select" 
                  name="severity" 
                  value={formData.severity || ''}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="" disabled>Seleziona severità…</option>
                  {Object.keys(InjurySeverity).map(k => (
                    <option key={k} value={k}>{SeverityLabels[k] || humanize(k)}</option>
                  ))}
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
                  value={formData.expectedReturn || ''}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                />
              </div>
              <textarea 
                className="input" 
                name="description" 
                placeholder="Dettagli dell'infortunio" 
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

      {/* Modale 2FA per retry dopo errore 428 */}
      <TwoFAModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setPendingInjuryData(null);
        }}
        mode="verify"
        onSuccess={handleTwoFASuccess}
        title="Verifica 2FA - Creazione Infortunio"
      />

      {/* Feedback dialog uniforme */}
      {feedbackDialog.isOpen && (
        <div className="modal" onClick={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: feedbackDialog.type === 'danger' || feedbackDialog.type === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {feedbackDialog.type === 'danger' || feedbackDialog.type === 'warning' ? 'Attenzione!' : 'Operazione completata'}
            </h3>
            <p style={{ margin: '8px 0 16px 0' }}>{feedbackDialog.message}</p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
              <button className="btn primary" onClick={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Infortuni per Mese */}
      <div className="dashboard-section" style={{ marginTop: '2rem' }}>
        <InjuryTimeline data={data?.data || []} />
      </div>
    </div>
  );
}
