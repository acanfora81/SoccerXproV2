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
  Users,
  User
} from "lucide-react";
import axios from "axios";

export default function PlayersUpload({ teamId }) {
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
      const res = await axios.post("/api/players/upload", formData, {
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
            <Users size={32} />
            <div>
              <h1>Importazione Giocatori</h1>
              <p>Carica i dati dei tuoi giocatori da file CSV o Excel</p>
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
                <User size={48} color="#3B82F6" />
              </div>
              <h2>Carica Giocatori</h2>
              <p>Seleziona un file CSV o Excel (.xlsx) con i dati dei giocatori</p>
            </div>

            {/* File Selector */}
            <div className="file-selector">
              <input 
                type="file" 
                id="players-file"
                accept=".csv,.xlsx,.xls" 
                onChange={onSelectFile}
                className="file-input-hidden"
              />
              <label htmlFor="players-file" className="file-selector-label">
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
                    <div className="file-info">
                      <div className="file-icon">
                        {React.createElement(getFileIcon(file.name), { size: 24, color: "#3B82F6" })}
                      </div>
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="file-remove"
                      onClick={() => setFile(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Upload Button */}
            <div className="upload-actions">
              <button 
                className="upload-button"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Caricamento in corso...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Carica Giocatori
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
                  <h3>✅ Giocatori importati con successo!</h3>
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
                  <p><strong>✅ Supporto automatico per intestazioni in italiano!</strong></p>
                  <ul>
                    <li>Prima riga = intestazioni colonne</li>
                    <li><strong>Nome/Cognome</strong>: Nome e cognome (obbligatori)</li>
                    <li><strong>Data di Nascita</strong>: Data nascita (GG/MM/AAAA o YYYY-MM-DD)</li>
                    <li><strong>Nazionalità</strong>: Nazionalità (obbligatorio)</li>
                    <li><strong>Ruolo</strong>: Portiere, Difensore, Centrocampista, Attaccante</li>
                    <li><strong>Numero Maglia</strong>: Numero maglia (opzionale)</li>
                    <li><strong>Altezza</strong>: Altezza in cm (opzionale)</li>
                    <li><strong>Peso</strong>: Peso in kg (opzionale)</li>
                    <li><strong>Piede Preferito</strong>: Destro, Sinistro, Ambidestro</li>
                    <li><strong>Luogo di Nascita</strong>: Luogo di nascita (opzionale)</li>
                    <li><strong>Codice Fiscale</strong>: Codice fiscale (opzionale)</li>
                    <li><strong>Numero Passaporto</strong>: Numero passaporto (opzionale)</li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>🎯 Ruoli supportati</h4>
                  <ul>
                    <li><strong>Portiere</strong> o <strong>GOALKEEPER</strong></li>
                    <li><strong>Difensore</strong> o <strong>DEFENDER</strong></li>
                    <li><strong>Centrocampista</strong> o <strong>MIDFIELDER</strong></li>
                    <li><strong>Attaccante</strong> o <strong>FORWARD</strong></li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>🦶 Piede preferito</h4>
                  <ul>
                    <li><strong>Destro</strong> o <strong>RIGHT</strong></li>
                    <li><strong>Sinistro</strong> o <strong>LEFT</strong></li>
                    <li><strong>Ambidestro</strong> o <strong>BOTH</strong></li>
                  </ul>
                </div>
                <div className="help-section">
                  <h4>📥 Download esempi</h4>
                  <div className="download-examples" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a 
                      href="/examples/players/players-example.csv" 
                      download="players-example.csv"
                      className="download-example"
                    >
                      <Download size={16} />
                      Esempio in inglese
                    </a>
                    <a 
                      href="/examples/players/players-example-italian.csv" 
                      download="players-example-italian.csv"
                      className="download-example"
                    >
                      <Download size={16} />
                      Esempio in italiano
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
