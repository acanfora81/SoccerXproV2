// Percorso: client_v3/src/features/performance/components/ImportWizard.jsx
import React, { useState, useCallback } from "react";
import { Upload, FileText, RefreshCw, Search, FileSpreadsheet, Info, X, CheckCircle, AlertTriangle } from "lucide-react";
import ColumnMappingStep from "./ColumnMappingStep";
import DataPreviewStep from "./DataPreviewStep";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"}/performance/import`;

export default function ImportWizard({ teamId }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [originalExtension, setOriginalExtension] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mappingResult, setMappingResult] = useState(null);

  const onSelectFile = useCallback((e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setHeaders([]);
    setError(null);
    if (f) {
      setStep(1);
      setMappingResult(null);
    }
  }, []);

  const readHeaders = useCallback(async () => {
    try {
      if (!file) {
        setError("Seleziona prima un file CSV o Excel");
        return;
      }
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
        setHeaders(data.headers);
        setFileId(data.fileId || null);
        setOriginalExtension(data.originalExtension || null);
        setStep(2);
      } else {
        throw new Error("Nessuna intestazione trovata nel file.");
      }
    } catch (err) {
      setError(err.message || "Errore durante l'analisi del file");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleMappingComplete = useCallback((result) => {
    setMappingResult(result);
    setStep(3);
  }, []);

  const resetFlow = useCallback(() => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setFileId(null);
    setOriginalExtension(null);
    setMappingResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024; const sizes = ["Bytes", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (filename) => {
    if (!filename) return FileText;
    const ext = filename.split('.').pop().toLowerCase();
    return ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet : FileText;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Upload className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Import Dati Atleti</h1>
            <p className="text-white/70">Carica dati performance da CSV o Excel</p>
          </div>
        </div>

        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-50 border border-blue-200 rounded-xl p-6 dark:bg-white/5 dark:border-white/10">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Upload className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Seleziona File</h2>
                <p className="text-white/60 mb-6">CSV o Excel (.xlsx, .xls)</p>
                <input id="performance-file" type="file" accept=".csv,.xlsx,.xls" onChange={onSelectFile} className="hidden" />
                <label htmlFor="performance-file" className="block cursor-pointer">
                  {!file ? (
                    <div className="rounded-xl border border-dashed border-blue-200 p-8 bg-gray-50 hover:border-blue-400 transition-colors dark:bg-transparent dark:border-white/20 dark:hover:border-white/40">
                      <p className="text-gray-700 dark:text-white/70">Clicca per selezionare un file o trascinalo qui</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
                        <FileText className="w-4 h-4" />
                        <span>CSV, Excel (.xlsx, .xls)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 p-4 bg-blue-50 dark:border-white/10 dark:bg-white/5">
                      {(() => { const Icon = getFileIcon(file.name); return <Icon className="w-6 h-6 text-blue-400" />; })()}
                      <div className="flex-1 px-4 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                        <div className="text-sm text-gray-600 dark:text-white/60">{formatFileSize(file.size)} • Pronto per analisi</div>
                      </div>
                      <button type="button" onClick={(e)=>{e.preventDefault(); setFile(null); setError(null);}} className="p-2 rounded-lg hover:bg-white/10">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </label>

                <div className="mt-6">
                  <button onClick={readHeaders} disabled={!file || loading} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition-colors">
                    {loading ? (<><RefreshCw className="w-4 h-4 animate-spin" />Analisi in corso...</>) : (<><Search className="w-4 h-4" />Analizza File</>)}
                  </button>
                </div>

                {error && (
                  <div className="mt-6 inline-flex items-start gap-3 text-left p-4 rounded-lg border border-red-500/40 bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <div className="font-semibold">Si è verificato un errore</div>
                      <div className="text-sm text-white/80">{error}</div>
                    </div>
                  </div>
                )}

                {headers?.length > 0 && (
                  <div className="mt-6 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h3 className="font-semibold">File analizzato con successo</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {headers.slice(0,6).map((h,i)=> (
                        <span key={i} className="px-2 py-1 text-xs rounded-md bg-white/10 border border-white/10">{h}</span>
                      ))}
                      {headers.length>6 && (
                        <span className="px-2 py-1 text-xs rounded-md bg-white/10 border border-white/10">+{headers.length-6} altre...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-blue-200 rounded-xl p-6 dark:bg-white/5 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3"><Info className="w-5 h-5 text-blue-400" /><h3 className="font-semibold">Come importare</h3></div>
              <div className="space-y-4 text-sm text-gray-700 dark:text-white/80">
                <div>
                  <div className="font-medium mb-1">Formati supportati</div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-white/70">
                    <li>CSV: `,` o `;`</li>
                    <li>Excel: .xlsx o .xls</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium mb-1">Requisiti file</div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-white/70">
                    <li>Prima riga = intestazioni</li>
                    <li>UTF-8 (CSV)</li>
                    <li>Giocatore e Data obbligatori</li>
                  </ul>
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
            fileId={fileId}
          />
        )}

        {step === 3 && (
          <DataPreviewStep
            fileId={fileId}
            mappingResult={mappingResult}
            originalExtension={originalExtension}
            onBack={() => setStep(2)}
            onReset={resetFlow}
          />
        )}
      </div>
    </div>
  );
}


