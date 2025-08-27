// client/src/components/performance/ColumnMappingStep.jsx
// 🎯 VERSIONE COMPLETA — Mapping leggibile con layout migliorato

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  User,
  Calendar,
  Ruler,
  Zap,
  Heart,
  Clock,
  Target,
  Lightbulb,
  Info,
  ChevronDown,
  Activity
} from 'lucide-react';

// ✅ Preselezioni desiderate per header CSV specifici (a livello di modulo)
const DEFAULT_MAPPING_BY_HEADER = {
  playerId: 'playerId',          // Giocatore (Obbligatorio)
  session_date: 'session_date',  // Data Sessione (Obbligatorio)
  duration_minutes: 'none'       // -- Non mappare --
};

const ColumnMappingStep = ({
  csvHeaders,
  onMappingComplete,
  onBack,
  teamId,
  loading: externalLoading = false
}) => {
  // =========================
  // STATE
  // =========================
  const [mapping, setMapping] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [confidence, setConfidence] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customFields, setCustomFields] = useState([]);

  // =========================
  // DEFINIZIONI CAMPI (etichette umane)
  // =========================
  const fieldDefinitions = useMemo(() => ({
    playerId: {
      label: 'Giocatore',
      icon: User,
      description: 'Nome completo, cognome o numero maglia',
      example: 'Mario Rossi, Rossi, #10',
      required: true,
      color: '#3B82F6',
      category: 'Identificazione'
    },
    session_date: {
      label: 'Data Sessione',
      icon: Calendar,
      description: "Data dell'allenamento o partita",
      example: '2024-08-25, 25/08/2024',
      required: true,
      color: '#10B981',
      category: 'Temporale'
    },
    total_distance_m: {
      label: 'Distanza Totale',
      icon: Ruler,
      description: 'Distanza totale percorsa',
      example: '8500m, 8.5km',
      required: false,
      color: '#F59E0B',
      category: 'Performance'
    },
    sprint_distance_m: {
      label: 'Distanza Sprint',
      icon: Zap,
      description: 'Distanza percorsa ad alta intensità',
      example: '450m, 0.45km',
      required: false,
      color: '#EF4444',
      category: 'Performance'
    },
    avg_heart_rate: {
      label: 'Frequenza Cardiaca Media',
      icon: Heart,
      description: 'Battiti cardiaci medi durante sessione',
      example: '145, 155 bpm',
      required: false,
      color: '#EC4899',
      category: 'Fisiologico'
    },
    max_heart_rate: {
      label: 'Frequenza Cardiaca Max',
      icon: Heart,
      description: 'Massima frequenza cardiaca raggiunta',
      example: '180, 185 bpm',
      required: false,
      color: '#DC2626',
      category: 'Fisiologico'
    },
    duration_minutes: {
      label: 'Durata Sessione',
      icon: Clock,
      description: "Durata dell'allenamento in minuti",
      example: '90, 120',
      required: false,
      color: '#7C3AED',
      category: 'Temporale'
    },
    top_speed_kmh: {
      label: 'Velocità Massima',
      icon: Target,
      description: 'Velocità di picco raggiunta',
      example: '28.5, 31.2 km/h',
      required: false,
      color: '#059669',
      category: 'Performance'
    },

  avg_speed_kmh: {
  label: 'Velocità Media',
  icon: Target,
  description: 'Velocità media durante la sessione',
  example: '7.8',
  required: false,
  color: '#3B82F6',
  category: 'Performance'
},
player_load: {
  label: 'Player Load',
  icon: Zap,
  description: 'Indice di carico complessivo della sessione',
  example: '350',
  required: false,
  color: '#F59E0B',
  category: 'Performance'
},
high_intensity_runs: {
  label: 'Corse Alta Intensità',
  icon: Activity,
  description: 'Numero corse ad alta intensità',
  example: '24',
  required: false,
  color: '#8B5CF6',
  category: 'Performance'
},
session_type: {
  label: 'Tipo Sessione',
  icon: Calendar,
  description: 'Allenamento o partita',
  example: 'Training, Match',
  required: false,
  color: '#10B981',
  category: 'Temporale'
},
source_device: {
  label: 'Dispositivo Sorgente',
  icon: Info,
  description: 'Tracker o sistema che ha generato i dati',
  example: 'Catapult, STATSports',
  required: false,
  color: '#6B7280',
  category: 'Meta'
},
notes: {
  label: 'Note',
  icon: Lightbulb,
  description: 'Annotazioni aggiuntive',
  example: 'Buona prestazione, recupero attivo',
  required: false,
  color: '#EAB308',
  category: 'Meta'
}


  }), []);

  // Applica preselezioni una volta che abbiamo gli header (senza sovrascrivere scelte esistenti)
  useEffect(() => {
    if (!csvHeaders || csvHeaders.length === 0) return;

    setMapping(prev => {
      const next = { ...prev };
      for (const h of csvHeaders) {
        if (next[h] === undefined && DEFAULT_MAPPING_BY_HEADER[h] !== undefined) {
          next[h] = DEFAULT_MAPPING_BY_HEADER[h] === 'none' ? undefined : DEFAULT_MAPPING_BY_HEADER[h];
        }
      }
      return next;
    });
  }, [csvHeaders]);

  // =========================
  // SUGGERIMENTI INTELLIGENTI (opzionali)
  // =========================
  const loadSmartSuggestions = useCallback(async () => {
    if (!csvHeaders || csvHeaders.length === 0 || !teamId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/performance/map-columns', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: csvHeaders, teamId })
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || {});
      setConfidence(data.confidence?.individual || {});
      setWarnings(data.warnings || []);

      // Auto-apply solo alta confidence, ma NON sovrascrivere le preselezioni richieste
      const auto = {};
      Object.entries(data.suggestions || {}).forEach(([header, s]) => {
        if (s?.confidence >= 85) {
          // se avevamo default "none" lasciamo non mappato
          if (DEFAULT_MAPPING_BY_HEADER[header] === 'none') return;
          auto[header] = s.dbField;
        }
      });

      setMapping(prev => ({ ...auto, ...prev }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [csvHeaders, teamId]);

  useEffect(() => {
    if (csvHeaders?.length && teamId) loadSmartSuggestions();
  }, [csvHeaders, teamId, loadSmartSuggestions]);

  // =========================
  // HANDLERS
  // =========================
  const handleMappingChange = useCallback((csvHeader, dbField) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: dbField === 'none' ? undefined : dbField
    }));
  }, []);

  const validateMapping = useMemo(() => {
    const requiredFields = Object.entries(fieldDefinitions)
      .filter(([, cfg]) => cfg.required)
      .map(([k]) => k);

    const mappedFields = Object.values(mapping).filter(Boolean);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      totalMapped: mappedFields.length,
      totalHeaders: csvHeaders?.length || 0
    };
  }, [mapping, fieldDefinitions, csvHeaders]);

  const handleComplete = useCallback(() => {
    if (!validateMapping.isValid) {
      setError(`Campi obbligatori mancanti: ${validateMapping.missingRequired.join(', ')}`);
      return;
    }

    const mappingResult = {
      mapping: Object.fromEntries(
        Object.entries(mapping)
          .filter(([, dbField]) => dbField)
          .map(([csvHeader, dbField]) => [
            csvHeader,
            { dbField, ...suggestions[csvHeader], csvHeader }
          ])
      ),
      statistics: {
        totalHeaders: csvHeaders.length,
        mappedHeaders: Object.keys(mapping).filter(k => mapping[k]).length,
        requiredFieldsMapped: validateMapping.totalMapped,
        averageConfidence: Math.round(
          Object.values(confidence).reduce((sum, c) => sum + c, 0) /
          Math.max(Object.values(confidence).length, 1)
        )
      },
      warnings
    };

    // 🔵 DEBUG - Log dettagliato mapping
    console.log('🔵 === DEBUG MAPPING COMPLETO ===');
    console.log('🔵 CSV Headers originali:', csvHeaders);
    console.log('🔵 Mapping stato:', mapping);
    console.log('🔵 Mapping finale inviato:', mappingResult.mapping);
    console.log('🔵 Campi mappati totali:', Object.keys(mappingResult.mapping).length);
    
    // Debug specifico per ogni campo mappato
    Object.entries(mappingResult.mapping).forEach(([csvHeader, fieldInfo]) => {
      console.log(`🔵 ${csvHeader} → ${fieldInfo.dbField} (${fieldInfo.dbField.startsWith('custom.') ? 'CUSTOM' : 'PREDEFINITO'})`);
    });
    
    console.log('🔵 ================================');
    onMappingComplete(mappingResult);
  }, [validateMapping, mapping, suggestions, csvHeaders, confidence, warnings, onMappingComplete]);

  // =========================
  // HELPERS UI
  // =========================
  const getConfidenceStyle = (conf) => {
    if (conf >= 90) return { color: '#10B981', bg: '#ECFDF5', label: 'Ottima' };
    if (conf >= 75) return { color: '#F59E0B', bg: '#FFFBEB', label: 'Buona' };
    if (conf >= 60) return { color: '#EF4444', bg: '#FEF2F2', label: 'Media' };
    return { color: '#6B7280', bg: '#F3F4F6', label: 'Bassa' };
  };

  // 👇 funzione per aggiungere un campo custom
  const addCustomField = (label) => {
    const slug = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const newField = {
      value: `custom.${slug}`,
      label: `${label} (custom)`
    };
    setCustomFields(prev => [...prev, newField]);
    return newField.value;
  };

  // =========================
  // STATES: LOADING / ERROR
  // =========================
  if (loading || externalLoading) {
    return (
      <div className="statistics-container">
        <div className="mapping-step-container loading">
          <div className="loading-content">
            <RefreshCw size={48} className="animate-spin" style={{ color: '#3B82F6' }} />
            <h3>🧠 Analisi Intelligente CSV</h3>
            <p>Sto analizzando le colonne e generando suggerimenti automatici...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !csvHeaders?.length) {
    return (
      <div className="statistics-container">
        <div className="mapping-step-container error">
          <div className="error-content">
            <XCircle size={48} color="#EF4444" />
            <h3>Errore Caricamento</h3>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={onBack} className="btn btn-secondary">Torna Indietro</button>
              <button onClick={loadSmartSuggestions} className="btn btn-primary">
                <RefreshCw size={16} /> Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="statistics-container">
      <div className="mapping-step-container">
        {/* Header */}
        <div className="mapping-step-header">
          <div className="header-main">
            <div className="header-title">
              <Lightbulb size={32} style={{ color: '#F59E0B' }} />
              <div>
                <h2>🎯 Mapping Colonne CSV</h2>
                <p>Associa ogni colonna del tuo file ai campi del database</p>
              </div>
            </div>

            <div className="progress-indicator">
              <div className="step completed">1</div>
              <div className="step-line" />
              <div className="step active">2</div>
              <div className="step-line" />
              <div className="step">3</div>
              <div className="step-labels">
                <span>Upload</span>
                <span>Mapping</span>
                <span>Anteprima</span>
              </div>
            </div>
          </div>

          <div className="mapping-stats">
            <div className="stat-card">
              <div className="stat-value">{csvHeaders?.length || 0}</div>
              <div className="stat-label">Colonne CSV</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{validateMapping.totalMapped}</div>
              <div className="stat-label">Mappate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.round(
                  Object.values(confidence).reduce((s, c) => s + c, 0) /
                  Math.max(Object.values(confidence).length, 1)
                ) || 0}%
              </div>
              <div className="stat-label">Confidence</div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mapping-warnings">
            <AlertTriangle size={20} color="#F59E0B" />
            <div className="warnings-content">
              <h4>⚠️ Attenzioni Rilevate</h4>
              <ul>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Obbligatori */}
        <div className="required-fields-status">
          <h3>📋 Campi Obbligatori</h3>
          <div className="required-grid">
            {Object.entries(fieldDefinitions)
              .filter(([, cfg]) => cfg.required)
              .map(([field, cfg]) => {
                const isMapped = Object.values(mapping).includes(field);
                const Icon = cfg.icon;
                return (
                  <div key={field} className={`required-field ${isMapped ? 'mapped' : 'missing'}`}>
                    <Icon size={16} color={cfg.color} />
                    <span>{cfg.label}</span>
                    {isMapped
                      ? <CheckCircle size={14} color="#10B981" />
                      : <XCircle size={14} color="#EF4444" />}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 🎯 NUOVO LAYOUT MIGLIORATO - Mapping più leggibile */}
        <div className="mapping-section">
          <div className="section-header">
            <h3>🔗 Associa Colonne</h3>
            <p>Per ogni colonna CSV, scegli il campo database corrispondente</p>
          </div>

          <div className="mapping-grid-improved">
            {csvHeaders?.map((header, idx) => {
              const suggestion = suggestions[header];
              const conf = confidence[header] || 0;
              const confStyle = getConfidenceStyle(conf);

              // valore da mostrare nella select
              const currentValue =
                (mapping[header] ?? null) ??
                (DEFAULT_MAPPING_BY_HEADER[header] === 'none'
                  ? null
                  : DEFAULT_MAPPING_BY_HEADER[header]) ??
                null;

              // Trova la definizione del campo selezionato per mostrare le info
              const selectedFieldDef = currentValue ? fieldDefinitions[currentValue] : null;
              const SelectedIcon = selectedFieldDef?.icon;

              return (
                <div key={`${header}-${idx}`} className="mapping-row-improved">
                  {/* Colonna CSV con confidence */}
                  <div className="csv-column-info">
                    <div className="csv-header-name">{header}</div>
                    {suggestion && conf >= 85 && (
                      <div className="auto-suggestion-badge">
                        <CheckCircle size={12} color="#10B981" />
                        <span>Auto</span>
                      </div>
                    )}
                    {conf > 0 && (
                      <div className="confidence-indicator" style={{ backgroundColor: confStyle.bg }}>
                        <div
                          className="confidence-fill"
                          style={{ width: `${conf}%`, backgroundColor: confStyle.color }}
                        />
                        <span className="confidence-text" style={{ color: confStyle.color }}>
                          {conf}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Freccia */}
                  <div className="mapping-arrow">
                    <ArrowRight size={20} color="#9CA3AF" />
                  </div>

                  {/* Campo DB con info inline - LAYOUT MIGLIORATO */}
                  <div className="db-field-container">
                    <div className="field-selector-row">
                      {/* Info campo selezionato ACCANTO alla select */}
                      <div className="field-info-inline">
                        {selectedFieldDef ? (
                          <div className="field-selected-info">
                            <div className="field-main-info">
                              {SelectedIcon && <SelectedIcon size={16} color={selectedFieldDef.color} />}
                              <span className="field-label-bold">{selectedFieldDef.label}</span>
                              {selectedFieldDef.required && <span className="required-star">*</span>}
                            </div>
                            <div className="field-description-inline">
                              {selectedFieldDef.description}
                            </div>
                          </div>
                        ) : (
                          <div className="field-not-mapped">
                            <span className="no-mapping-text">-- Seleziona campo --</span>
                          </div>
                        )}
                      </div>

                      {/* Select */}
                      <select
                        value={currentValue || 'none'}
                        onChange={(e) => {
                          if (e.target.value === "__add_custom__") {
                            const label = prompt("Nome nuovo campo personalizzato:");
                            if (label) {
                              const newVal = addCustomField(label);
                              handleMappingChange(header, newVal);
                            }
                          } else {
                            handleMappingChange(header, e.target.value);
                          }
                        }}
                        className={`field-select-compact ${(!currentValue || currentValue === 'none') ? 'is-nomap' : ''}`}
                      >
                        <option value="none">-- Non mappare --</option>

                        {/* — Obbligatori — */}
                        <optgroup label="Obbligatori">
                          {Object.entries(fieldDefinitions)
                            .filter(([, cfg]) => cfg.required)
                            .map(([key, cfg]) => (
                              <option key={key} value={key}>
                                {cfg.label} ({key})
                              </option>
                            ))}
                        </optgroup>

                        {/* — Opzionali — */}
                        <optgroup label="Opzionali">
                          {Object.entries(fieldDefinitions)
                            .filter(([, cfg]) => !cfg.required)
                            .map(([key, cfg]) => (
                              <option key={key} value={key}>
                                {cfg.label} ({key})
                              </option>
                            ))}
                        </optgroup>

                        {/* — Custom — */}
                        {customFields.length > 0 && (
                          <optgroup label="Custom">
                            {customFields.map((cf) => (
                              <option key={cf.value} value={cf.value}>
                                {cf.label}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        <option value="__add_custom__">➕ Aggiungi campo personalizzato…</option>
                      </select>
                    </div>

                    {/* Esempio sotto se campo selezionato */}
                    {selectedFieldDef && (
                      <div className="field-example-row">
                        <span className="example-label">Esempio:</span>
                        <span className="example-value">{selectedFieldDef.example}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Avanzate */}
        <div className="advanced-section">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
          >
            <Info size={16} />
            <span>Opzioni Avanzate</span>
            <ChevronDown
              size={16}
              style={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {showAdvanced && (
            <div className="advanced-content">
              <div className="field-reference">
                <h4>📚 Riferimento Campi</h4>
                <div className="field-grid">
                  {Object.entries(fieldDefinitions).map(([field, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={field} className="field-ref">
                        <div className="field-ref-header">
                          <Icon size={16} color={cfg.color} />
                          <span className="field-ref-name">{cfg.label}</span>
                          {cfg.required && <span className="required-mark">*</span>}
                        </div>
                        <div className="field-ref-description">{cfg.description}</div>
                        <div className="field-ref-example">Esempio: {cfg.example}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="mapping-actions">
          <div className="actions-left">
            <button onClick={onBack} className="btn btn-secondary">← Indietro</button>
            <button onClick={loadSmartSuggestions} className="btn btn-outline">
              <RefreshCw size={16} /> Rianalizza
            </button>
          </div>

          <div className="actions-right">
            <div className="validation-status">
              {validateMapping.isValid ? (
                <div className="status-valid">
                  <CheckCircle size={16} color="#10B981" />
                  <span>✅ Pronto per l'anteprima</span>
                </div>
              ) : (
                <div className="status-invalid">
                  <XCircle size={16} color="#EF4444" />
                  <span>❌ Mancano: {validateMapping.missingRequired.join(', ')}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              disabled={!validateMapping.isValid}
              className="btn btn-primary"
              title={!validateMapping.isValid ? 'Completa il mapping dei campi obbligatori' : "Procedi all'anteprima"}
            >
              Anteprima Dati
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingStep;