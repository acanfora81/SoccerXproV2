// client_v3/src/components/market/SalaryCalculatorCSV.jsx
// Componente calcolatore stipendi per il modulo Market usando dati CSV simulati

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Euro, TrendingUp, TrendingDown, Building2, Loader2, MapPin } from 'lucide-react';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';

// Mappa delle regioni e file CSV (stessa del TaxCalculator)
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

// Funzioni di utilità (stesse del TaxCalculator)
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

const round2 = (v) => {
  if (v == null || !Number.isFinite(v)) return null;
  return Number(Math.round((v + Number.EPSILON) * 100) / 100);
};

const SalaryCalculatorCSV = ({ 
  netSalary, 
  grossSalary, 
  companyCost, 
  onNetChange, 
  onGrossChange, 
  onCompanyChange,
  disabled = false,
  playerData = {}
}) => {
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('Lombardia'); // Default region
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [loading, setLoading] = useState(false);

  // Carica dati CSV per la regione selezionata
  const loadCSVData = useCallback(async (selectedRegion) => {
    console.log('📁 Caricamento CSV per regione:', selectedRegion);
    setLoading(true);
    setError(null);
    try {
      const file = REGION_CSV_MAP[selectedRegion];
      console.log('📂 File CSV:', file);
      
      const res = await fetch(file, { cache: 'no-store' });
      console.log('📡 Response status:', res.status, res.ok);
      
      if (!res.ok) throw new Error('File CSV per regione non trovato: ' + selectedRegion);
      
      const txt = await res.text();
      console.log('📄 CSV text length:', txt.length);
      
      const { headers, rows } = parseCSV(txt);
      console.log('📊 CSV parsed:', { headersCount: headers.length, rowsCount: rows.length, headers });
      
      setCsvData({ headers, rows });
    } catch (e) {
      console.error('❌ Errore caricamento CSV:', e);
      setError(e.message || 'Errore caricamento dati');
      setCsvData({ headers: [], rows: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica dati CSV al mount e quando cambia regione
  useEffect(() => {
    loadCSVData(region);
  }, [region, loadCSVData]);

  // Calcola da netto a lordo usando dati CSV
  const calculateFromNet = useCallback(async (netValue) => {
    console.log('🔍 calculateFromNet called with:', { netValue, csvRows: csvData.rows.length, headers: csvData.headers });
    
    if (!csvData.rows.length) {
      console.warn('⚠️ Nessun dato CSV disponibile');
      return null;
    }

    const lordoKey = csvData.headers.find(h => h.toLowerCase().includes('lordo')) || 'LORDO';
    const nettoKey = csvData.headers.find(h => h.toLowerCase().includes('netto')) || 'NETTO';
    
    console.log('🔑 Chiavi trovate:', { lordoKey, nettoKey });
    
    const row = findClosestByKey(csvData.rows, nettoKey, netValue);
    console.log('📊 Riga trovata:', row);
    
    if (!row) {
      console.warn('⚠️ Nessuna riga trovata per netto:', netValue);
      return null;
    }

    const grossValue = normalizeNumber(row[lordoKey]);
    const companyCostValue = round2(grossValue * 1.4); // Stima costo azienda (40% in più del lordo)

    console.log('💰 Valori calcolati:', { grossValue, companyCostValue });

    return {
      gross: round2(grossValue),
      companyCost: companyCostValue,
      breakdown: row
    };
  }, [csvData]);

  // Calcola da lordo a netto usando dati CSV
  const calculateFromGross = useCallback(async (grossValue) => {
    console.log('🔍 calculateFromGross called with:', { grossValue, csvRows: csvData.rows.length, headers: csvData.headers });
    
    if (!csvData.rows.length) {
      console.warn('⚠️ Nessun dato CSV disponibile');
      return null;
    }

    const lordoKey = csvData.headers.find(h => h.toLowerCase().includes('lordo')) || 'LORDO';
    const nettoKey = csvData.headers.find(h => h.toLowerCase().includes('netto')) || 'NETTO';
    
    console.log('🔑 Chiavi trovate:', { lordoKey, nettoKey });
    
    const row = findClosestByKey(csvData.rows, lordoKey, grossValue);
    console.log('📊 Riga trovata:', row);
    
    if (!row) {
      console.warn('⚠️ Nessuna riga trovata per lordo:', grossValue);
      return null;
    }

    const netValue = normalizeNumber(row[nettoKey]);
    const companyCostValue = round2(grossValue * 1.4); // Stima costo azienda (40% in più del lordo)

    console.log('💰 Valori calcolati:', { netValue, companyCostValue });

    return {
      net: round2(netValue),
      companyCost: companyCostValue,
      breakdown: row
    };
  }, [csvData]);

  // Gestisce il calcolo quando cambia il netto
  useEffect(() => {
    console.log('🔄 useEffect netto triggered:', { netSalary, csvRows: csvData.rows.length, loading });
    
    // DISABILITATO: Non calcolare automaticamente per permettere input manuale
    // Il calcolo avverrà solo quando l'utente clicca un pulsante specifico
    console.log('⏸️ Calcolo automatico disabilitato per permettere input manuale');
  }, [netSalary, csvData.rows.length, loading, calculateFromNet, onGrossChange, onCompanyChange]);

  // Gestisce il calcolo quando cambia il lordo
  useEffect(() => {
    console.log('🔄 useEffect lordo triggered:', { grossSalary, csvRows: csvData.rows.length, loading });
    
    // DISABILITATO: Non calcolare automaticamente per permettere input manuale
    // Il calcolo avverrà solo quando l'utente clicca un pulsante specifico
    console.log('⏸️ Calcolo automatico disabilitato per permettere input manuale');
  }, [grossSalary, csvData.rows.length, loading, calculateFromGross, onNetChange, onCompanyChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Calcolatore Stipendi (Simulazione AIC)</h3>
          </div>
          {calculating && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selezione Regione */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin size={16} />
            Regione per Calcolo Fiscale
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
            disabled={disabled}
          >
            {ALL_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Indicatore Modalità Simulazione */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Calculator size={16} />
            <span className="text-sm font-medium">Modalità Simulazione</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Calcoli basati sui dati CSV della regione {region}
          </p>
        </div>

        {/* Pulsanti Calcolo Manuale */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              if (netSalary && netSalary > 0 && csvData.rows.length > 0) {
                setCalculating(true);
                setError(null);
                try {
                  const result = await calculateFromNet(netSalary);
                  if (result) {
                    onGrossChange(result.gross);
                    onCompanyChange(result.companyCost);
                    setCalculation(result);
                  }
                } catch (err) {
                  setError(`Errore nel calcolo da netto: ${err.message || err}`);
                } finally {
                  setCalculating(false);
                }
              }
            }}
            disabled={!netSalary || netSalary <= 0 || csvData.rows.length === 0 || calculating}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Calcola da Netto
          </button>
          <button
            type="button"
            onClick={async () => {
              if (grossSalary && grossSalary > 0 && csvData.rows.length > 0) {
                setCalculating(true);
                setError(null);
                try {
                  const result = await calculateFromGross(grossSalary);
                  if (result) {
                    onNetChange(result.net);
                    onCompanyChange(result.companyCost);
                    setCalculation(result);
                  }
                } catch (err) {
                  setError(`Errore nel calcolo da lordo: ${err.message || err}`);
                } finally {
                  setCalculating(false);
                }
              }
            }}
            disabled={!grossSalary || grossSalary <= 0 || csvData.rows.length === 0 || calculating}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Calcola da Lordo
          </button>
        </div>

        {/* Dati Giocatore */}
        {playerData && Object.keys(playerData).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dati Giocatore</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {playerData.position && (
                <div>
                  <span className="text-gray-500">Posizione:</span>
                  <span className="ml-1 font-medium">{playerData.position}</span>
                </div>
              )}
              {playerData.age && (
                <div>
                  <span className="text-gray-500">Età:</span>
                  <span className="ml-1 font-medium">{playerData.age} anni</span>
                </div>
              )}
              {playerData.dateOfBirth && (
                <div>
                  <span className="text-gray-500">Data nascita:</span>
                  <span className="ml-1 font-medium">{new Date(playerData.dateOfBirth).toLocaleDateString('it-IT')}</span>
                </div>
              )}
              {playerData.nationality && (
                <div>
                  <span className="text-gray-500">Nazionalità:</span>
                  <span className="ml-1 font-medium">{playerData.nationality}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Errori */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Caricamento dati fiscali...</span>
          </div>
        )}

        {/* Risultati Calcolo */}
        {calculation && calculation.breakdown && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Breakdown Fiscale</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Contributi Sociali:</span>
                <span className="ml-1 font-medium">€{normalizeNumber(calculation.breakdown['CONT. SOCIALI'])?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">IRPEF Netta:</span>
                <span className="ml-1 font-medium">€{normalizeNumber(calculation.breakdown['IRPEF NETTA'])?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Addizionali:</span>
                <span className="ml-1 font-medium">€{normalizeNumber(calculation.breakdown['ADD. REG./COMUN.'])?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Bonus L.207:</span>
                <span className="ml-1 font-medium">€{normalizeNumber(calculation.breakdown['BONUS L. 207/24'])?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalaryCalculatorCSV;
