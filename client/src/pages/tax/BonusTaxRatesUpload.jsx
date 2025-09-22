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
import useAuthStore from "../../store/authStore";

export default function BonusTaxRatesUpload({ teamId: teamIdProp }) {
  const { user } = useAuthStore();
  const teamId = teamIdProp || user?.teamId;
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
    if (!teamId) {
      setError("⚠️ Nessun team selezionato");
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
      const res = await axios.post("/api/bonustaxrates/upload", formData, {
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
              <h1>Aliquote Bonus e Indennità</h1>
              <p>Carica le aliquote fiscali per bonus e indennità dei tuoi giocatori da file CSV o Excel</p>
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
              <h2>Carica Aliquote Bonus</h2>
              <p>Seleziona un file CSV o Excel (.xlsx) con le aliquote fiscali per bonus e indennità</p>
            </div>

            {/* File Selector */}
            <div className="file-selector">
              <input 
                type="file" 
                id="bonustaxrates-file"
                accept=".csv,.xlsx,.xls" 
                onChange={onSelectFile}
                className="file-input-hidden"
              />
              <label htmlFor="bonustaxrates-file" className="file-selector-label">
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
                    Carica Aliquote Bonus
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
                  <h3>✅ Aliquote bonus caricate con successo!</h3>
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
                    <li><strong>type</strong>: Tipo bonus (IMAGE_RIGHTS, LOYALTY_BONUS, etc.)</li>
                    <li><strong>taxRate</strong>: Aliquota fiscale (es. 20.00)</li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>🎯 Tipi bonus supportati</h4>
                  <ul>
                    <li><strong>IMAGE_RIGHTS</strong>: Diritti Immagine</li>
                    <li><strong>LOYALTY_BONUS</strong>: Bonus Fedeltà</li>
                    <li><strong>SIGNING_BONUS</strong>: Bonus Firma</li>
                    <li><strong>ACCOMMODATION_BONUS</strong>: Bonus Alloggio</li>
                    <li><strong>CAR_ALLOWANCE</strong>: Indennità Auto</li>
                    <li><strong>TRANSFER_ALLOWANCE</strong>: Indennità di Trasferta</li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>📊 Esempio dati</h4>
                  <ul>
                    <li><strong>2025;IMAGE_RIGHTS;20,00</strong></li>
                    <li><strong>2025;LOYALTY_BONUS;15,00</strong></li>
                    <li><strong>2025;SIGNING_BONUS;25,00</strong></li>
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
                <p>Scarica il template CSV pronto da compilare:</p>
                <p>
                  <a href="/examples/tax/bonus-taxrates-example-italian.csv" download className="btn btn-primary">
                    <Download size={16} /> Scarica esempio
                  </a>
                </p>
                <p>Separatore consigliato: punto e virgola (;)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}