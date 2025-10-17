// client_v3/src/components/market/ScoutingModal.jsx
import React, { useState } from 'react';
import Card, { CardContent } from '@/design-system/ds/Card';

export default function ScoutingModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => ({
    player_name: initial?.player_name || '',
    match_observed: initial?.match_observed || '',
    rating: initial?.rating || '',
    notes: initial?.notes || ''
  }));

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      player_name: form.player_name,
      match_observed: form.match_observed,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <Card className="w-full max-w-xl">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Nuovo Report Scouting</h3>
            <button onClick={onClose} className="text-sm text-gray-600">Chiudi</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Nome giocatore</label>
                <input name="player_name" value={form.player_name} onChange={handleChange} className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-[#0f1424]" />
              </div>
              <div>
                <label className="text-sm">Match osservato</label>
                <input name="match_observed" value={form.match_observed} onChange={handleChange} className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-[#0f1424]" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Rating</label>
                <input name="rating" value={form.rating} onChange={handleChange} className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-[#0f1424]" />
              </div>
            </div>
            <div>
              <label className="text-sm">Note</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-[#0f1424]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800">Annulla</button>
              <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-white">Salva</button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



























