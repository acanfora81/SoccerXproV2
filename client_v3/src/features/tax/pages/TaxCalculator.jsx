import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, MapPin, Euro, TrendingUp } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';

const REGION_CSV_MAP = {
  // File 1
  "Abruzzo": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Bolzano": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Calabria": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Emilia Romagna": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Lombardia": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Marche": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Puglia": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Trento": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  "Umbria": "/examples/tax-regions/Serie-B-PRO-Abruzzo-Bolzano-Calabria-Emilia_Romagna-Lombardia-Marche-Puglia-Trento-Umbria.csv",
  // File 2
  "Basilicata": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  "Friuli Venezia Giulia": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  "Sardegna": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  "Sicilia": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  "Valle d'Aosta": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  "Veneto": "/examples/tax-regions/Serie-B-PRO-Basilicata-Friuli_Venezia_Giulia-Sardegna-Sicilia-Valle_Aosta-Veneto.csv",
  // File 3
  "Campania": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv",
  "Lazio": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv",
  "Liguria": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv",
  "Molise": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv",
  "Piemonte": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv",
  "Toscana": "/examples/tax-regions/Serie-B-PRO-Campania-Lazio-Liguria-Molise-Piemonte-Toscana.csv"
};

const ALL_REGIONS = Object.keys(REGION_CSV_MAP);

const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
};

const parseCSV = (text) => {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitRow = (row) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const headers = splitRow(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cols = splitRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').replace(/^"|"$/g, '');
    });
    return obj;
  });
  return { headers, rows };
};

const normalizeNumber = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/\s|€|\u00A0/g, '').trim();
  if (s === '') return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      return Number(s.replace(/\./g, '').replace(',', '.'));
    } else {
      return Number(s.replace(/,/g, ''));
    }
  } else if (hasComma) {
    return Number(s.replace(/\./g, '').replace(',', '.'));
  } else {
    return Number(s.replace(/,/g, ''));
  }
};

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const findClosestByKey = (rows, key, target) => {
  let best = null;
  let bestDiff = Infinity;
  for (const r of rows) {
    const n = normalizeNumber(r[key]);
    if (!Number.isFinite(n)) continue;
    const d = Math.abs(n - target);
    if (d < bestDiff) {
      best = r;
      bestDiff = d;
    }
  }
  return best;
};

