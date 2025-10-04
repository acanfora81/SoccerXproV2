import React, { useState, useCallback } from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import EmptyState from "@/design-system/ds/EmptyState";

import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  FileSpreadsheet,
  Download,
  Info,
  X,
  Users,
  User
} from "lucide-react";

import { PlayersAPI } from "@/lib/api/players";

export default function PlayersUpload() {
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

    try {
      const result = await PlayersAPI.uploadFile(file);
      setMessage(result.message || "File caricato con successo!");
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Errore nel caricamento file");
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

  const clearFile = () => {
    setFile(null);
    setError(null);
    setMessage("");
    setSuccess(false);
  };

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
    const ext = filename.split('.').pop().toLowerCase();
    return ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet : FileText;
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await PlayersAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([result.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_giocatori.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Errore download template:", err);
      setError("Errore nel download del template");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importa da File"
        subtitle="Carica i dati dei tuoi giocatori da file CSV o Excel"
        actions={
          <Button variant="info" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Scarica Template
          </Button>
        }
      />

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Carica Giocatori</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seleziona un file CSV o Excel (.xlsx) con i dati dei giocatori
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Selector */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              {!file ? (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        Clicca per selezionare un file
                      </span>
                      <span className="text-gray-600 dark:text-gray-400"> o trascina qui</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={onSelectFile}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    CSV, XLSX fino a 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    {React.createElement(getFileIcon(file.name), { 
                      className: "w-8 h-8 text-blue-600 dark:text-blue-400" 
                    })}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!file || loading}
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Carica File
                  </>
                )}
              </Button>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {success && message && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold">Istruzioni per il File</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Formato Richiesto:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• <strong>Nome</strong>: Nome del giocatore</li>
                <li>• <strong>Cognome</strong>: Cognome del giocatore</li>
                <li>• <strong>Data di Nascita</strong>: Formato YYYY-MM-DD</li>
                <li>• <strong>Ruolo</strong>: GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD</li>
                <li>• <strong>Nazionalità</strong>: Codice paese (es. ITA, ESP, FRA)</li>
                <li>• <strong>Altezza</strong>: Altezza in centimetri</li>
                <li>• <strong>Peso</strong>: Peso in chilogrammi</li>
                <li>• <strong>Numero Maglia</strong>: Numero di maglia (opzionale)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Note Importanti:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• La prima riga deve contenere gli header delle colonne</li>
                <li>• I dati devono essere separati da virgole (CSV) o in celle separate (Excel)</li>
                <li>• Le date devono essere nel formato YYYY-MM-DD</li>
                <li>• I ruoli devono corrispondere esattamente ai valori indicati</li>
                <li>• Il file non deve superare i 10MB di dimensione</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Caricamenti Recenti
          </h2>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Nessun caricamento recente"
            description="I tuoi caricamenti di file appariranno qui"
          />
        </CardContent>
      </Card>
    </div>
  );
}
