// client_v3/src/components/market/TargetModal.jsx
// Modale per la creazione/modifica dei target di mercato

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/design-system/ds/Button';

export default function TargetModal({ open, onClose, onSubmit, initial, isViewMode = false }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    nationality: '',
    position: '',
    date_of_birth: '',
    age: '',
    foot: '',
    height_cm: '',
    weight_kg: '',
    current_club: '',
    club_country: '',
    contract_until: '',
    current_salary: '',
    market_value: '',
    priority: 3,
    status: 'SCOUTING',
    agentId: '',
    agent_contact_name: '',
    agent_contact_phone: '',
    scouting_report: '',
    overall_rating: '',
    potential_rating: '',
    transfer_likelihood: '',
    video_url: '',
    profile_url: '',
    notes: ''
  });

  // Inizializza form quando si apre in modalità edit
  useEffect(() => {
    if (initial) {
      setForm({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        nationality: initial.nationality || '',
        position: initial.position || '',
        date_of_birth: initial.date_of_birth ? initial.date_of_birth.split('T')[0] : '',
        age: initial.age || '',
        foot: initial.foot || '',
        height_cm: initial.height_cm || '',
        weight_kg: initial.weight_kg || '',
        current_club: initial.current_club || '',
        club_country: initial.club_country || '',
        contract_until: initial.contract_until ? initial.contract_until.split('T')[0] : '',
        current_salary: initial.current_salary || '',
        market_value: initial.market_value || '',
        priority: initial.priority || 3,
        status: initial.status || 'SCOUTING',
        agentId: initial.agentId || '',
        agent_contact_name: initial.agent_contact_name || '',
        agent_contact_phone: initial.agent_contact_phone || '',
        scouting_report: initial.scouting_report || '',
        overall_rating: initial.overall_rating || '',
        potential_rating: initial.potential_rating || '',
        transfer_likelihood: initial.transfer_likelihood || '',
        video_url: initial.video_url || '',
        profile_url: initial.profile_url || '',
        notes: initial.notes || ''
      });
    } else {
      // Reset form for new target
      setForm({
        first_name: '',
        last_name: '',
        nationality: '',
        position: '',
        date_of_birth: '',
        age: '',
        foot: '',
        height_cm: '',
        weight_kg: '',
        current_club: '',
        club_country: '',
        contract_until: '',
        current_salary: '',
        market_value: '',
        priority: 3,
        status: 'SCOUTING',
        agentId: '',
        agent_contact_name: '',
        agent_contact_phone: '',
        scouting_report: '',
        overall_rating: '',
        potential_rating: '',
        transfer_likelihood: '',
        video_url: '',
        profile_url: '',
        notes: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) return;
    
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      nationality: form.nationality || null,
      position: form.position || null,
      date_of_birth: form.date_of_birth || null,
      age: form.age ? Number(form.age) : null,
      foot: form.foot || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      current_club: form.current_club || null,
      club_country: form.club_country || null,
      contract_until: form.contract_until || null,
      current_salary: form.current_salary || null,
      market_value: form.market_value || null,
      priority: Number(form.priority),
      status: form.status,
      agentId: form.agentId ? Number(form.agentId) : null,
      agent_contact_name: form.agent_contact_name || null,
      agent_contact_phone: form.agent_contact_phone || null,
      scouting_report: form.scouting_report || null,
      overall_rating: form.overall_rating ? Number(form.overall_rating) : null,
      potential_rating: form.potential_rating ? Number(form.potential_rating) : null,
      transfer_likelihood: form.transfer_likelihood ? Number(form.transfer_likelihood) : null,
      video_url: form.video_url || null,
      profile_url: form.profile_url || null,
      notes: form.notes || null
    };
    onSubmit(payload);
  };

  const getFieldProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    disabled: isViewMode,
    className: `w-full mt-1 rounded-md border px-3 py-2 ${isViewMode ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-[#0f1424]'}`
  });

  const modalTitle = isViewMode ? 'Dettaglio Obiettivo' : (initial ? 'Modifica Obiettivo' : 'Nuovo Obiettivo');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dati Anagrafici */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dati Anagrafici</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input {...getFieldProps('first_name')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cognome <span className="text-red-500">*</span>
                  </label>
                  <input {...getFieldProps('last_name')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nazionalità</label>
                  <input {...getFieldProps('nationality')} placeholder="es. Italiana" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ruolo</label>
                  <select {...getFieldProps('position')}>
                    <option value="">Seleziona...</option>
                    <option value="POR">Portiere</option>
                    <option value="DIF">Difensore</option>
                    <option value="CEN">Centrocampista</option>
                    <option value="ATT">Attaccante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data di Nascita</label>
                  <input type="date" {...getFieldProps('date_of_birth')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Età</label>
                  <input type="number" {...getFieldProps('age')} placeholder="es. 25" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Piede</label>
                  <select {...getFieldProps('foot')}>
                    <option value="">Seleziona...</option>
                    <option value="Destro">Destro</option>
                    <option value="Sinistro">Sinistro</option>
                    <option value="Ambidestro">Ambidestro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Altezza (cm)</label>
                  <input type="number" {...getFieldProps('height_cm')} placeholder="es. 180" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Peso (kg)</label>
                  <input type="number" {...getFieldProps('weight_kg')} placeholder="es. 75" />
                </div>
              </div>
            </section>

            {/* Club Attuale */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Club e Contratto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Club Attuale</label>
                  <input {...getFieldProps('current_club')} placeholder="es. Inter" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paese</label>
                  <input {...getFieldProps('club_country')} placeholder="es. Italia" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contratto Fino a</label>
                  <input type="date" {...getFieldProps('contract_until')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stipendio Attuale (€)</label>
                  <input {...getFieldProps('current_salary')} placeholder="es. 1000000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valore di Mercato (€)</label>
                  <input {...getFieldProps('market_value')} placeholder="es. 5000000" />
                </div>
              </div>
            </section>

            {/* Stato e Priorità */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stato e Priorità</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priorità</label>
                  <select {...getFieldProps('priority')}>
                    <option value="1">1 - Massima</option>
                    <option value="2">2 - Alta</option>
                    <option value="3">3 - Media</option>
                    <option value="4">4 - Bassa</option>
                    <option value="5">5 - Minima</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stato</label>
                  <select {...getFieldProps('status')}>
                    <option value="SCOUTING">Scouting</option>
                    <option value="INTERESTED">Interessato</option>
                    <option value="CONTACT">Contattato</option>
                    <option value="NEGOTIATING">Negoziazione</option>
                    <option value="OFFER_SENT">Offerta Inviata</option>
                    <option value="SIGNED">Firmato</option>
                    <option value="REJECTED">Rifiutato</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Valutazioni Scouting */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valutazioni Scouting</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rating Complessivo</label>
                  <input type="number" step="0.1" {...getFieldProps('overall_rating')} placeholder="es. 7.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Potenziale</label>
                  <input type="number" step="0.1" {...getFieldProps('potential_rating')} placeholder="es. 8.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prob. Trasferimento (%)</label>
                  <input type="number" step="1" {...getFieldProps('transfer_likelihood')} placeholder="es. 75" />
                </div>
              </div>
            </section>

            {/* Agente */}
            <section>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contatti Agente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Agente</label>
                  <input {...getFieldProps('agent_contact_name')} placeholder="es. Mario Rossi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefono Agente</label>
                  <input {...getFieldProps('agent_contact_phone')} placeholder="es. +39 123 456 7890" />
                </div>
              </div>
            </section>

            {/* Note e URL */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documenti e Note</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Scouting</label>
                  <textarea {...getFieldProps('scouting_report')} rows="3" placeholder="Note dettagliate sullo scouting..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Video URL</label>
                  <input {...getFieldProps('video_url')} placeholder="es. https://youtube.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile URL (Transfermarkt, Wyscout, ecc.)</label>
                  <input {...getFieldProps('profile_url')} placeholder="es. https://transfermarkt.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note Aggiuntive</label>
                  <textarea {...getFieldProps('notes')} rows="3" placeholder="Note generali..." />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {!isViewMode && (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" onClick={handleSubmit}>
                {initial ? 'Aggiorna' : 'Crea Obiettivo'}
              </Button>
            </>
          )}
          {isViewMode && (
            <Button type="button" onClick={onClose}>
              Chiudi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
