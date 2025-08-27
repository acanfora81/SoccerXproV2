// client/src/components/performance/ImportWizard.jsx
// 🎯 VERSIONE FINALE MIGLIORATA - Import Wizard con UI moderna

import React, { useState, useCallback } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Info,
  X
} from "lucide-react";
import ColumnMappingStep from "./ColumnMappingStep";
import DataPreviewStep from "./DataPreviewStep";

const API_BASE = "/api/performance/import";

const ImportWizard = ({ teamId = 1 }) => {
  const [step, setStep] = useState(1);

  // Stato condiviso tra step
const [file, setFile] = useState(null);
const [headers, setHeaders] = useState([]);
const [fileId, setFileId] = useState(null);
const [originalExtension, setOriginalExtension] = useState(null);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);


  // Risultato mapping dal passo 2
  const [mappingResult, setMappingResult] = useState(null);

  console.log('🔵 ImportWizard renderizzato - Step:', step); // INFO DEV - rimuovere in produzione

  // === STEP 1: UPLOAD ===
  const onSelectFile = useCallback((e) => {
    const f = e.target.files?.[0];
    console.log('🔵 File selezionato:', f?.name, f?.size); // INFO DEV - rimuovere in produzione
    
    setFile(f || null);
    setHeaders([]);
    setError(null);
    
    // Reset stati precedenti quando si seleziona un nuovo file
    if (f) {
      setStep(1); // Torna al primo step se era andato avanti
      setMappingResult(null);
    }
  }, []);

  const readHeaders = useCallback(async () => {
    try {
      if (!file) {
        setError("⚠️ Seleziona prima un file CSV o Excel");
        return;
      }
      
      console.log('🔵 Inizio caricamento file:', file.name); // INFO DEV - rimuovere in produzione
      
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore upload (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      
      if (Array.isArray(data.headers) && data.headers.length > 0) {
        console.log('🟢 Headers caricati:', data.headers); // INFO - rimuovere in produzione
        setHeaders(data.headers);
        setFileId(data.fileId || null);   // 👈 salva il fileId restituito
        setOriginalExtension(null); // 🔧 AGGIUNTO
        setStep(2); // Avanza automaticamente al mapping
      } else {
        throw new Error("❌ Nessuna intestazione trovata nel file. Verifica che sia un CSV valido con separatori `,` o `;` oppure un file Excel valido.");
      }

    } catch (err) {
      console.log('🔴 Errore caricamento file:', err.message); // ERROR - mantenere essenziali
      setError(err.message || "Errore durante l'analisi del file");
    } finally {
      setLoading(false);
    }
  }, [file]);

  // === STEP 2: MAPPING ===
  const handleMappingComplete = useCallback((result) => {
    console.log('🟢 Mapping completato:', result.statistics); // INFO - rimuovere in produzione
    setMappingResult(result);
    setStep(3);
  }, []);

  // === STEP 3: PREVIEW ===
  const goBackToMapping = useCallback(() => {
    console.log('🔵 Ritorno al mapping step'); // INFO DEV - rimuovere in produzione
    setStep(2);
  }, []);

  const resetFlow = useCallback(() => {
  console.log('🔵 Reset completo wizard'); // INFO DEV - rimuovere in produzione
  setStep(1);
  setFile(null);
  setHeaders([]);
  setFileId(null);
  setOriginalExtension(null); // 🔧 AGGIUNTO
  setMappingResult(null);
  setError(null);
  setLoading(false);
}, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (filename) => {
    if (!filename) return FileText;
    const ext = filename.split('.').pop().toLowerCase();
    return ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet : FileText;
  };

  return (
    <div className="statistics-container">
      {/* Header principale migliorato */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Upload size={32} color="#3B82F6" />
            <div>
              <h1> Import Dati Performance</h1>
              <p>Carica facilmente i dati delle performance dei tuoi giocatori da file CSV o Excel</p>
            </div>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="upload-step-container">
          {/* Progress indicator migliorato */}
          <div className="wizard-progress">
            <div className="progress-steps">
              <div className="step-indicator active">
                <div className="step-number">1</div>
                <div className="step-info">
                  <span className="step-title">Upload</span>
                  <span className="step-desc">Seleziona file</span>
                </div>
              </div>
              <div className="progress-line"></div>
              <div className="step-indicator">
                <div className="step-number">2</div>
                <div className="step-info">
                  <span className="step-title">Mapping</span>
                  <span className="step-desc">Associa colonne</span>
                </div>
              </div>
              <div className="progress-line"></div>
              <div className="step-indicator">
                <div className="step-number">3</div>
                <div className="step-info">
                  <span className="step-title">Anteprima</span>
                  <span className="step-desc">Verifica e importa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="upload-main-content">
            {/* Upload Card */}
            <div className="upload-card">
              <div className="upload-card-header">
                <div className="upload-icon">
                  <Upload size={48} color="#3B82F6" />
                </div>
                <h2>Seleziona File</h2>
                <p>Carica un file CSV o Excel (.xlsx) con i dati delle performance</p>
              </div>

              {/* File Selector */}
              <div className="file-selector">
                <input 
                  type="file" 
                  id="performance-file"
                  accept=".csv,.xlsx,.xls" 
                  onChange={onSelectFile}
                  className="file-input-hidden"
                />
                <label htmlFor="performance-file" className="file-selector-label">
                  {!file ? (
                    <div className="file-drop-zone">
                      <div className="drop-zone-icon">
                        <Upload size={40} color="#9CA3AF" />
                      </div>
                      <div className="drop-zone-content">
                        <div className="drop-zone-main">Clicca per selezionare un file</div>
                        <div className="drop-zone-sub">o trascinalo qui</div>
                        <div className="supported-formats">
                          <FileText size={16} />
                          <span>CSV, Excel (.xlsx, .xls)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="file-selected">
                      {(() => {
                        const FileIcon = getFileIcon(file.name);
                        return <FileIcon size={32} color="#3B82F6" />;
                      })()}
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          <span className="file-status">✓ Pronto per analisi</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                          setError(null);
                        }}
                        className="file-remove-btn"
                        title="Rimuovi file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </label>
              </div>

              {/* Action Button */}
              <div className="upload-actions">
                <button 
                  onClick={readHeaders}
                  disabled={!file || loading}
                  className="btn btn-primary btn-analyze"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      Analizza File
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="upload-error">
                  <AlertTriangle size={20} color="#EF4444" />
                  <div className="error-content">
                    <strong>Si è verificato un errore:</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Success Preview */}
              {headers?.length > 0 && (
                <div className="headers-preview">
                  <div className="preview-header">
                    <CheckCircle size={20} color="#10B981" />
                    <h3>✅ File analizzato con successo!</h3>
                  </div>
                  <div className="headers-summary">
                    <div className="headers-count">
                      Trovate <strong>{headers.length}</strong> colonne
                    </div>
                    <div className="headers-list">
                      {headers.slice(0, 6).map((header, index) => (
                        <span key={index} className="header-badge">
                          {header}
                        </span>
                      ))}
                      {headers.length > 6 && (
                        <span className="header-badge more-badge">
                          +{headers.length - 6} altre...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help Sidebar */}
            <div className="help-sidebar">
              <div className="help-card">
                <div className="help-header">
                  <Info size={24} color="#3B82F6" />
                  <h3>💡 Come importare</h3>
                </div>
                <div className="help-content">
                  <div className="help-section">
                    <h4>📁 Formati supportati</h4>
                    <ul>
                      <li><strong>CSV</strong>: Separatori `,` o `;`</li>
                      <li><strong>Excel</strong>: File .xlsx o .xls</li>
                    </ul>
                  </div>
                  <div className="help-section">
                    <h4>📋 Requisiti file</h4>
                    <ul>
                      <li>Prima riga = intestazioni colonne</li>
                      <li>Encoding UTF-8 (per CSV)</li>
                      <li>Nome giocatore obbligatorio</li>
                      <li>Data sessione obbligatoria</li>
                    </ul>
                  </div>
                  <div className="help-section">
                    <h4>📊 Esempi dati</h4>
                    <ul>
                      <li><strong>Giocatore</strong>: "Mario Rossi", "#10"</li>
                      <li><strong>Data</strong>: "2024-08-25", "25/08/2024"</li>
                      <li><strong>Distanza</strong>: "8500" (metri)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="help-card">
                <div className="help-header">
                  <Download size={24} color="#10B981" />
                  <h3>📄 Template</h3>
                </div>
                <div className="help-content">
                  <p>Scarica un template per vedere la struttura corretta:</p>
                  <button className="btn btn-outline btn-template">
                    <Download size={16} />
                    Scarica Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <ColumnMappingStep
          csvHeaders={headers}
          onMappingComplete={handleMappingComplete}
          onBack={() => setStep(1)}
          teamId={teamId}
        />
      )}

      {step === 3 && (
        <DataPreviewStep
          fileId={fileId}
          mappingResult={mappingResult}
          originalExtension={originalExtension}
          onBack={goBackToMapping}
          onReset={resetFlow}
        />
      )}
    </div>
  );
};

export default ImportWizard;