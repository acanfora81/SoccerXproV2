import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import Button from "@/design-system/ds/Button";

const numberOrEmpty = (v) => (v === 0 || v ? String(v).replace('.', ',') : "");
const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export default function TaxConfigEditor() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    contributionrate: "",
    solidarityrate: "",
    detrazionifixed: "",
    detrazionipercentonirpef: "",
    ulterioredetrazionefixed: "",
    ulterioredetrazionepercent: "",
    bonusl207fixed: "",
    detrazioneFascia1: "",
    detrazioneMinimo: "",
    detrazioneFascia2: "",
    detrazioneFascia2Max: "",
    detrazioneFascia3: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadYears = async () => {
    const res = await apiClient.get("/api/taxrates/tax-config/years");
    setYears(res.data || []);
    if ((res.data || []).length && !selectedYear) setSelectedYear(res.data[0]);
  };

  const loadYearData = async (year) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/taxrates/tax-config?year=${year}`);
      const data = res.data || [];
      setRows(data);
      const first = data[0];
      setForm({
        contributionrate: numberOrEmpty(first?.contributionrate),
        solidarityrate: numberOrEmpty(first?.solidarityrate),
        detrazionifixed: numberOrEmpty(first?.detrazionifixed),
        detrazionipercentonirpef: numberOrEmpty(first?.detrazionipercentonirpef),
        ulterioredetrazionefixed: numberOrEmpty(first?.ulterioredetrazionefixed),
        ulterioredetrazionepercent: numberOrEmpty(first?.ulterioredetrazionepercent),
        bonusl207fixed: numberOrEmpty(first?.bonusl207fixed),
        detrazioneFascia1: numberOrEmpty(first?.detrazioneFascia1),
        detrazioneMinimo: numberOrEmpty(first?.detrazioneMinimo),
        detrazioneFascia2: numberOrEmpty(first?.detrazioneFascia2),
        detrazioneFascia2Max: numberOrEmpty(first?.detrazioneFascia2Max),
        detrazioneFascia3: numberOrEmpty(first?.detrazioneFascia3),
      });
    } catch (e) {
      setRows([]);
      setForm({
        contributionrate: "",
        solidarityrate: "",
        detrazionifixed: "",
        detrazionipercentonirpef: "",
        ulterioredetrazionefixed: "",
        ulterioredetrazionepercent: "",
        bonusl207fixed: "",
        detrazioneFascia1: "",
        detrazioneMinimo: "",
        detrazioneFascia2: "",
        detrazioneFascia2Max: "",
        detrazioneFascia3: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadYears(); }, []);
  useEffect(() => { if (selectedYear) loadYearData(selectedYear); }, [selectedYear]);

  const handleSave = async () => {
    try {
      setError(null); setSuccess(null);
      const payload = {
        year: selectedYear,
        contributionrate: toNumber(form.contributionrate),
        solidarityrate: toNumber(form.solidarityrate),
        detrazionifixed: toNumber(form.detrazionifixed),
        detrazionipercentonirpef: toNumber(form.detrazionipercentonirpef),
        ulterioredetrazionefixed: toNumber(form.ulterioredetrazionefixed),
        ulterioredetrazionepercent: toNumber(form.ulterioredetrazionepercent),
        bonusl207fixed: toNumber(form.bonusl207fixed),
        detrazioneFascia1: toNumber(form.detrazioneFascia1),
        detrazioneMinimo: toNumber(form.detrazioneMinimo),
        detrazioneFascia2: toNumber(form.detrazioneFascia2),
        detrazioneFascia2Max: toNumber(form.detrazioneFascia2Max),
        detrazioneFascia3: toNumber(form.detrazioneFascia3),
      };
      const res = await apiClient.post("/api/taxrates/tax-config", payload);
      setSuccess(res.message || "Configurazione salvata");
      await loadYearData(selectedYear);
    } catch (e) {
      setError(e.message || "Errore salvataggio");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurazioni Fiscali</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-base"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
            {!years.includes(selectedYear) && (
              <option value={selectedYear}>{selectedYear}</option>
            )}
          </select>
          <Button
            variant="outline"
            onClick={async () => {
              const y = prompt("Inserisci anno", String(new Date().getFullYear()));
              if (!y) return;
              setSelectedYear(parseInt(y));
              await loadYears();
            }}
          >Nuovo Anno</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Parametri Art.13 e Altri</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Contribution Rate (%)" value={form.contributionrate} onChange={(v)=>setForm(s=>({...s, contributionrate:v}))} />
            <Field label="Solidarity Rate (%)" value={form.solidarityrate} onChange={(v)=>setForm(s=>({...s, solidarityrate:v}))} />
            <Field label="Detrazioni Fisse (€)" value={form.detrazionifixed} onChange={(v)=>setForm(s=>({...s, detrazionifixed:v}))} />
            <Field label="Detrazioni % su IRPEF" value={form.detrazionipercentonirpef} onChange={(v)=>setForm(s=>({...s, detrazionipercentonirpef:v}))} />
            <Field label="Ulteriore Detrazione Fissa (€)" value={form.ulterioredetrazionefixed} onChange={(v)=>setForm(s=>({...s, ulterioredetrazionefixed:v}))} />
            <Field label="Ulteriore Detrazione %" value={form.ulterioredetrazionepercent} onChange={(v)=>setForm(s=>({...s, ulterioredetrazionepercent:v}))} />
            <Field label="Bonus L207 Fisso (€)" value={form.bonusl207fixed} onChange={(v)=>setForm(s=>({...s, bonusl207fixed:v}))} />
            <Field label="Detrazione Fascia1 (€)" value={form.detrazioneFascia1} onChange={(v)=>setForm(s=>({...s, detrazioneFascia1:v}))} />
            <Field label="Detrazione Minimo (€)" value={form.detrazioneMinimo} onChange={(v)=>setForm(s=>({...s, detrazioneMinimo:v}))} />
            <Field label="Detrazione Fascia2 (€)" value={form.detrazioneFascia2} onChange={(v)=>setForm(s=>({...s, detrazioneFascia2:v}))} />
            <Field label="Detrazione Fascia2 Max (€)" value={form.detrazioneFascia2Max} onChange={(v)=>setForm(s=>({...s, detrazioneFascia2Max:v}))} />
            <Field label="Detrazione Fascia3 (€)" value={form.detrazioneFascia3} onChange={(v)=>setForm(s=>({...s, detrazioneFascia3:v}))} />
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="primary" onClick={handleSave} disabled={loading}>Salva</Button>
            <Button variant="secondary" onClick={()=>loadYearData(selectedYear)} disabled={loading}>Annulla</Button>
          </div>

          {error && <p className="text-red-600 mt-3">{error}</p>}
          {success && <p className="text-green-600 mt-3">{success}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Configurazioni Salvate</h2>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna configurazione per l'anno selezionato.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Year</th>
                    <th className="py-2 pr-4">Contribution</th>
                    <th className="py-2 pr-4">Solidarity</th>
                    <th className="py-2 pr-4">Detr. Fisse</th>
                    <th className="py-2 pr-4">Detr. % IRPEF</th>
                    <th className="py-2 pr-4">Ulter. Fisse</th>
                    <th className="py-2 pr-4">Ulter. %</th>
                    <th className="py-2 pr-4">Bonus L207</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 pr-4">{r.year}</td>
                      <td className="py-2 pr-4">{r.contributionrate}</td>
                      <td className="py-2 pr-4">{r.solidarityrate}</td>
                      <td className="py-2 pr-4">{r.detrazionifixed}</td>
                      <td className="py-2 pr-4">{r.detrazionipercentonirpef}</td>
                      <td className="py-2 pr-4">{r.ulterioredetrazionefixed}</td>
                      <td className="py-2 pr-4">{r.ulterioredetrazionepercent}</td>
                      <td className="py-2 pr-4">{r.bonusl207fixed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type="text"
        className="input-base"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder="0,00"
      />
    </div>
  );
}


