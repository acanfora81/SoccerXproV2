import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, X, RefreshCw, Calculator, Info, Download, List, MapPin } from 'lucide-react';
import axios from 'axios';

export default function RegionalAdditionalsUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSelect = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(''); setMessage('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/api/taxrates/regional-additionals/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(res.data.message || 'Caricamento completato');
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel caricamento file');
    } finally {
      setLoading(false);
    }
  };

  const FileIcon = !file ? FileText : (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) ? FileSpreadsheet : FileText;

  return (
    <div className="statistics-container">
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Calculator size={32} color="#3B82F6" />
            <div>
              <h1>Carica Addizionali Regionali</h1>
              <p>CSV in italiano: colonne anno;regione;tipo(fissa/progressiva);aliquota;min;max</p>
            </div>
          </div>
        </div>
      </div>

      <div className="upload-step-container">
        <div className="upload-main-content">
          {/* Card Upload */}
          <div className="upload-card">
          <div className="file-selector">
            <input id="regional-add-file" type="file" accept=".csv,.xlsx,.xls" className="file-input-hidden" onChange={onSelect} />
            <label htmlFor="regional-add-file" className="file-selector-label">
              {!file ? (
                <div className="file-drop-zone">
                  <Upload size={40} color="#9CA3AF" />
                  <div className="drop-zone-content">
                    <div className="drop-zone-main">Clicca per selezionare un file</div>
                    <div className="drop-zone-sub">o trascinalo qui</div>
                  </div>
                </div>
              ) : (
                <div className="file-selected">
                  <FileIcon size={32} color="#3B82F6" />
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                  </div>
                  <button className="file-remove-btn" onClick={() => setFile(null)} title="Rimuovi"><X size={16} /></button>
                </div>
              )}
            </label>
          </div>

          <div className="upload-actions">
            <button className="btn btn-primary btn-analyze" disabled={!file || loading} onClick={handleUpload}>
              {loading ? (<><RefreshCw size={16} className="animate-spin" /> Caricamento...</>) : 'Carica Addizionali Regionali'}
            </button>
          </div>

          {message && <div className="headers-preview"><div className="headers-summary"><strong>{message}</strong></div></div>}
          {error && <div className="upload-error">{error}</div>}
        </div>

        {/* Sidebar Istruzioni */}
        <div className="help-sidebar">
          <div className="help-card">
            <div className="help-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Info size={24} color="#3B82F6" />
              <h3>Formato richiesto (CSV IT)</h3>
            </div>
            <div className="help-content">
              <div className="help-section">
                <h4 style={{ display:'flex', alignItems:'center', gap:6 }}><List size={16} /> Intestazioni obbligatorie</h4>
                <ul>
                  <li><strong>anno</strong>: es. 2025</li>
                  <li><strong>regione</strong>: es. Marche</li>
                  <li><strong>tipo</strong>: <em>fissa</em> oppure <em>progressiva</em></li>
                  <li><strong>aliquota</strong>: es. 1,50 (usa la virgola)</li>
                  <li><strong>min</strong> (solo progressiva): es. 0</li>
                  <li><strong>max</strong> (solo progressiva, opzionale): es. 15000</li>
                </ul>
              </div>
              <div className="help-section">
                <h4 style={{ display:'flex', alignItems:'center', gap:6 }}><MapPin size={16} /> Esempi righe</h4>
                <ul>
                  <li><code>2025;Marche;fissa;1,50;;</code></li>
                  <li><code>2025;Marche;progressiva;1,00;0;15000</code></li>
                  <li><code>2025;Marche;progressiva;1,20;15000;28000</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="help-card">
            <div className="help-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Download size={24} color="#10B981" />
              <h3>File di esempio</h3>
            </div>
            <div className="help-content">
              <p>Scarica il template CSV pronto da compilare:</p>
              <p>
                <a href="/examples/tax/regional-additionals-example-italian.csv" download className="btn btn-primary">
                  <Download size={16} /> Scarica esempio
                </a>
              </p>
              <p>Separatore consigliato: <strong>;</strong> (punto e virgola).</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}


