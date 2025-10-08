// client_v3/src/components/market/AgentModal.jsx
import React, { useState, useEffect } from 'react';
import Card, { CardContent } from '@/design-system/ds/Card';

export default function AgentModal({ open, onClose, onSubmit, initial, isViewMode = false }) {
  const [form, setForm] = useState(() => ({
    // Dati anagrafici
    first_name: initial?.first_name || '',
    last_name: initial?.last_name || '',
    nationality: initial?.nationality || '',
    date_of_birth: initial?.date_of_birth || '',
    
    // Licenza e stato
    license_number: initial?.license_number || '',
    license_expiry: initial?.license_expiry || '',
    is_certified: initial?.is_certified || false,
    is_verified: initial?.is_verified || false,
    verification_badge_color: initial?.verification_badge_color || '',
    verification_note: initial?.verification_note || '',
    
    // Attivazione
    active: initial?.active !== undefined ? initial.active : true,
    
    // Contatti e agenzia
    agency: initial?.agency || '',
    agency_website: initial?.agency_website || '',
    agency_address: initial?.agency_address || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    secondary_phone: initial?.secondary_phone || '',
    linkedin_url: initial?.linkedin_url || '',
    instagram_url: initial?.instagram_url || '',
    
    // Profilo professionale
    languages: initial?.languages || '',
    specialization: initial?.specialization || '',
    notes: initial?.notes || ''
  }));

  // Aggiorna il form quando cambia initial
  useEffect(() => {
    if (initial) {
      setForm({
        // Dati anagrafici
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        nationality: initial.nationality || '',
        date_of_birth: formatDateForInput(initial.date_of_birth),
        
        // Licenza e stato
        license_number: initial.license_number || '',
        license_expiry: formatDateForInput(initial.license_expiry),
        is_certified: initial.is_certified || false,
        is_verified: initial.is_verified || false,
        verification_badge_color: initial.verification_badge_color || '',
        verification_note: initial.verification_note || '',
        
        // Attivazione
        active: initial.active !== undefined ? initial.active : true,
        
        // Contatti e agenzia
        agency: initial.agency || '',
        agency_website: initial.agency_website || '',
        agency_address: initial.agency_address || '',
        email: initial.email || '',
        phone: initial.phone || '',
        secondary_phone: initial.secondary_phone || '',
        linkedin_url: initial.linkedin_url || '',
        instagram_url: initial.instagram_url || '',
        
        // Profilo professionale
        languages: initial.languages || '',
        specialization: initial.specialization || '',
        notes: initial.notes || ''
      });
    } else {
      // Reset form per nuovo agente
      setForm({
        first_name: '', last_name: '', nationality: '', date_of_birth: '',
        license_number: '', license_expiry: '', is_certified: false, is_verified: false,
        verification_badge_color: '', verification_note: '', active: true,
        agency: '', agency_website: '', agency_address: '', email: '', phone: '',
        secondary_phone: '', linkedin_url: '', instagram_url: '',
        languages: '', specialization: '', notes: ''
      });
    }
  }, [initial]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isViewMode) {
      onSubmit(form);
    }
  };

  // Helper per aggiungere proprietà disabled ai campi
  // Helper per convertire date nel formato YYYY-MM-DD per input HTML
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      // Se è già una stringa, prova a convertirla
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    return '';
  };

  const getFieldProps = (name, required = false) => ({
    name,
    value: form[name] || '',
    onChange: handleChange,
    disabled: isViewMode,
    required: required && !isViewMode,
    className: `w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed`
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header fisso */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isViewMode ? 'Dettagli Agente' : (initial ? 'Modifica Agente' : 'Nuovo Agente')}
          </h3>
          <button 
            onClick={onClose} 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Form con scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* DATI ANAGRAFICI */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dati Anagrafici
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                  <input 
                    {...getFieldProps('first_name', true)}
                    placeholder="Nome" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cognome *</label>
                  <input 
                    {...getFieldProps('last_name', true)}
                    placeholder="Cognome" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nazionalità</label>
                  <input 
                    name="nationality" 
                    value={form.nationality} 
                    onChange={handleChange} 
                    placeholder="Es: Italiana"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data di Nascita</label>
                  <input 
                    name="date_of_birth" 
                    type="date"
                    value={formatDateForInput(form.date_of_birth)} 
                    onChange={handleChange} 
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>

            {/* LICENZA E STATO */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Licenza e Certificazioni
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Numero Licenza</label>
                  <input 
                    name="license_number" 
                    value={form.license_number} 
                    onChange={handleChange} 
                    placeholder="Numero licenza FIFA/FIGC"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scadenza Licenza</label>
                  <input 
                    name="license_expiry" 
                    type="date"
                    value={formatDateForInput(form.license_expiry)} 
                    onChange={handleChange} 
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    name="is_certified" 
                    type="checkbox"
                    checked={form.is_certified} 
                    onChange={handleChange} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Licenza Ufficiale Verificata</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    name="is_verified" 
                    type="checkbox"
                    checked={form.is_verified} 
                    onChange={handleChange} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Badge Verificato</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Colore Badge Verifica</label>
                  <input 
                    name="verification_badge_color" 
                    type="color"
                    value={form.verification_badge_color || '#10b981'} 
                    onChange={handleChange} 
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note Verifica</label>
                  <input 
                    name="verification_note" 
                    value={form.verification_note} 
                    onChange={handleChange} 
                    placeholder="Note sulla verifica"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>

            {/* CONTATTI E AGENZIA */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Contatti e Agenzia
              </h4>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Agenzia</label>
                <input 
                  name="agency" 
                  value={form.agency} 
                  onChange={handleChange} 
                  placeholder="Nome dell'agenzia"
                  className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sito Web Agenzia</label>
                  <input 
                    name="agency_website" 
                    value={form.agency_website} 
                    onChange={handleChange} 
                    placeholder="https://www.agenzia.com"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Indirizzo Agenzia</label>
                  <input 
                    name="agency_address" 
                    value={form.agency_address} 
                    onChange={handleChange} 
                    placeholder="Via, Città, CAP"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input 
                    name="email" 
                    type="email"
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="email@esempio.com"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefono</label>
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    placeholder="+39 123 456 7890"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefono Secondario</label>
                  <input 
                    name="secondary_phone" 
                    value={form.secondary_phone} 
                    onChange={handleChange} 
                    placeholder="+39 123 456 7890"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</label>
                  <input 
                    name="linkedin_url" 
                    value={form.linkedin_url} 
                    onChange={handleChange} 
                    placeholder="https://linkedin.com/in/username"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</label>
                <input 
                  name="instagram_url" 
                  value={form.instagram_url} 
                  onChange={handleChange} 
                  placeholder="https://instagram.com/username"
                  className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>

            {/* PROFILO PROFESSIONALE */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Profilo Professionale
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lingue</label>
                  <input 
                    name="languages" 
                    value={form.languages} 
                    onChange={handleChange} 
                    placeholder="Es: IT, EN, ES"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specializzazione</label>
                  <input 
                    name="specialization" 
                    value={form.specialization} 
                    onChange={handleChange} 
                    placeholder="Es: Top Players, Under 21"
                    className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <textarea 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleChange} 
                  rows={3} 
                  placeholder="Note aggiuntive sull'agente..."
                  className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>

            {/* STATO ATTIVAZIONE */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Stato
              </h4>
              <div className="flex items-center space-x-2">
                <input 
                  name="active" 
                  type="checkbox"
                  checked={form.active} 
                  onChange={handleChange} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Agente Attivo</label>
              </div>
            </div>
            
          </div>
          
          {/* Footer fisso */}
          {!isViewMode && (
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {initial ? 'Aggiorna' : 'Crea Agente'}
              </button>
            </div>
          )}
          {isViewMode && (
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
