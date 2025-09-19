import React, { useEffect, useMemo, useState } from 'react';
import Segmented from '../../components/ui/Segmented';

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
    setLoading(true);
    setError('');
    setResultRow(null);
    try {
      const file = REGION_CSV_MAP[selectedRegion];
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) throw new Error('File CSV per regione non trovato: ' + selectedRegion);
      const txt = await res.text();
      const { headers, rows } = parseCSV(txt);
      setHeaders(headers);
      setRows(rows);
    } catch (e) {
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
    if (!rows.length) return;
    const value = parseInt(inputValue || '0', 10);
    if (!Number.isFinite(value) || value <= 0) return;
    const key = mode === 'lordo' ? lordoKey : nettoKey;
    const row = findClosestByKey(rows, key, value);
    setResultRow(row || null);
  };

  return (
    <div className="tax-calculator">
      <h1>Calcolatore Fiscale</h1>

      <div className="calculator-controls">
        <div className="control-group">
          <label>Tipo di calcolo</label>
          <Segmented
            options={[
              { value: 'lordo', label: 'Da Lordo a Netto' },
              { value: 'netto', label: 'Da Netto a Lordo' }
            ]}
            value={mode}
            onChange={setMode}
            size="md"
            ariaLabel="Tipo di calcolo"
          />
        </div>

        <div className="controls-row">
          <div className="control-group">
            <label>Regione</label>
            <select className="form-input" value={region} onChange={(e) => setRegion(e.target.value)}>
              {ALL_REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>{mode === 'lordo' ? 'Stipendio Lordo' : 'Stipendio Netto'}</label>
            <input
              className="form-input"
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              placeholder={mode === 'lordo' ? 'Es: 25.000' : 'Es: 18.000'}
            />
          </div>

          <div className="control-group">
            <label>&nbsp;</label>
            <button
              className="btn btn-primary btn-calculate"
              onClick={handleCalculate}
              disabled={!rows.length || !inputValue.trim()}
            >
              Calcola
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading">Caricamento dati…</div>
      )}
      {error && !loading && (
        <div className="loading">Errore: {error}</div>
      )}

      {resultRow && !loading && (
        <div className="calculation-results">
          <h2>Risultati del Calcolo</h2>

          <div className="results-grid">
            <div className="result-section">
              <h3>Importi principali</h3>
              <div className="result-item">
                <span className="label">LORDO</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow[lordoKey]))}</span>
              </div>
              <div className="result-item highlight">
                <span className="label">NETTO</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow[nettoKey]))}</span>
              </div>
            </div>

            <div className="result-section">
              <h3>Voci fiscali</h3>
              <div className="result-item">
                <span className="label">CONT. SOCIALI</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['CONT. SOCIALI']))}</span>
              </div>
              <div className="result-item">
                <span className="label">IMPONIBILE FISCALE</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['IMPONIBILE FISCALE']))}</span>
              </div>
              <div className="result-item">
                <span className="label">IRPEF LORDA</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['IRPEF LORDA']))}</span>
              </div>
              <div className="result-item">
                <span className="label">DETRAZIONI IRPEF</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['DETRAZIONI IRPEF']))}</span>
              </div>
              <div className="result-item">
                <span className="label">ULTERIORE DETRAZIONE L. 207/24</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['ULTERIORE DETRAZIONE L. 207/24']))}</span>
              </div>
              <div className="result-item highlight">
                <span className="label">IRPEF NETTA</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['IRPEF NETTA']))}</span>
              </div>
            </div>

            <div className="result-section">
              <h3>Addizionali e oneri</h3>
              <div className="result-item">
                <span className="label">ADD. REG./COMUN.</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow['ADD. REG./COMUN.']))}</span>
              </div>
              <div className="result-item">
                <span className="label">F.DO SOLIDARIETA'</span>
                <span className="value">{formatCurrency(normalizeNumber(resultRow["F.DO SOLIDARIETA'"]))}</span>
              </div>
            </div>

            <div className="result-section">
              <h3>Bonus</h3>
              <div className="result-item">
                <span className="label">BONUS L. 207/24</span>
                <span className="value bonus">{formatCurrency(normalizeNumber(resultRow['BONUS L. 207/24']))}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
