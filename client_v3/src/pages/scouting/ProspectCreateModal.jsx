// client_v3/src/pages/scouting/ProspectCreateModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { User, Target, FileText, MapPin, Calendar, Euro, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/design-system/ds/Dialog';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import { apiFetch } from '@/utils/apiClient';

const enumOptions = {
  status: [
    { value: 'DISCOVERY', label: 'Scoperta' },
    { value: 'MONITORING', label: 'Monitoraggio' },
    { value: 'ANALYZED', label: 'Analizzato' },
    { value: 'EVALUATED', label: 'Valutato' },
    { value: 'TARGETED', label: 'Obiettivo' },
    { value: 'SIGNED', label: 'Firmato' },
    { value: 'REJECTED', label: 'Rifiutato' },
    { value: 'ARCHIVED', label: 'Archiviato' }
  ],
  preferredFoot: [
    { value: 'RIGHT', label: 'Destro' },
    { value: 'LEFT', label: 'Sinistro' },
    { value: 'BOTH', label: 'Ambidestro' }
  ],
  contractType: [
    { value: 'PRO', label: 'Professionista' },
    { value: 'YOUTH', label: 'Giovanile' },
    { value: 'AMATEUR', label: 'Dilettante' },
    { value: 'FREE_AGENT', label: 'Svincolato' }
  ],
  euStatus: [
    { value: 'EU', label: 'Unione Europea' },
    { value: 'NON_EU', label: 'Extra UE' },
    { value: 'EFTA', label: 'EFTA' },
    { value: 'UK', label: 'Regno Unito' }
  ],
  mainPosition: [
    { value: 'GK', label: 'Portiere' },
    { value: 'CB', label: 'Difensore Centrale' },
    { value: 'FB', label: 'Terzino' },
    { value: 'DM', label: 'Mediano' },
    { value: 'CM', label: 'Centrocampista' },
    { value: 'AM', label: 'Trequartista' },
    { value: 'W', label: 'Ala' },
    { value: 'CF', label: 'Attaccante' }
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

function splitCsv(value) {
  if (!value) return undefined;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export default function ProspectCreateModal({ open, onClose, onSuccess, editing = null }) {
  const isEdit = !!editing?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const initial = useMemo(() => ({
    firstName: editing?.firstName || '',
    lastName: editing?.lastName || '',
    fullName: editing?.fullName || '',
    birthDate: editing?.birthDate ? String(editing.birthDate).substring(0,10) : '',
    birthPlace: editing?.birthPlace || '',
    nationalityPrimary: editing?.nationalityPrimary || '',
    nationalities: Array.isArray(editing?.nationalities) ? editing?.nationalities.join(', ') : '',
    euStatus: editing?.euStatus || '',
    preferredFoot: editing?.preferredFoot || '',
    heightCm: editing?.heightCm ?? '',
    weightKg: editing?.weightKg ?? '',
    wingspanCm: editing?.wingspanCm ?? '',
    mainPosition: editing?.mainPosition || '',
    secondaryPositions: Array.isArray(editing?.secondaryPositions) ? editing?.secondaryPositions.join(', ') : '',
    roleTags: Array.isArray(editing?.roleTags) ? editing?.roleTags.join(', ') : '',
    currentClub: editing?.currentClub || '',
    currentLeague: editing?.currentLeague || '',
    countryClub: editing?.countryClub || '',
    contractType: editing?.contractType || '',
    contractUntil: editing?.contractUntil ? String(editing.contractUntil).substring(0,10) : '',
    marketValue: editing?.marketValue ?? '',
    releaseClause: editing?.releaseClause ?? '',
    sellOnClausePct: editing?.sellOnClausePct ?? '',
    agentId: editing?.agentId || '',
    overallScore: editing?.overallScore ?? '',
    potentialScore: editing?.potentialScore ?? '',
    riskIndex: editing?.riskIndex ?? '',
    status: editing?.status || 'DISCOVERY',
    statusReason: editing?.statusReason || '',
    playerId: editing?.playerId ?? '',
    targetId: editing?.targetId ?? '',
    externalRefs: editing?.externalRefs ? Object.entries(editing.externalRefs).map(([k,v]) => `${k}:${v}`).join(', ') : '',
    notes: editing?.notes || '',
  }), [editing]);

  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); setError(null); }, [initial, open]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function onSubmit(e) {
    e?.preventDefault?.();
    setSaving(true); setError(null);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        fullName: form.fullName || undefined,
        birthDate: toIsoDate(form.birthDate),
        birthPlace: form.birthPlace || undefined,
        nationalityPrimary: form.nationalityPrimary || undefined,
        nationalities: splitCsv(form.nationalities),
        euStatus: form.euStatus || undefined,
        preferredFoot: form.preferredFoot || undefined,
        heightCm: parseNumber(form.heightCm),
        weightKg: parseNumber(form.weightKg),
        wingspanCm: parseNumber(form.wingspanCm),
        mainPosition: form.mainPosition || undefined,
        secondaryPositions: splitCsv(form.secondaryPositions),
        roleTags: splitCsv(form.roleTags),
        currentClub: form.currentClub || undefined,
        currentLeague: form.currentLeague || undefined,
        countryClub: form.countryClub || undefined,
        contractType: form.contractType || undefined,
        contractUntil: toIsoDate(form.contractUntil),
        marketValue: parseNumber(form.marketValue),
        releaseClause: parseNumber(form.releaseClause),
        sellOnClausePct: parseNumber(form.sellOnClausePct),
        agentId: form.agentId || undefined,
        overallScore: parseNumber(form.overallScore),
        potentialScore: parseNumber(form.potentialScore),
        riskIndex: parseNumber(form.riskIndex),
        status: form.status || 'DISCOVERY',
        statusReason: form.statusReason || undefined,
        playerId: form.playerId !== '' ? Number(form.playerId) : undefined,
        targetId: form.targetId !== '' ? Number(form.targetId) : undefined,
        externalRefs: form.externalRefs
          ? Object.fromEntries(splitCsv(form.externalRefs).map(pair => {
              const [k, ...rest] = pair.split(':');
              return [k?.trim(), rest.join(':').trim()];
            }))
          : undefined,
        notes: form.notes || undefined,
      };

      // Rimuovi chiavi undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      if (isEdit) {
        await apiFetch(`/scouting/prospects/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/scouting/prospects', { method: 'POST', body: JSON.stringify(payload) });
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
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={24} className="text-primary" />
              {isEdit ? 'Modifica Prospect' : 'Nuovo Prospect'}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? 'Modifica i dettagli del prospect esistente' : 'Crea un nuovo prospect per il monitoraggio'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 space-y-6">
            {error && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}

            {/* Informazioni Personali */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User size={20} className="text-blue-500" />
                  Informazioni Personali
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Nome *</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.firstName} 
                      onChange={e=>set('firstName', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Cognome *</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.lastName} 
                      onChange={e=>set('lastName', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Nome completo</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.fullName} 
                      onChange={e=>set('fullName', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Data di nascita</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.birthDate} 
                      onChange={e=>set('birthDate', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Luogo di nascita</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.birthPlace} 
                      onChange={e=>set('birthPlace', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Nazionalità principale</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.nationalityPrimary} 
                      onChange={e=>set('nationalityPrimary', e.target.value)} 
                      placeholder="es. Italiana" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Nazionalità multiple (CSV)</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.nationalities} 
                      onChange={e=>set('nationalities', e.target.value)} 
                      placeholder="Italiana, Svizzera" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Status UE</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.euStatus} 
                      onChange={e=>set('euStatus', e.target.value)}
                    >
                      <option value="">Seleziona status</option>
                      {enumOptions.euStatus.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Piede preferito</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.preferredFoot} 
                      onChange={e=>set('preferredFoot', e.target.value)}
                    >
                      <option value="">Seleziona piede</option>
                      {enumOptions.preferredFoot.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profilo Tecnico */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target size={20} className="text-green-500" />
                  Profilo Tecnico
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Altezza (cm)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.heightCm} 
                      onChange={e=>set('heightCm', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Peso (kg)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.weightKg} 
                      onChange={e=>set('weightKg', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Apertura braccia (cm)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.wingspanCm} 
                      onChange={e=>set('wingspanCm', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Ruolo principale</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.mainPosition} 
                      onChange={e=>set('mainPosition', e.target.value)}
                    >
                      <option value="">Seleziona ruolo</option>
                      {enumOptions.mainPosition.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Ruoli secondari (CSV)</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.secondaryPositions} 
                      onChange={e=>set('secondaryPositions', e.target.value)} 
                      placeholder="FB, W" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Tag ruolo (CSV)</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.roleTags} 
                      onChange={e=>set('roleTags', e.target.value)} 
                      placeholder="ala invertita, mezzala" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Club e Contratto */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin size={20} className="text-orange-500" />
                  Club e Contratto
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Club attuale</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.currentClub} 
                      onChange={e=>set('currentClub', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Lega</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.currentLeague} 
                      onChange={e=>set('currentLeague', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Paese del club</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.countryClub} 
                      onChange={e=>set('countryClub', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Tipo contratto</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.contractType} 
                      onChange={e=>set('contractType', e.target.value)}
                    >
                      <option value="">Seleziona tipo</option>
                      {enumOptions.contractType.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Scadenza contratto</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.contractUntil} 
                      onChange={e=>set('contractUntil', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">ID Agente (UUID)</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.agentId} 
                      onChange={e=>set('agentId', e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valore di Mercato */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Euro size={20} className="text-yellow-500" />
                  Valore di Mercato
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Valore di mercato (€)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.marketValue} 
                      onChange={e=>set('marketValue', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Clausola rescissoria (€)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.releaseClause} 
                      onChange={e=>set('releaseClause', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Percentuale rivendita (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.sellOnClausePct} 
                      onChange={e=>set('sellOnClausePct', e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valutazioni */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star size={20} className="text-purple-500" />
                  Valutazioni
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Punteggio generale</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.overallScore} 
                      onChange={e=>set('overallScore', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Punteggio potenziale</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.potentialScore} 
                      onChange={e=>set('potentialScore', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Indice di rischio (0-1)</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.riskIndex} 
                      onChange={e=>set('riskIndex', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Stato</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.status} 
                      onChange={e=>set('status', e.target.value)}
                    >
                      {enumOptions.status.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-foreground">Motivazione stato</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.statusReason} 
                      onChange={e=>set('statusReason', e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collegamenti e Note */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText size={20} className="text-gray-500" />
                  Collegamenti e Note
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">ID Giocatore (int)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.playerId} 
                      onChange={e=>set('playerId', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">ID Target (int)</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.targetId} 
                      onChange={e=>set('targetId', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Riferimenti esterni (CSV key:value)</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={form.externalRefs} 
                      onChange={e=>set('externalRefs', e.target.value)} 
                      placeholder="transfermarkt:URL, sofascore:URL" 
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="block text-sm font-medium text-foreground">Note</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      rows={3} 
                      value={form.notes} 
                      onChange={e=>set('notes', e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Salvataggio…' : (isEdit ? 'Salva modifiche' : 'Crea prospect')}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


