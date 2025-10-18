// client_v3/src/pages/scouting/SessionCreateModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, Activity, Target, Eye, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/design-system/ds/Dialog';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import { apiFetch } from '@/utils/apiClient';
import FormationSection from '@/modules/scouting/components/FormationSection';

const enumOptions = {
  observationType: [
    { value: 'LIVE', label: 'Partita Live' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'TRAINING', label: 'Allenamento' },
    { value: 'TOURNAMENT', label: 'Torneo' }
  ],
  rolePlayed: [
    { value: 'GK', label: 'Portiere' },
    { value: 'CB', label: 'Difensore Centrale' },
    { value: 'FB', label: 'Terzino' },
    { value: 'DM', label: 'Mediano' },
    { value: 'CM', label: 'Centrocampista' },
    { value: 'AM', label: 'Trequartista' },
    { value: 'W', label: 'Ala' },
    { value: 'CF', label: 'Attaccante' }
  ],
  prospectTeamSide: [
    { value: 'HOME', label: 'Squadra di Casa' },
    { value: 'AWAY', label: 'Squadra in Trasferta' }
  ],
};

function toIsoDate(value) {
  if (!value) return undefined;
  try { return new Date(value).toISOString(); } catch { return undefined; }
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function SessionCreateModal({ open, onClose, onSuccess, editing = null, prospectId = null }) {
  const isEdit = !!editing?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [loadingProspects, setLoadingProspects] = useState(false);

  const initial = useMemo(() => ({
    prospectId: editing?.prospectId || prospectId || '',
    observationType: editing?.observationType || 'LIVE',
    dateObserved: editing?.dateObserved ? String(editing.dateObserved).substring(0,10) : '',
    location: editing?.location || '',
    opponent: editing?.opponent || '',
    competition: editing?.competition || '',
    minutesPlayed: editing?.minutesPlayed ?? '',
    rolePlayed: editing?.rolePlayed || '',
    rating: editing?.rating ?? '',
    notes: editing?.notes || '',
    prospectTeamSide: editing?.prospectTeamSide || 'HOME',
  }), [editing, prospectId]);

  const [form, setForm] = useState(initial);
  useEffect(() => { 
    setForm(initial); 
    setError(null); 
  }, [initial, open]);

  // Aggiorna il form quando cambia il prospectId passato come prop
  useEffect(() => {
    if (prospectId && !editing?.id) {
      setForm(prev => ({ ...prev, prospectId }));
    }
  }, [prospectId, editing?.id]);

  // Carica la lista dei prospect quando si apre la modale
  useEffect(() => {
    if (open) {
      fetchProspects();
    }
  }, [open, prospectId]);

  const fetchProspects = async () => {
    try {
      setLoadingProspects(true);
      const response = await apiFetch('/scouting/prospects');
      const data = Array.isArray(response?.data) ? response.data : response;
      setProspects(data || []);
    } catch (err) {
      console.error('Errore caricamento prospect:', err);
      setProspects([]);
    } finally {
      setLoadingProspects(false);
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function onSubmit(e) {
    e?.preventDefault?.();
    setSaving(true); setError(null);
    try {
      const payload = {
        prospectId: form.prospectId || undefined,
        observationType: form.observationType || 'LIVE',
        dateObserved: toIsoDate(form.dateObserved),
        location: form.location || undefined,
        opponent: form.opponent || undefined,
        competition: form.competition || undefined,
        minutesPlayed: parseNumber(form.minutesPlayed),
        rolePlayed: form.rolePlayed || undefined,
        rating: parseNumber(form.rating),
        notes: form.notes || undefined,
      };

      // Rimuovi chiavi undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      let response;
      if (isEdit) {
        response = await apiFetch(`/scouting/sessions/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        response = await apiFetch('/scouting/sessions', { method: 'POST', body: JSON.stringify(payload) });
      }

      // Se è una nuova sessione, salva l'ID per applicare la formazione
      if (!isEdit && response?.data?.id) {
        localStorage.setItem('newSessionId', response.data.id);
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose?.(); }}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity size={24} className="text-primary" />
              {isEdit ? 'Modifica Sessione' : 'Nuova Sessione'}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? 'Modifica i dettagli della sessione esistente' : 'Crea una nuova sessione di osservazione'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 space-y-6">
            {error && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}

            {/* Informazioni Base */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={20} className="text-blue-500" />
                  Informazioni Base
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Prospect *</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.prospectId} 
                      onChange={e=>set('prospectId', e.target.value)}
                      disabled={loadingProspects}
                      required 
                    >
                      <option value="">
                        {loadingProspects ? 'Caricamento prospect...' : 'Seleziona prospect'}
                      </option>
                      {prospects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.lastName?.toUpperCase()} {prospect.firstName} 
                          {prospect.mainPosition && ` - ${prospect.mainPosition}`}
                          {prospect.currentClub && ` (${prospect.currentClub})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Tipo Osservazione</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.observationType} 
                      onChange={e=>set('observationType', e.target.value)}
                    >
                      {enumOptions.observationType.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Data Osservazione</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.dateObserved} 
                      onChange={e=>set('dateObserved', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Luogo</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.location} 
                      onChange={e=>set('location', e.target.value)} 
                      placeholder="Stadio, campo, struttura..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contesto Partita */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target size={20} className="text-green-500" />
                  Contesto Partita
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Avversario</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.opponent} 
                      onChange={e=>set('opponent', e.target.value)} 
                      placeholder="Nome squadra avversaria"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Competizione</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.competition} 
                      onChange={e=>set('competition', e.target.value)} 
                      placeholder="Serie A, Champions League, Coppa..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Squadra del Prospect</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.prospectTeamSide} 
                      onChange={e=>set('prospectTeamSide', e.target.value)}
                    >
                      {enumOptions.prospectTeamSide.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formazione in campo */}
            <section className="mt-6 space-y-3 border-t pt-4">
              <h3 className="text-lg font-semibold">Formazione in campo</h3>
              <FormationSection 
                sessionId={editing?.id} 
                isCreating={!editing?.id}
                onSessionCreated={onSuccess}
                prospectTeamSide={form.prospectTeamSide}
                prospectRole={form.rolePlayed}
              />
            </section>

            {/* Performance */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Eye size={20} className="text-orange-500" />
                  Performance
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Minuti Giocati</label>
                    <input 
                      type="number"
                      min="0"
                      max="120"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.minutesPlayed} 
                      onChange={e=>set('minutesPlayed', e.target.value)} 
                      placeholder="90"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Ruolo Giocato</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.rolePlayed} 
                      onChange={e=>set('rolePlayed', e.target.value)}
                    >
                      <option value="">Seleziona ruolo</option>
                      {enumOptions.rolePlayed.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Rating (1-10)</label>
                    <input 
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.rating} 
                      onChange={e=>set('rating', e.target.value)} 
                      placeholder="7.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note e Osservazioni */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText size={20} className="text-purple-500" />
                  Note e Osservazioni
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Note</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows={4} 
                    value={form.notes} 
                    onChange={e=>set('notes', e.target.value)} 
                    placeholder="Note dettagliate sulla sessione di osservazione, punti di forza, debolezze, situazioni particolari..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Salvataggio…' : (isEdit ? 'Salva modifiche' : 'Crea sessione')}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
