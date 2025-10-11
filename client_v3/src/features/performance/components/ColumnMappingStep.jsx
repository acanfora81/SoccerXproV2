// Percorso: client_v3/src/features/performance/components/ColumnMappingStep.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, RefreshCw, Info, Lightbulb } from 'lucide-react';

// Campi minimi richiesti
const MINIMUM_REQUIRED_FIELDS = ['playerId', 'session_date', 'session_type', 'duration_minutes', 'total_distance_m'];

// Definizioni campi DB (ridotto ma estendibile)
const FIELD_DEFINITIONS = {
  playerId: { label: 'Giocatore', required: true, example: 'Mario Rossi, #10' },
  session_date: { label: 'Data Sessione', required: true, example: '2025-08-25' },
  session_type: { label: 'Tipo Sessione', required: true, example: 'Allenamento / Partita' },
  session_name: { label: 'Nome Sessione', required: false, example: 'Rifinitura / Palestra / Test' },
  duration_minutes: { label: 'Durata (min)', required: true, example: '90' },
  total_distance_m: { label: 'Distanza Totale (m)', required: false, example: '8500' },
  sprint_distance_m: { label: 'Distanza Sprint (m)', required: false, example: '450' },
  avg_speed_kmh: { label: 'Velocità Media (km/h)', required: false, example: '7.8' },
  top_speed_kmh: { label: 'Velocità Max (km/h)', required: false, example: '31.2' },
  avg_heart_rate: { label: 'FC Media', required: false, example: '145' },
  max_heart_rate: { label: 'FC Max', required: false, example: '185' },
  player_load: { label: 'Player Load', required: false, example: '350' },
  high_intensity_runs: { label: 'Corse Alta Intensità', required: false, example: '24' }
};

const REQUIRED_LABELS = {
  playerId: 'Giocatore',
  session_date: 'Data Sessione',
  session_type: 'Tipo Sessione',
  duration_minutes: 'Durata Sessione',
  total_distance_m: 'Distanza Totale'
};

