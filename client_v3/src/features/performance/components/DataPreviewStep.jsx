// client_v3 version - copied logic, Tailwind-compatible container wrappers
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Upload,
  Database,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";

const API_BASE = "/api/performance/import";

export default function DataPreviewStep({ fileId, mappingResult, originalExtension, onBack, onReset }) {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importPhase, setImportPhase] = useState('');

  const loadPreview = useCallback(async () => {
    try {
      if (!fileId || !mappingResult) {
        setError("File o mapping mancanti.");
        return;
      }

      setLoading(true);
      setError(null);

      const toSend = mappingResult?.mapping ? mappingResult.mapping : mappingResult;
      const payload = { fileId, mapping: toSend, originalExtension };

      console.log('🔵 [PREVIEW] Sending request:', {
        url: `${API_BASE}/preview-data`,
        payload,
        cookies: document.cookie
      });
      console.log('🔵 [PREVIEW] Mapping structure:', JSON.stringify(payload.mapping, null, 2));

      const res = await fetch(`${API_BASE}/preview-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log('🔵 [PREVIEW] Response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore preview (${res.status}): ${errorText}`);
      }

      const responseData = await res.json();
      const preview = responseData?.data || responseData;

      const previewRows = preview?.rows ?? preview?.transformedData ?? [];
      const previewStats = preview?.statistics ?? null;
      const previewWarnings = preview?.warnings ?? [];

      setRows(Array.isArray(previewRows) ? previewRows.slice(0, 5) : []);
      setStats(previewStats || mappingResult?.statistics || null);
      setWarnings(previewWarnings.length ? previewWarnings : (mappingResult?.warnings || []));
    } catch (err) {
      setError(err.message || "Errore durante la preview");
    } finally {
      setLoading(false);
    }
  }, [fileId, mappingResult, originalExtension]);

  const translatePhase = (phase) => {
    if (!phase) return '';
    if (phase.startsWith('persist-batch-')) {
      const rest = phase.replace('persist-batch-', '');
      return `Salvataggio dati (${rest})`;
    }
    const map = {
      'validate-input': 'Validazione dati',
      'read-file': 'Lettura file',
      'normalize': 'Normalizzazione',
      'validate-mapping': 'Verifica mappatura',
      'transform': 'Trasformazione',
      'persist': 'Salvataggio dati',
      'done': 'Completato',
      'error': 'Errore'
    };
    return map[phase] || phase;
  };

  const confirmImport = useCallback(async () => {
    try {
      if (!fileId || !mappingResult) {
        setImportError("File o mapping mancanti per l'import finale.");
        return;
      }

      setImporting(true);
      setImportError(null);
      setImportSuccess(false);
      setImportProgress(0);
      setImportPhase('Avvio import...');

      const toSend = mappingResult?.mapping ? mappingResult.mapping : mappingResult;
      const payload = { fileId, mapping: toSend, originalExtension };

      // Avvia import e ottieni jobId
      const res = await fetch(`${API_BASE}/import-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore import (${res.status}): ${errorText}`);
      }

      const { jobId } = await res.json();
      
      // Polling dello stato
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/status/${jobId}`, {
            credentials: "include",
          });
          
          if (!statusRes.ok) {
            clearInterval(pollInterval);
            throw new Error('Errore recupero stato import');
          }
          
          const status = await statusRes.json();
          setImportProgress(status.progress);
          setImportPhase(translatePhase(status.phase || ''));
          
          if (status.state === 'done') {
            clearInterval(pollInterval);
            setImportResult({ summary: status.summary });
            setImportSuccess(true);
            setImporting(false);
          } else if (status.state === 'error') {
            clearInterval(pollInterval);
            throw new Error(status.error || 'Import fallito');
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setImportError(pollErr.message);
          setImporting(false);
        }
      }, 500);
      
    } catch (err) {
      setImportError(err.message || "Errore durante l'import finale");
      setImporting(false);
    }
  }, [fileId, mappingResult, originalExtension]);

  useEffect(() => {
    if (!importSuccess) loadPreview();
  }, [loadPreview, importSuccess]);

  const mappedHeaders = stats?.mappedHeaders ?? mappingResult?.statistics?.mappedHeaders;
  const totalHeaders = stats?.totalHeaders ?? mappingResult?.statistics?.totalHeaders;
  const averageConfidenceRaw = (stats?.averageConfidence ?? mappingResult?.statistics?.averageConfidence);
  const averageConfidence = typeof averageConfidenceRaw === 'number'
    ? Math.round(averageConfidenceRaw)
    : (() => {
        const mh = mappedHeaders || (mappingResult?.mapping ? Object.keys(mappingResult.mapping).length : 0);
        return mh > 0 ? 100 : 0; // fallback: se non fornita, mostra 100% con mapping presente
      })();

  if (importSuccess && importResult) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold mt-3">Import Completato con Successo</h2>
            <p className="text-gray-600 dark:text-white/70">I dati performance sono stati salvati</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl p-4 text-center border border-blue-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <div className="text-xl font-semibold text-gray-900 dark:text-inherit">{importResult.summary?.totalProcessed || 0}</div>
              <div className="text-gray-700 dark:text-white/70 text-sm">Righe Processate</div>
            </div>
            <div className="rounded-xl p-4 text-center border border-blue-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <div className="text-xl font-semibold text-gray-900 dark:text-inherit">{importResult.summary?.successfulImports || 0}</div>
              <div className="text-gray-700 dark:text-white/70 text-sm">Import Riusciti</div>
            </div>
            <div className="rounded-xl p-4 text-center border border-blue-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <div className="text-xl font-semibold text-gray-900 dark:text-inherit">{importResult.summary?.errors || 0}</div>
              <div className="text-gray-700 dark:text-white/70 text-sm">Errori</div>
            </div>
            <div className="rounded-xl p-4 text-center border border-blue-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <div className="text-xl font-semibold text-gray-900 dark:text-inherit">{importResult.summary?.successRate || 0}%</div>
              <div className="text-gray-700 dark:text-white/70 text-sm">Tasso Successo</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center items-center">
            <button type="button" onClick={onReset} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Nuovo Import</button>
            <button type="button" onClick={() => navigate('/app/dashboard/performance')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Vai alle Performance</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Overlay progress durante import */}
      {importing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Import in corso...</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>{importPhase}</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
            <p className="text-center text-white/60 text-sm">Attendere il completamento dell'operazione...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold">Step 3 – Anteprima Dati</h2>
            <p className="text-gray-600 dark:text-white/70">Controlla i dati trasformati prima del salvataggio</p>
          </div>
        </div>

        {(mappedHeaders || totalHeaders || averageConfidence) && (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center dark:text-inherit text-gray-900">
              <div className="text-lg font-semibold text-gray-900 dark:text-inherit">{mappedHeaders || 0}</div>
                <div className="text-gray-700 dark:text-white/70 text-sm">Colonne mappate</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center dark:text-inherit text-gray-900">
              <div className="text-lg font-semibold text-gray-900 dark:text-inherit">{totalHeaders || 0}</div>
                <div className="text-gray-700 dark:text-white/70 text-sm">Headers CSV</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center dark:text-inherit text-gray-900">
                <div className="text-lg font-semibold text-gray-900 dark:text-inherit">{`${averageConfidence}%`}</div>
                <div className="text-gray-700 dark:text-white/70 text-sm">Affidabilità suggerimenti</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center dark:text-inherit text-gray-900">
              <div className="text-lg font-semibold text-gray-900 dark:text-inherit">{rows.length}</div>
                <div className="text-gray-700 dark:text-white/70 text-sm">Righe anteprima</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 mb-6">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <p>Generazione anteprima...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/40 bg-red-500/10 mb-6">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <div className="font-semibold">Errore Preview</div>
              <div className="text-white/80 text-sm">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {warnings?.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <ul className="list-disc pl-5 text-sm text-white/80">
                  {warnings.map((w,i)=>(<li key={i}>{w}</li>))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <div className="mb-2">
                <h3 className="text-lg font-semibold">Anteprima Dati Trasformati</h3>
                <p className="text-sm text-white/70">Prime {rows.length} righe</p>
              </div>
              <div className="overflow-auto rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-transparent">
                <table className="table-auto w-max text-xs leading-tight text-gray-900 dark:text-inherit">
                  <thead className="bg-white border-b border-gray-200 dark:bg-white/10 dark:border-white/10">
                    <tr>
                      {rows[0] ? Object.keys(rows[0]).map((column) => (
                        <th key={column} className="px-2 py-1 text-left font-medium whitespace-nowrap text-gray-900 dark:text-inherit">{column}</th>
                      )) : (
                        <th className="px-2 py-1">Nessun dato</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {rows.length > 0 ? rows.map((row, index) => (
                      <tr key={index} className="odd:bg-white even:bg-white dark:odd:bg-white/5 dark:even:bg-transparent">
                        {Object.keys(row).map((column) => (
                          <td key={column} className="px-2 py-1 border-l border-gray-200 first:border-l-0 whitespace-nowrap dark:border-transparent">
                            {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-3" colSpan="100%">Nessuna riga da mostrare</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
                  <ArrowLeft className="w-4 h-4" />
                  Indietro
                </button>
                <button type="button" onClick={onReset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">
                  <RotateCcw className="w-4 h-4" />
                  Ricomincia
                </button>
              </div>
              <button type="button" onClick={confirmImport} disabled={importing || rows.length === 0} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50">
                {importing ? (<><RefreshCw className="w-4 h-4 animate-spin" />Importando...</>) : (<><Upload className="w-4 h-4" />Conferma Import</>)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



