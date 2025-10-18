// client_v3/src/pages/scouting/ReportCreateModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Target, FileText, Link, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ui/dialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import { apiFetch } from '@/utils/apiClient';

const ReportCreateModal = ({ isOpen, onClose, onSuccess, editingReport = null, prospectId = null, sessionId = null }) => {
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    prospectId: '',
    sessionId: '',
    matchDate: '',
    opponent: '',
    competition: '',
    rolePlayed: '',
    minutesPlayed: '',
    techniqueScore: '',
    tacticsScore: '',
    physicalScore: '',
    mentalityScore: '',
    summary: '',
    videoLink: '',
    attachmentUrl: ''
  });

  // Carica prospects e sessions
  useEffect(() => {
    if (isOpen) {
      loadProspects();
      loadSessions();
    }
  }, [isOpen]);

  // Pre-compila form se editing o se prospectId/sessionId sono forniti
  useEffect(() => {
    if (editingReport) {
      setForm({
        prospectId: editingReport.prospectId || '',
        sessionId: editingReport.sessionId || '',
        matchDate: editingReport.matchDate ? new Date(editingReport.matchDate).toISOString().split('T')[0] : '',
        opponent: editingReport.opponent || '',
        competition: editingReport.competition || '',
        rolePlayed: editingReport.rolePlayed || '',
        minutesPlayed: editingReport.minutesPlayed || '',
        techniqueScore: editingReport.techniqueScore || '',
        tacticsScore: editingReport.tacticsScore || '',
        physicalScore: editingReport.physicalScore || '',
        mentalityScore: editingReport.mentalityScore || '',
        summary: editingReport.summary || '',
        videoLink: editingReport.videoLink || '',
        attachmentUrl: editingReport.attachmentUrl || ''
      });
    } else if (prospectId) {
      setForm(prev => ({ ...prev, prospectId }));
    } else if (sessionId) {
      setForm(prev => ({ ...prev, sessionId }));
      // Pre-compila da sessione se disponibile
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setForm(prev => ({
          ...prev,
          prospectId: session.prospectId,
          matchDate: session.dateObserved ? new Date(session.dateObserved).toISOString().split('T')[0] : '',
          opponent: session.opponent || '',
          competition: session.competition || '',
          rolePlayed: session.rolePlayed || '',
          minutesPlayed: session.minutesPlayed || ''
        }));
      }
    }
  }, [editingReport, prospectId, sessionId, sessions]);

  // Pre-compila automaticamente quando cambia la selezione della sessione
  useEffect(() => {
    if (form.sessionId && sessions.length > 0) {
      const selectedSession = sessions.find(s => s.id === form.sessionId);
      if (selectedSession) {
        setForm(prev => ({
          ...prev,
          // Pre-compila prospect se non già selezionato
          prospectId: prev.prospectId || selectedSession.prospectId,
          // Pre-compila tutti i dettagli della partita dalla sessione
          matchDate: selectedSession.dateObserved ? new Date(selectedSession.dateObserved).toISOString().split('T')[0] : prev.matchDate,
          opponent: selectedSession.opponent || prev.opponent,
          competition: selectedSession.competition || prev.competition,
          rolePlayed: selectedSession.rolePlayed || prev.rolePlayed,
          minutesPlayed: selectedSession.minutesPlayed || prev.minutesPlayed
        }));
      }
    }
  }, [form.sessionId, sessions]);

  const loadProspects = async () => {
    try {
      const response = await apiFetch('/scouting/prospects');
      const data = Array.isArray(response?.data) ? response.data : response;
      setProspects(data || []);
    } catch (error) {
      console.error('Error loading prospects:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await apiFetch('/scouting/sessions');
      const data = Array.isArray(response?.data) ? response.data : response;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reportData = {
        prospectId: form.prospectId,
        sessionId: form.sessionId || null,
        matchDate: form.matchDate ? new Date(form.matchDate).toISOString() : null,
        opponent: form.opponent || null,
        competition: form.competition || null,
        rolePlayed: form.rolePlayed || null,
        minutesPlayed: form.minutesPlayed ? parseInt(form.minutesPlayed) : null,
        techniqueScore: form.techniqueScore ? parseFloat(form.techniqueScore) : null,
        tacticsScore: form.tacticsScore ? parseFloat(form.tacticsScore) : null,
        physicalScore: form.physicalScore ? parseFloat(form.physicalScore) : null,
        mentalityScore: form.mentalityScore ? parseFloat(form.mentalityScore) : null,
        summary: form.summary || null,
        videoLink: form.videoLink || null,
        attachmentUrl: form.attachmentUrl || null
      };

      if (editingReport) {
        await apiFetch(`/scouting/reports/${editingReport.id}`, {
          method: 'PUT',
          body: JSON.stringify(reportData)
        });
      } else {
        await apiFetch('/scouting/reports', {
          method: 'POST',
          body: JSON.stringify(reportData)
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'FB': 'Terzino',
      'DM': 'Mediano',
      'CM': 'Centrocampista',
      'AM': 'Trequartista',
      'W': 'Ala',
      'CF': 'Attaccante'
    };
    return roles[role] || role;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={24} />
            {editingReport ? 'Modifica Report' : 'Nuovo Report'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informazioni Prospect e Sessione */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Informazioni Base</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prospect *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.prospectId}
                    onChange={(e) => setForm({...form, prospectId: e.target.value})}
                    required
                  >
                    <option value="">Seleziona prospect</option>
                    {prospects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || `${p.firstName} ${p.lastName}`} - {getRoleLabel(p.mainPosition)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sessione (opzionale)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.sessionId}
                    onChange={(e) => setForm({...form, sessionId: e.target.value})}
                  >
                    <option value="">Nessuna sessione</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.prospect?.fullName || 'N/A'} - {s.dateObserved ? new Date(s.dateObserved).toLocaleDateString('it-IT') : 'N/A'}{s.opponent ? ` vs ${s.opponent}` : ''}{s.competition ? ` (${s.competition})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dettagli Partita */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Dettagli Partita</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Partita
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.matchDate}
                    onChange={(e) => setForm({...form, matchDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avversario
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome squadra avversaria"
                    value={form.opponent}
                    onChange={(e) => setForm({...form, opponent: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Competizione
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Serie A, Champions League..."
                    value={form.competition}
                    onChange={(e) => setForm({...form, competition: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ruolo Giocato
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.rolePlayed}
                    onChange={(e) => setForm({...form, rolePlayed: e.target.value})}
                  >
                    <option value="">Seleziona ruolo</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minuti Giocati
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="90"
                    value={form.minutesPlayed}
                    onChange={(e) => setForm({...form, minutesPlayed: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valutazioni Tecniche */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold">Valutazioni Tecniche (0-10)</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tecnica
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="7.5"
                    value={form.techniqueScore}
                    onChange={(e) => setForm({...form, techniqueScore: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tattica
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8.0"
                    value={form.tacticsScore}
                    onChange={(e) => setForm({...form, tacticsScore: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fisico
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="7.0"
                    value={form.physicalScore}
                    onChange={(e) => setForm({...form, physicalScore: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mentalità
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8.5"
                    value={form.mentalityScore}
                    onChange={(e) => setForm({...form, mentalityScore: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note e Allegati */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold">Note e Allegati</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Riassunto Performance
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrizione dettagliata della performance del giocatore..."
                    value={form.summary}
                    onChange={(e) => setForm({...form, summary: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link Video
                    </label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=..."
                      value={form.videoLink}
                      onChange={(e) => setForm({...form, videoLink: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Allegato
                    </label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/document.pdf"
                      value={form.attachmentUrl}
                      onChange={(e) => setForm({...form, attachmentUrl: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {editingReport ? 'Aggiorna Report' : 'Crea Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportCreateModal;