const TaxCalculator = () => {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [region, setRegion] = useState(ALL_REGIONS[0]);
  const [mode, setMode] = useState('lordo'); // 'lordo' | 'netto'
  const [inputValue, setInputValue] = useState(''); // numeric string without separators
  const [displayValue, setDisplayValue] = useState('');
  const [resultRow, setResultRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadForRegion = async (selectedRegion) => {
    console.log('📁 [LOAD] Loading data for region:', selectedRegion);
    setLoading(true);
    setError('');
    setResultRow(null);
    try {
      const file = REGION_CSV_MAP[selectedRegion];
      console.log('📁 [LOAD] File path:', file);
      
      const res = await fetch(file, { cache: 'no-store' });
      console.log('📁 [LOAD] Response status:', res.status);
      
      if (!res.ok) throw new Error('File CSV per regione non trovato: ' + selectedRegion);
      
      const txt = await res.text();
      console.log('📁 [LOAD] File content length:', txt.length);
      
      const { headers, rows } = parseCSV(txt);
      console.log('📁 [LOAD] Headers:', headers);
      console.log('📁 [LOAD] Rows count:', rows.length);
      console.log('📁 [LOAD] First row:', rows[0]);
      
      setHeaders(headers);
      setRows(rows);
    } catch (e) {
      console.error('❌ [LOAD] Error:', e);
      setHeaders([]);
      setRows([]);
      setError(e.message || 'Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForRegion(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const lordoKey = useMemo(() => headers.find(h => h.toLowerCase().includes('lordo')) || 'LORDO', [headers]);
  const nettoKey = useMemo(() => headers.find(h => h.toLowerCase().includes('netto')) || 'NETTO', [headers]);

  // Funzione per gestire l'input con formattazione real-time
  const handleInputChange = (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^\d]/g, '');
    const formatted = clean ? new Intl.NumberFormat('it-IT').format(parseInt(clean, 10)) : '';
    setDisplayValue(formatted);
    setInputValue(clean);
  };

  const handleCalculate = () => {
    console.log('🔍 [CALCULATE] Starting calculation...');
    console.log('🔍 [CALCULATE] Rows available:', rows.length);
    console.log('🔍 [CALCULATE] Input value:', inputValue);
    console.log('🔍 [CALCULATE] Mode:', mode);
    console.log('🔍 [CALCULATE] Lordo key:', lordoKey);
    console.log('🔍 [CALCULATE] Netto key:', nettoKey);
    
    if (!rows.length) {
      console.log('❌ [CALCULATE] No rows available');
      return;
    }
    
    const value = parseInt(inputValue || '0', 10);
    console.log('🔍 [CALCULATE] Parsed value:', value);
    
    if (!Number.isFinite(value) || value <= 0) {
      console.log('❌ [CALCULATE] Invalid value');
      return;
    }
    
    const key = mode === 'lordo' ? lordoKey : nettoKey;
    console.log('🔍 [CALCULATE] Using key:', key);
    
    const row = findClosestByKey(rows, key, value);
    console.log('🔍 [CALCULATE] Found row:', row);
    
    setResultRow(row || null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Calcolatore Fiscale (Simulazione AIC)"
          subtitle="Calcola stipendi lordi e netti con il sistema fiscale parametrico"
          icon={Calculator}
        />
        <EmptyState
          icon={Calculator}
          title="Caricamento in corso..."
          description="Caricamento dati fiscali per la regione selezionata..."
          loading={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Calcolatore Fiscale (Simulazione AIC)"
          subtitle="Calcola stipendi lordi e netti con il sistema fiscale parametrico"
          icon={Calculator}
        />
        <EmptyState
          icon={Calculator}
          title="Errore di caricamento"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calcolatore Fiscale (Simulazione AIC)"
        subtitle="Calcola stipendi lordi e netti con il sistema fiscale parametrico"
        icon={Calculator}
      />

      {/* Controlli Calcolatore */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Parametri di Calcolo</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controlli in layout a 4 colonne */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo di calcolo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo di calcolo</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="lordo"
                    checked={mode === 'lordo'}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Da Lordo a Netto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="netto"
                    checked={mode === 'netto'}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Da Netto a Lordo</span>
                </label>
              </div>
            </div>

            {/* Regione */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin size={16} />
                Regione
              </label>
              <select 
                className="input-base w-full"
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
              >
                {ALL_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Importo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Euro size={16} />
                {mode === 'lordo' ? 'Stipendio Lordo' : 'Stipendio Netto'}
              </label>
              <input
                className="input-base w-full"
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                placeholder={mode === 'lordo' ? 'Es: 25.000' : 'Es: 18.000'}
              />
            </div>

            {/* Pulsante Calcola */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">&nbsp;</label>
              <Button
                onClick={handleCalculate}
                disabled={!rows.length || !inputValue.trim()}
                className="w-full"
                variant="primary"
              >
                <Calculator size={16} className="mr-2" />
                Calcola
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risultati */}
      {resultRow && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={20} />
              Risultati del Calcolo
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Importi principali */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Importi Principali</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">LORDO</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {formatCurrency(normalizeNumber(resultRow[lordoKey]))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">NETTO</span>
                  <span className="font-bold text-xl text-blue-900 dark:text-blue-100">
                    {formatCurrency(normalizeNumber(resultRow[nettoKey]))}
                  </span>
                </div>
              </div>
            </div>

            {/* Voci fiscali */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Voci Fiscali</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">CONT. SOCIALI</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(normalizeNumber(resultRow['CONT. SOCIALI']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">IMPONIBILE FISCALE</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(normalizeNumber(resultRow['IMPONIBILE FISCALE']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">IRPEF LORDA</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(normalizeNumber(resultRow['IRPEF LORDA']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">DETRAZIONI IRPEF</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(normalizeNumber(resultRow['DETRAZIONI IRPEF']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">ULTERIORE DETRAZIONE L. 207/24</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(normalizeNumber(resultRow['ULTERIORE DETRAZIONE L. 207/24']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <span className="font-semibold text-green-900 dark:text-green-100">IRPEF NETTA</span>
                  <span className="font-bold text-xl text-green-900 dark:text-green-100">
                    {formatCurrency(normalizeNumber(resultRow['IRPEF NETTA']))}
                  </span>
                </div>
              </div>
            </div>

            {/* Addizionali e oneri */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-pink-200 dark:border-pink-800">
              <h4 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-4">Addizionali e Oneri</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">ADD. REG./COMUN.</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(normalizeNumber(resultRow['ADD. REG./COMUN.']))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="font-medium text-gray-700 dark:text-gray-300">F.DO SOLIDARIETA'</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(normalizeNumber(resultRow["F.DO SOLIDARIETA'"]))}
                  </span>
                </div>
              </div>
            </div>

            {/* Bonus */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Bonus</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <span className="font-semibold text-green-900 dark:text-green-100">BONUS L. 207/24</span>
                  <span className="font-bold text-xl text-green-900 dark:text-green-100">
                    {formatCurrency(normalizeNumber(resultRow['BONUS L. 207/24']))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaxCalculator;