import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import axios from 'axios';
import './IrpefUploadPage.css';

const IrpefUploadPage = () => {
  const { user } = useAuthStore();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setPreview(null);

    if (selectedFile) {
      // Leggi il file per l'anteprima
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
          const dataRows = lines.slice(1, Math.min(6, lines.length)); // Prime 5 righe di dati
          
          setPreview({
            headers,
            dataRows: dataRows.map(line => 
              line.split(';').map(v => v.trim().replace(/"/g, ''))
            )
          });
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Seleziona un file CSV');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/taxrates/irpef-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setFile(null);
        setPreview(null);
        // Reset file input
        document.getElementById('csv-file').value = '';
      } else {
        setError(response.data.error || 'Errore nel caricamento');
      }
    } catch (err) {
      console.error('Errore upload:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `year;min;max;rate
2025;0;15000;23
2025;15000;28000;25
2025;28000;50000;35
2025;50000;;43`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'irpef-brackets-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="irpef-upload-page">
      <div className="page-header">
        <h1>📤 Carica Scaglioni IRPEF da CSV</h1>
        <p>Carica gli scaglioni IRPEF da un file CSV per automatizzare l'inserimento</p>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}

      <div className="upload-section">
        <div className="upload-form">
          <div className="file-input-group">
            <label htmlFor="csv-file" className="file-label">
              📁 Seleziona File CSV
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
            />
            {file && (
              <div className="file-info">
                <span>📄 {file.name}</span>
                <span>📊 {(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>

          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn btn-primary"
            >
              {loading ? '⏳ Caricamento...' : '📤 Carica Scaglioni'}
            </button>
          </div>
        </div>

        <div className="template-section">
          <h3>📋 Formato CSV Richiesto</h3>
          <p>Il file CSV deve contenere le seguenti colonne:</p>
          <ul>
            <li><strong>year</strong>: Anno fiscale (es. 2025)</li>
            <li><strong>min</strong>: Importo minimo dello scaglione (es. 0)</li>
            <li><strong>max</strong>: Importo massimo dello scaglione (lasciare vuoto per ∞)</li>
            <li><strong>rate</strong>: Aliquota IRPEF in percentuale (es. 23)</li>
          </ul>
          
          <button onClick={downloadTemplate} className="btn btn-secondary">
            📥 Scarica Template CSV
          </button>
        </div>
      </div>

      {preview && (
        <div className="preview-section">
          <h3>👁️ Anteprima File</h3>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {preview.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.dataRows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.dataRows.length >= 5 && (
              <p className="preview-note">... e altre righe</p>
            )}
          </div>
        </div>
      )}

      <div className="instructions-section">
        <h3>📖 Istruzioni</h3>
        <div className="instructions">
          <div className="instruction-item">
            <h4>1. 📥 Scarica il Template</h4>
            <p>Usa il pulsante "Scarica Template CSV" per ottenere un file di esempio con il formato corretto.</p>
          </div>
          
          <div className="instruction-item">
            <h4>2. ✏️ Modifica il File</h4>
            <p>Apri il file CSV con Excel o un editor di testo e modifica i valori secondo le tue necessità.</p>
          </div>
          
          <div className="instruction-item">
            <h4>3. 📤 Carica il File</h4>
            <p>Seleziona il file modificato e clicca "Carica Scaglioni" per importare i dati nel sistema.</p>
          </div>
          
          <div className="instruction-item">
            <h4>4. ✅ Verifica i Risultati</h4>
            <p>Vai alla pagina "Gestione Scaglioni IRPEF" per verificare che i dati siano stati importati correttamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrpefUploadPage;