export default function ColumnMappingStep({ csvHeaders = [], onMappingComplete, onBack, teamId, fileId, loading: externalLoading = false }) {
  const [mapping, setMapping] = useState({}); // { csvHeader: dbField }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState({}); // { csvHeader: { suggestedField, confidence } }
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Regole locali di suggerimento (sinonimi/pattern comuni)
  const LOCAL_PATTERNS = useMemo(() => ([
    { pattern: /^player[_\s-]?name$/i, field: 'playerId', conf: 92 },
    { pattern: /^player$/i, field: 'playerId', conf: 90 },
    { pattern: /^athlete|giocatore$/i, field: 'playerId', conf: 88 },
    { pattern: /^session[_\s-]?date$|^date$/i, field: 'session_date', conf: 92 },
    { pattern: /^session[_\s-]?type$|^type$/i, field: 'session_type', conf: 92 },
    { pattern: /^session[_\s-]?name$|^nome[_\s-]?sessione$|^name$/i, field: 'session_name', conf: 85 },
    { pattern: /^duration|duration[_\s-]?minutes$|^minutes$/i, field: 'duration_minutes', conf: 85 },
    { pattern: /^total[_\s-]?distance$|^distance$/i, field: 'total_distance_m', conf: 85 },
    { pattern: /^sprint[_\s-]?distance$/i, field: 'sprint_distance_m', conf: 85 },
    { pattern: /^avg[_\s-]?speed|average[_\s-]?speed$/i, field: 'avg_speed_kmh', conf: 80 },
    { pattern: /^top[_\s-]?speed|max[_\s-]?speed$/i, field: 'top_speed_kmh', conf: 80 },
    { pattern: /^avg[_\s-]?hr|avg[_\s-]?heart[_\s-]?rate$/i, field: 'avg_heart_rate', conf: 78 },
    { pattern: /^max[_\s-]?hr|max[_\s-]?heart[_\s-]?rate$/i, field: 'max_heart_rate', conf: 78 },
    { pattern: /^player[_\s-]?load$/i, field: 'player_load', conf: 78 },
    { pattern: /^high[_\s-]?intensity[_\s-]?runs?$/i, field: 'high_intensity_runs', conf: 78 },
  ]), []);

  // Genera suggerimenti locali in base agli header
  const generateLocalSuggestions = useCallback(() => {
    // Partiamo dai suggerimenti esistenti ma solo per intestazioni NON mappate
    setSuggestions(prev => {
      const filteredPrev = Object.fromEntries(
        Object.entries(prev || {}).filter(([header]) => !mapping[header])
      );

      const localOut = { ...filteredPrev };
      csvHeaders.forEach(h => {
        if (mapping[h]) return; // se già mappata, niente suggerimento
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const direct = Object.keys(FIELD_DEFINITIONS).find(db => db.toLowerCase() === h.toLowerCase());
        if (direct) {
          // per match esatto non serve suggerimento, verrà già mappato
          return;
        }
        for (const rule of LOCAL_PATTERNS) {
          if (rule.pattern.test(h) || rule.pattern.test(clean)) {
            if (!localOut[h]) localOut[h] = { suggestedField: rule.field, confidence: rule.conf };
            break;
          }
        }
      });
      return localOut;
    });
  }, [csvHeaders, mapping, LOCAL_PATTERNS]);

  // Rigenera i suggerimenti sia quando cambiano gli header che quando cambia il mapping
  useEffect(() => { if (csvHeaders.length) generateLocalSuggestions(); }, [csvHeaders, mapping, generateLocalSuggestions]);

  // Pre-mapping basato su similarità semplice
  useEffect(() => {
    if (!csvHeaders.length) return;
    setMapping(prev => {
      const next = { ...prev };
      csvHeaders.forEach(h => {
        if (next[h] !== undefined) return;
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const candidates = Object.keys(FIELD_DEFINITIONS);
        const exact = candidates.find(f => f.toLowerCase() === h.toLowerCase());
        const similar = candidates.find(f => f.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
        if (exact) next[h] = exact; else if (similar) next[h] = similar;
      });
      return next;
    });
  }, [csvHeaders]);

  // Carica suggerimenti dal backend (facoltativo)
  const loadSuggestions = useCallback(async () => {
    if (!csvHeaders.length || !teamId) return;
    try {
      setSuggestionsLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
      const res = await fetch(`${API_BASE}/performance/map-columns`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: csvHeaders, teamId })
      });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      const data = await res.json();
      const rawServerSuggestions = (data?.data?.suggestions) || data?.suggestions || {};
      // Normalizza i suggerimenti del backend al formato { suggestedField, confidence }
      const normalizedServerSuggestions = Object.fromEntries(
        Object.entries(rawServerSuggestions).map(([header, s]) => [
          header,
          {
            suggestedField: s?.suggestedField || s?.dbField || s?.field || null,
            confidence: typeof s?.confidence === 'number' ? s.confidence : (typeof s?.confidenceScore === 'number' ? s.confidenceScore : null)
          }
        ])
      );
      setSuggestions(prev => ({ ...prev, ...normalizedServerSuggestions }));
      // Applica auto mapping alta confidenza
      setMapping(prev => {
        const next = { ...prev };
        Object.entries(normalizedServerSuggestions || {}).forEach(([header, s]) => {
          if (s?.confidence >= 85 && s?.suggestedField && next[header] === undefined) {
            next[header] = s.suggestedField;
          }
        });
        return next;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [csvHeaders, teamId]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const validate = useMemo(() => {
    const mappedDbFields = Object.values(mapping).filter(Boolean);
    const missing = MINIMUM_REQUIRED_FIELDS.filter(req => !mappedDbFields.includes(req));
    return { isValid: missing.length === 0, missing };
  }, [mapping]);

  const handleSelect = (fieldKey, newCsvHeader) => {
    // Rimuovi eventuale precedente mapping che puntava a fieldKey
    const currentCsv = Object.entries(mapping).find(([, db]) => db === fieldKey)?.[0];
    setMapping(prev => {
      const next = { ...prev };
      if (currentCsv) delete next[currentCsv];
      if (newCsvHeader && newCsvHeader !== 'none') next[newCsvHeader] = fieldKey;
      return next;
    });
  };

  const handleComplete = () => {
    if (!validate.isValid) {
      setError(`Campi obbligatori mancanti: ${validate.missing.map(m => REQUIRED_LABELS[m] || m).join(', ')}`);
      return;
    }
    const mappingPayload = Object.fromEntries(
      Object.entries(mapping)
        .filter(([, dbField]) => dbField)
        .map(([csvHeader, dbField]) => [csvHeader, { dbField, csvHeader }])
    );
    // Calcola affidabilità media dai suggerimenti applicati (se disponibili)
    const appliedConfidences = Object.entries(mappingPayload)
      .map(([csvHeader]) => suggestions[csvHeader]?.confidence)
      .filter((v) => typeof v === 'number');
    const averageConfidence = appliedConfidences.length
      ? Math.round(appliedConfidences.reduce((a, b) => a + b, 0) / appliedConfidences.length)
      : null;

    const statistics = {
      totalHeaders: csvHeaders.length,
      mappedHeaders: Object.keys(mappingPayload).length,
      requiredFieldsMapped: MINIMUM_REQUIRED_FIELDS.filter(f => Object.values(mapping).includes(f)).length,
      averageConfidence
    };
    onMappingComplete({ mapping: mappingPayload, statistics, warnings: [] });
  };

  const applySuggestions = () => {
    setMapping(prev => {
      const next = { ...prev };
      Object.entries(suggestions).forEach(([header, s]) => {
        if (!next[header] && s?.suggestedField) {
          // evita duplicati sullo stesso campo DB
          const alreadyUsed = Object.values(next).includes(s.suggestedField);
          if (!alreadyUsed) next[header] = s.suggestedField;
        }
      });
      return next;
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-semibold">Mapping Colonne CSV</h2>
              <p className="text-sm text-white/70">Associa le colonne del file ai campi del database</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm px-2 py-1 rounded-md border border-white/10 bg-white/5">Headers: {csvHeaders.length}</div>
            <div className="text-sm px-2 py-1 rounded-md border border-white/10 bg-white/5">Mappate: {Object.values(mapping).filter(Boolean).length}</div>
          </div>
        </div>

        {(loading || externalLoading) && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 mb-4">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Analisi suggerimenti...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 mb-4">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Suggerimenti intelligenti */}
        {Object.keys(suggestions).length > 0 && !suggestionsLoading && (
          <div className="mb-4 rounded-lg border p-3 border-amber-200 bg-amber-50 text-gray-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-inherit">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                💡 Suggerimenti trovati: <strong>{Object.keys(suggestions).length}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSuggestions({})} className="px-3 py-1 rounded-md border text-sm bg-red-100 border-red-300 text-red-800 hover:bg-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/20">
                  Rifiuta suggerimenti
                </button>
                <button onClick={applySuggestions} className="px-3 py-1 rounded-md text-sm border bg-amber-100 border-amber-300 text-gray-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-inherit dark:hover:bg-amber-500/30">
                  Applica suggerimenti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campi obbligatori */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Campi obbligatori</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
            {MINIMUM_REQUIRED_FIELDS.map((field) => {
              const mapped = Object.values(mapping).includes(field);
              return (
                <div
                  key={field}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    mapped
                      ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-inherit'
                      : 'border-blue-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-inherit'
                  }`}
                >
                  <span className="text-sm">{REQUIRED_LABELS[field] || field}</span>
                  {mapped ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Griglia mapping: per ogni campo DB, scegli la colonna CSV */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(FIELD_DEFINITIONS).map(([fieldKey, def]) => {
              const currentCsv = Object.entries(mapping).find(([, db]) => db === fieldKey)?.[0] || 'none';
              const hasSuggestedForField = Object.values(suggestions).some(s => s?.suggestedField === fieldKey);
              const suggestedHeader = Object.entries(suggestions).find(([, s]) => s?.suggestedField === fieldKey)?.[0];
              const isMapped = currentCsv !== 'none';
              const containerClasses = hasSuggestedForField
                ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                : isMapped
                  ? 'border-blue-200 bg-blue-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-inherit'
                  : 'border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-inherit';
              return (
                <div key={fieldKey} className={`rounded-lg p-3 border ${containerClasses}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{def.label} {def.required && <span className="text-red-400">*</span>}</div>
                      <div className="text-xs text-white/60">Esempio: {def.example}</div>
                    </div>
                    <div className="text-xs text-white/60 flex items-center gap-2">
                      {hasSuggestedForField && (
                        <span className="px-2 py-0.5 rounded-md border bg-amber-100 border-amber-300 text-gray-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200">Suggerito</span>
                      )}
                      <span>{currentCsv !== 'none' ? 'Mappato' : 'Non mappato'}</span>
                    </div>
                  </div>
                  <select
                    className="w-full rounded-md px-3 py-2 text-sm border bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    value={currentCsv === 'none' && suggestedHeader ? '__suggested__' : currentCsv}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'none') {
                        // rimuovi mapping per questo field
                        const existingCsv = Object.entries(mapping).find(([, db]) => db === fieldKey)?.[0];
                        if (existingCsv) setMapping(prev => { const next = { ...prev }; delete next[existingCsv]; return next; });
                      } else {
                        handleSelect(fieldKey, val);
                      }
                    }}
                  >
                    {currentCsv === 'none' && suggestedHeader && (
                      <option disabled value="__suggested__" className="bg-amber-500/20 text-amber-200">Suggerito: {suggestedHeader}</option>
                    )}
                    <option className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100" value="none">-- Non mappare --</option>
                    {csvHeaders.map(h => {
                      const isSuggested = !!suggestions[h]?.suggestedField;
                      return (
                        <option
                          key={h}
                          value={h}
                          className={`${isSuggested ? 'bg-amber-500/20 text-amber-200' : 'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'}`}
                        >
                          {h}{isSuggested ? '  💡' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10">
            <ArrowLeft className="w-4 h-4" /> Indietro
          </button>
          <button onClick={handleComplete} disabled={!validate.isValid} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50">
            Anteprima Dati <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}



