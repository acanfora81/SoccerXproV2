// client/src/components/performance/DataPreviewStep.jsx
// 🎯 VERSIONE COMPLETA - Anteprima + Conferma Import nel Database - CON DEBUG

import React, { useEffect, useState, useCallback } from "react";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Upload,
  Database,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";

const API_BASE = "/api/performance/import";

const DataPreviewStep = ({ fileId, mappingResult, originalExtension, onBack, onReset }) => {

  // 📊 State per preview
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚀 State per import finale
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  console.log('🔵 DataPreviewStep renderizzato con import finale'); // INFO DEV - rimuovere in produzione

  /**
   * 📋 Carica preview dati mappati
   */
  const loadPreview = useCallback(async () => {
    try {
      if (!fileId || !mappingResult) {
        setError("File o mapping mancanti.");
        return;
      }

      console.log('🔵 === DEBUG LOAD PREVIEW ==='); // INFO DEV
      console.log('🔵 FileId ricevuto:', fileId);
      console.log('🔵 MappingResult ricevuto:', mappingResult);
      console.log('🔵 OriginalExtension:', originalExtension);
      
      setLoading(true);
      setError(null);

      const toSend = mappingResult?.mapping ? mappingResult.mapping : mappingResult;
      
      console.log('🔵 Mapping da inviare alla preview:', toSend);
      console.log('🔵 URL chiamata:', `${API_BASE}/preview-data`);
      
      const payload = { 
        fileId, 
        mapping: toSend, 
        originalExtension 
      };
      
      console.log('🔵 Payload completo inviato:', JSON.stringify(payload, null, 2));

      const res = await fetch(`${API_BASE}/preview-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log('🔵 Response status preview:', res.status);
      console.log('🔵 Response headers preview:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('🔴 Errore response preview:', errorText); // ERROR
        throw new Error(`Errore preview (${res.status}): ${errorText}`);
      }

      const responseData = await res.json();
      console.log('🔵 Response data preview ricevuta:', responseData);
      
      const preview = responseData?.data || responseData;

      const previewRows = preview?.rows ?? preview?.transformedData ?? [];
      const previewStats = preview?.statistics ?? null;
      const previewWarnings = preview?.warnings ?? [];

      console.log('🔵 Preview rows estratte:', previewRows?.length || 0);
      console.log('🔵 Preview stats estratte:', previewStats);
      console.log('🔵 Preview warnings estratte:', previewWarnings);

      setRows(Array.isArray(previewRows) ? previewRows.slice(0, 20) : []);
      setStats(previewStats || mappingResult?.statistics || null);
      setWarnings(previewWarnings.length ? previewWarnings : (mappingResult?.warnings || []));

      console.log('🟢 Preview caricata:', previewRows.length, 'righe'); // INFO - rimuovere in produzione

    } catch (err) {
      console.log('🔴 Errore preview:', err.message); // ERROR - mantenere essenziali
      setError(err.message || "Errore durante la preview");
    } finally {
      setLoading(false);
    }
  }, [fileId, mappingResult, originalExtension]);

  /**
   * 🚀 Conferma import finale - Salva nel database
   */
  const confirmImport = useCallback(async () => {
    try {
      if (!fileId || !mappingResult) {
        setImportError("File o mapping mancanti per l'import finale.");
        return;
      }

      console.log('🔵 === DEBUG CONFIRM IMPORT ==='); // INFO DEV
      console.log('🔵 FileId per import:', fileId);
      console.log('🔵 MappingResult per import:', mappingResult);
      
      setImporting(true);
      setImportError(null);
      setImportSuccess(false);

      const toSend = mappingResult?.mapping ? mappingResult.mapping : mappingResult;
      
      console.log('🔵 Mapping da inviare all\'import:', toSend);
      console.log('🔵 URL chiamata import:', `${API_BASE}/import-data`);
      
      const payload = { 
        fileId, 
        mapping: toSend, 
        originalExtension 
      };
      
      console.log('🔵 Payload completo import:', JSON.stringify(payload, null, 2));

      const res = await fetch(`${API_BASE}/import-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log('🔵 Response status import:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('🔴 Errore response import:', errorText); // ERROR
        throw new Error(`Errore import (${res.status}): ${errorText}`);
      }

      const result = await res.json();
      console.log('🔵 Response data import ricevuta:', result);

      console.log('🟢 Import completato con successo:', result.data?.summary); // INFO - rimuovere in produzione

      setImportResult(result.data);
      setImportSuccess(true);

      // 🎉 Import riuscito - mostra risultati
      
    } catch (err) {
      console.log('🔴 Errore import finale:', err.message); // ERROR - mantenere essenziali
      setImportError(err.message || "Errore durante l'import finale");
    } finally {
      setImporting(false);
    }
  }, [fileId, mappingResult, originalExtension]);

  // Carica preview al mount
  useEffect(() => {
    if (!importSuccess) {
      loadPreview();
    }
  }, [loadPreview, importSuccess]);

  // Deriva statistiche per UI
  const mappedHeaders = stats?.mappedHeaders ?? mappingResult?.statistics?.mappedHeaders;
  const totalHeaders = stats?.totalHeaders ?? mappingResult?.statistics?.totalHeaders;
  const averageConfidence = stats?.averageConfidence ?? mappingResult?.statistics?.averageConfidence;

  // 🎉 SUCCESS STATE - Import completato
  if (importSuccess && importResult) {
    return (
      <div className="statistics-container">
        <div className="import-success-container">
          <div className="success-header">
            <div className="success-icon">
              <CheckCircle size={64} color="#10B981" />
            </div>
            <h2>🎉 Import Completato con Successo!</h2>
            <p>I dati performance sono stati salvati nel database</p>
          </div>

          {/* Statistiche import */}
          <div className="import-stats-grid">
            <div className="stat-card success">
              <div className="stat-value">{importResult.summary?.totalProcessed || 0}</div>
              <div className="stat-label">Righe Processate</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{importResult.summary?.successfulImports || 0}</div>
              <div className="stat-label">Import Riusciti</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{importResult.summary?.errors || 0}</div>
              <div className="stat-label">Errori</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {importResult.summary?.successRate || 0}%
              </div>
              <div className="stat-label">Tasso Successo</div>
            </div>
          </div>

          {/* Dettagli import */}
          {importResult.summary && (
            <div className="import-details">
              <h3>📋 Dettagli Import</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Giocatori coinvolti:</span>
                  <span className="detail-value">{importResult.summary.playersAffected || 0}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Periodo dati:</span>
                  <span className="detail-value">
                    {importResult.summary.dateRange || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Durata processo:</span>
                  <span className="detail-value">{importResult.summary.processingTime || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Errori se presenti */}
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="import-errors">
              <h4>⚠️ Errori Rilevati</h4>
              <div className="error-list">
                {importResult.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="error-item">
                    <span className="error-row">Riga {error.rowIndex}:</span>
                    <span className="error-message">{error.message}</span>
                  </div>
                ))}
                {importResult.errors.length > 5 && (
                  <div className="error-item more">
                    + {importResult.errors.length - 5} altri errori...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Azioni finali */}
          <div className="success-actions">
            <button onClick={onReset} className="btn btn-outline">
              <RotateCcw size={16} />
              Nuovo Import
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              <ArrowRight size={16} />
              Vai alle Performance
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📋 PREVIEW STATE - Mostra anteprima + conferma
  return (
    <div className="statistics-container">
      <div className="preview-step-container">
        
        {/* Header step */}
        <div className="preview-step-header">
          <div className="header-main">
            <div className="header-title">
              <Database size={32} style={{ color: '#10B981' }} />
              <div>
                <h2>📋 Step 3 – Anteprima Dati</h2>
                <p>Controlla i dati trasformati prima del salvataggio finale</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="progress-indicator">
              <div className="step completed">1</div>
              <div className="step-line"></div>
              <div className="step completed">2</div>
              <div className="step-line"></div>
              <div className="step active">3</div>
              <div className="step-labels">
                <span>Upload</span>
                <span>Mapping</span>
                <span>Conferma</span>
              </div>
            </div>
          </div>

          {/* Stats riepilogative */}
          {(mappedHeaders || totalHeaders || averageConfidence) && (
            <div className="preview-stats">
              <div className="stat-card">
                <div className="stat-value">{mappedHeaders || 0}</div>
                <div className="stat-label">Colonne Mappate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalHeaders || 0}</div>
                <div className="stat-label">Headers CSV</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {averageConfidence ? `${averageConfidence}%` : '0%'}
                </div>
                <div className="stat-label">Confidence</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{rows.length}</div>
                <div className="stat-label">Righe Preview</div>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="preview-loading">
            <RefreshCw size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
            <p>⏳ Generazione anteprima...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="preview-error">
            <XCircle size={24} color="#EF4444" />
            <div className="error-content">
              <strong>❌ Errore Preview:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success content */}
        {!loading && !error && (
          <>
            {/* Warnings */}
            {warnings?.length > 0 && (
              <div className="preview-warnings">
                <AlertTriangle size={20} color="#F59E0B" />
                <div className="warnings-content">
                  <h4>⚠️ Attenzioni Rilevate</h4>
                  <ul>
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Data table */}
            <div className="preview-table-section">
              <div className="table-header">
                <h3>📊 Anteprima Dati Trasformati</h3>
                <p>Prime {rows.length} righe del file processato</p>
              </div>
              
              <div className="preview-table-container">
                <table className="table preview-table">
                  <thead>
                    <tr>
                      {rows[0] ? Object.keys(rows[0]).map((column) => (
                        <th key={column}>{column}</th>
                      )) : (
                        <th>Nessun dato</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      rows.map((row, index) => (
                        <tr key={index}>
                          {Object.keys(row).map((column) => (
                            <td key={column}>
                              {row[column] !== null && row[column] !== undefined 
                                ? String(row[column]) 
                                : ''
                              }
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="100%">Nessuna riga da mostrare</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import confirmation section */}
            <div className="import-confirmation-section">
              <div className="confirmation-header">
                <h3>🚀 Conferma Import</h3>
                <p>I dati sono pronti per essere salvati nel database</p>
              </div>

              {/* Import status */}
              {importError && (
                <div className="import-error">
                  <XCircle size={20} color="#EF4444" />
                  <div className="error-content">
                    <strong>❌ Errore Import:</strong>
                    <span>{importError}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="preview-actions">
                <div className="actions-left">
                  <button onClick={onBack} className="btn btn-secondary" disabled={importing}>
                    <ArrowLeft size={16} />
                    Indietro
                  </button>
                  <button onClick={onReset} className="btn btn-outline" disabled={importing}>
                    <RotateCcw size={16} />
                    Ricomincia
                  </button>
                </div>
                
                <div className="actions-right">
                  <div className="confirmation-status">
                    {rows.length > 0 ? (
                      <div className="status-ready">
                        <CheckCircle size={16} color="#10B981" />
                        <span>✅ {rows.length} righe pronte per l'import</span>
                      </div>
                    ) : (
                      <div className="status-empty">
                        <XCircle size={16} color="#EF4444" />
                        <span>❌ Nessun dato da importare</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={confirmImport}
                    disabled={importing || rows.length === 0}
                    className="btn btn-primary btn-import"
                    title={rows.length === 0 ? 'Nessun dato da importare' : 'Salva i dati nel database'}
                  >
                    {importing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Conferma Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataPreviewStep;