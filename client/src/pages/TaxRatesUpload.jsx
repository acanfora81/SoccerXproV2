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
  X,
  Calculator,
  Percent
} from "lucide-react";
import axios from "axios";

export default function TaxRatesUpload({ teamId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setError("⚠️ Seleziona prima un file CSV o Excel");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("teamId", teamId);

    try {
      const res = await axios.post("/api/taxrates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Errore nel caricamento file");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const onSelectFile = useCallback((e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    setMessage("");
    setSuccess(false);
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
      {/* Header principale */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Calculator size={32} color="#3B82F6" />
            <div>
              <h1>Aliquote Fiscali</h1>
              <p>Carica le aliquote fiscali per i contratti dei tuoi giocatori da file CSV o Excel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="upload-step-container">
        <div className="upload-main-content">
          {/* Upload Card */}
          <div className="upload-card">
            <div className="upload-card-header">
              <div className="upload-icon">
                <Percent size={48} color="#3B82F6" />
              </div>
              <h2>Carica Aliquote Fiscali</h2>
              <p>Seleziona un file CSV o Excel (.xlsx) con le aliquote fiscali</p>
            </div>

            {/* File Selector */}
            <div className="file-selector">
              <input 
                type="file" 
                id="taxrates-file"
                accept=".csv,.xlsx,.xls" 
                onChange={onSelectFile}
                className="file-input-hidden"
              />
              <label htmlFor="taxrates-file" className="file-selector-label">
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
                        <span className="file-status">✓ Pronto per caricamento</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setError(null);
                        setMessage("");
                        setSuccess(false);
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
                onClick={handleUpload}
                disabled={!file || loading}
                className="btn btn-primary btn-analyze"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Caricamento in corso...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Carica Aliquote
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

            {/* Success Display */}
            {success && message && (
              <div className="headers-preview">
                <div className="preview-header">
                  <CheckCircle size={20} color="#10B981" />
                  <h3>✅ Aliquote caricate con successo!</h3>
                </div>
                <div className="headers-summary">
                  <div className="headers-count">
                    <strong>{message}</strong>
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
                <h3>💡 Formato Richiesto</h3>
              </div>
              <div className="help-content">
                <div className="help-section">
                  <h4>📁 Formati supportati</h4>
                  <ul>
                    <li><strong>CSV</strong>: Separatore `;` (punto e virgola)</li>
                    <li><strong>Excel</strong>: File .xlsx o .xls</li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>📋 Struttura file</h4>
                  <ul>
                    <li>Prima riga = intestazioni colonne</li>
                    <li><strong>year</strong>: Anno (es. 2025)</li>
                    <li><strong>type</strong>: Tipo contratto (PROFESSIONAL, APPRENTICESHIP)</li>
                    <li><strong>inps</strong>: Aliquota INPS (es. 29.58)</li>
                    <li><strong>inail</strong>: Aliquota INAIL (opzionale)</li>
                    <li><strong>ffc</strong>: Aliquota FFC (es. 6.25)</li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>📊 Esempio dati</h4>
                  <ul>
                    <li><strong>2025;PROFESSIONAL;29.58;;6.25</strong></li>
                    <li><strong>2025;APPRENTICESHIP;11.61;;6.25</strong></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="help-card">
              <div className="help-header">
                <Download size={24} color="#10B981" />
                <h3>📄 File di Esempio</h3>
              </div>
              <div className="help-content">
                <p>È disponibile un file di esempio nel server:</p>
                <p><code>server/taxrates-example.csv</code></p>
                <p>Puoi usarlo come template per il tuo file.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
