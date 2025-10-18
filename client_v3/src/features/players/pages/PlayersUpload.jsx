import React, { useState, useCallback } from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import EmptyState from "@/design-system/ds/EmptyState";
import GlobalLoader from "@/components/ui/GlobalLoader";

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
  const [progress, setProgress] = useState(0);

  // Normalizza ruolo: accetta italiano/inglese e restituisce i codici backend
  const normalizeRole = (raw) => {
    if (!raw) return '';
    const v = String(raw).trim().toUpperCase();
    if (['GOALKEEPER','GK','POR','PORTIERE'].includes(v)) return 'GOALKEEPER';
    if (['DEFENDER','DF','DIF','DIFENSORE','DIFENSORE'].includes(v)) return 'DEFENDER';
    if (['MIDFIELDER','MF','CEN','CENTROCAMPISTA','CENTROCAPISTA'].includes(v)) return 'MIDFIELDER';
    if (['FORWARD','FW','ATT','ATTACCANTE'].includes(v)) return 'FORWARD';
    return v; // fallback lascia invariato
  };

  // Normalizza data: accetta GG/MM/AAAA o GG-MM-AAAA e ISO
  const normalizeDate = (raw) => {
    if (!raw) return '';
    const s = String(raw).trim();
    // ISO già valido
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2,'0');
      const mm = m[2].padStart(2,'0');
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return s; // fallback
  };

  // Preprocessa CSV: mappa header e valori al formato backend
  const preprocessCsv = async (file) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return file;
    const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));

    // Mappa headers noti
    const idx = (nameVariants) => {
      const idx = rawHeaders.findIndex(h => nameVariants.includes(h));
      return idx >= 0 ? idx : -1;
    };

    const col = {
      firstName: idx(['nome','first name','firstname','first_name']),
      lastName: idx(['cognome','last name','lastname','last_name']),
      dateOfBirth: idx(['data di nascita','data_nascita','dob','dateofbirth','date_of_birth']),
      nationality: idx(['nazionalità','nationality']),
      role: idx(['ruolo','position','posizione']),
      shirtNumber: idx(['numero maglia','shirt number','shirtnumber','shirt_number','maglia']),
      height: idx(['altezza','height','cm']),
      weight: idx(['peso','weight','kg']),
      preferredFoot: idx(['piede preferito','preferred foot','preferredfoot','foot']),
      placeOfBirth: idx(['luogo di nascita','place of birth','placeofbirth','birthplace']),
      taxCode: idx(['codice fiscale','tax code','taxcode','fiscalcode']),
      passportNumber: idx(['passaporto','passport','passport number','passportnumber']),
    };

    const outHeaders = ['firstName','lastName','dateOfBirth','nationality','position','shirtNumber','height','weight','preferredFoot','placeOfBirth','taxCode','passportNumber'];
    const outRows = rows.map(r => {
      const get = (i) => (i >= 0 && i < r.length ? r[i] : '');
      const firstName = get(col.firstName);
      const lastName = get(col.lastName);
      const dateOfBirth = normalizeDate(get(col.dateOfBirth));
      const nationality = get(col.nationality) || 'Italia';
      const position = normalizeRole(get(col.role));
      const shirtNumber = get(col.shirtNumber);
      const height = get(col.height);
      const weight = get(col.weight);
      const preferredFoot = get(col.preferredFoot);
      const placeOfBirth = get(col.placeOfBirth);
      const taxCode = get(col.taxCode);
      const passportNumber = get(col.passportNumber);
      return [firstName,lastName,dateOfBirth,nationality,position,shirtNumber,height,weight,preferredFoot,placeOfBirth,taxCode,passportNumber].join(',');
    });

    const csv = [outHeaders.join(','), ...outRows].join('\n');
    return new File([csv], `normalized_${file.name.replace(/\.csv$/i,'')}.csv`, { type: 'text/csv' });
  };

  const handleUpload = async () => {
    if (!file) {
      setError("⚠️ Seleziona prima un file CSV o Excel");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage("");
    setSuccess(false);
    setProgress(0);

    try {
      // Simula avanzamento (se il backend non supporta progress events)
      const progressTimer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 5 : p));
      }, 200);

      // Se CSV: normalizza ruoli, date e colonne prima di inviare
      let fileToSend = file;
      if (file && file.name && file.name.toLowerCase().endsWith('.csv')) {
        try {
          fileToSend = await preprocessCsv(file);
        } catch (e) {
          console.warn('Preprocessing CSV fallito, invio file originale', e);
        }
      }

      const result = await PlayersAPI.uploadFile(fileToSend);
      setMessage(result.message || "File caricato con successo!");
      setSuccess(true);
      setProgress(100);
      clearInterval(progressTimer);
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
      // Fallback: genera template CSV lato client
      const headers = [
        'firstName','lastName','dateOfBirth','nationality','position','shirtNumber','height','weight','preferredFoot','placeOfBirth','taxCode','passportNumber'
      ];
      const example = [
        'Mario','Rossi','1995-03-15','Italia','GOALKEEPER','1','185','80','DX','Roma','RSSMRA95C15H501X','YA1234567'
      ];
      const csv = [headers.join(','), example.join(',')].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_giocatori.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importa da File"
        subtitle="Carica i dati dei tuoi giocatori da file CSV o Excel"
        actions={
          <div className="flex gap-2">
            <Button variant="success" onClick={() => handleDownloadTemplate('it')}>
              <Download className="w-4 h-4 mr-2" />
              Scarica Template (ITA)
            </Button>
            <Button variant="info" onClick={() => handleDownloadTemplate('en')}>
              <Download className="w-4 h-4 mr-2" />
              Scarica Template (ENG)
            </Button>
          </div>
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
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  setFile(files[0]);
                  setError(null);
                  setMessage("");
                  setSuccess(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
            >
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

            {/* Barra di avanzamento */}
            {loading && (
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-600 dark:bg-blue-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}


            {/* Upload Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
                className="min-w-[200px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Carica File
                  </>
                )}
              </button>
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
                <li>• <strong>Data di Nascita</strong>: accetta <code>AAAA-MM-GG</code> oppure <code>GG/MM/AAAA</code> / <code>GG-MM-AAAA</code></li>
                <li>• <strong>Ruolo</strong>: accetta IT/EN (Portiere/POR/GK, Difensore/DIF/DF, Centrocampista/CEN/MF, Attaccante/ATT/FW)</li>
                <li>• <strong>Nazionalità</strong>: Codice paese o testo (es. ITA, Italia)</li>
                <li>• <strong>Altezza</strong>: in centimetri (es. 183)</li>
                <li>• <strong>Peso</strong>: in chilogrammi (es. 76)</li>
                <li>• <strong>Numero Maglia</strong>: (opzionale)</li>
                <li>• <strong>Piede Preferito</strong>: (es. DX/SX o Right/Left)</li>
                <li>• <strong>Luogo di Nascita</strong>: città</li>
                <li>• <strong>Codice Fiscale</strong>: (opzionale)</li>
                <li>• <strong>Passaporto</strong>: numero documento (opzionale)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Note Importanti:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• La prima riga deve contenere gli header. Il sistema riconosce automaticamente sinonimi: es. <em>Nome/First Name</em>, <em>Ruolo/Position</em>, ecc.</li>
                <li>• I dati possono essere CSV (separati da virgole) o Excel (.xlsx)</li>
                <li>• Le date in formato <code>GG/MM/AAAA</code> o <code>GG-MM-AAAA</code> saranno convertite automaticamente</li>
                <li>• I ruoli in italiano/inglese verranno normalizzati automaticamente ai valori richiesti dal backend</li>
                <li>• Limite dimensione file: 10MB</li>
                <li>• Usa il bottone <strong>Scarica Template</strong> per partire dal modello aggiornato</li>
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
