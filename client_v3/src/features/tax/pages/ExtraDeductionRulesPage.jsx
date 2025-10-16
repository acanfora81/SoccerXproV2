import React, { useEffect, useMemo, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/utils/apiClient';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardHeader, CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import GlobalLoader from '@/components/ui/GlobalLoader';
import EmptyState from '@/design-system/ds/EmptyState';
import { Plus, Save, Trash2, RefreshCw } from 'lucide-react';

export default function ExtraDeductionRulesPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ year: new Date().getFullYear(), min: '', max: '', amount: '', slope: '' });

  const availableYears = useMemo(() => {
    const set = new Set(rules.map(r => r.year));
    if (selectedYear && !set.has(selectedYear)) set.add(selectedYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [rules, selectedYear]);

  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState('');

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = selectedYear ? `?year=${selectedYear}` : '';
      const res = await apiFetch(`/api/taxrates/extra-deduction-rules${qs}`);
      const list = res?.data || [];
      setRules(list);
      setForm(f => ({ ...f, year: selectedYear }));
    } catch (e) {
      setError('Errore nel caricamento delle regole di ulteriore detrazione');
    } finally {
      setLoading(false);
    }
  };

  const parseNum = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const s = String(v).replace('%', '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value || new Date().getFullYear());
    setSelectedYear(y);
  };

  const handleAddRule = async () => {
    try {
      setLoading(true);
      setError(null);
      const yearVal = parseInt(form.year || selectedYear);
      const minVal = parseNum(form.min);
      const amountVal = parseNum(form.amount);
      const maxVal = form.max === '' ? null : parseNum(form.max);

      if (!Number.isFinite(yearVal)) {
        setError('Anno non valido');
        setLoading(false);
        return;
      }
      if (minVal === null || amountVal === null) {
        setError('Inserisci valori numerici validi per Min e Importo');
        setLoading(false);
        return;
      }

      const payload = {
        year: yearVal,
        min: minVal,
        max: maxVal,
        amount: amountVal,
        // opzionale: pendenza €/€ se vorrai modellare formule lineari
        ...(form.slope !== '' ? { slope: parseNum(form.slope) ?? 0 } : {})
      };
      await apiFetch('/api/taxrates/extra-deduction-rules', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setForm({ year: selectedYear, min: '', max: '', amount: '', slope: '' });
      await loadRules();
    } catch (e) {
      setError('Errore nel salvataggio della regola');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/api/taxrates/extra-deduction-rules/${id}`, { method: 'DELETE' });
      await loadRules();
    } catch (e) {
      setError('Errore nell\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.teamId) {
    return <EmptyState title="Nessun team selezionato" description="Accedi con un team valido per gestire le detrazioni." />;
  }

  if (loading) return <GlobalLoader sectionName="Detrazioni extra" fullscreen={false} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ulteriore detrazione" description="Gestisci le regole per anno e scaglioni (per team)." />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Anno</label>
            <select value={selectedYear} onChange={handleYearChange} className="px-3 py-2 rounded border bg-white dark:bg-gray-800">
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button size="sm" variant="secondary" onClick={() => setShowAddYear(v => !v)}>Nuovo anno</Button>
            {showAddYear && (
              <div className="flex items-center gap-2">
                <input value={newYear} onChange={e => setNewYear(e.target.value)} className="px-2 py-1 rounded border bg-white dark:bg-gray-800" placeholder="es. 2026" />
                <Button size="sm" onClick={() => {
                  const y = parseInt(newYear);
                  if (Number.isFinite(y)) {
                    setSelectedYear(y);
                    setForm(f => ({ ...f, year: y }));
                    setShowAddYear(false); setNewYear('');
                  }
                }}>Imposta</Button>
              </div>
            )}
            <Button onClick={loadRules} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Min (€)</label>
              <input name="min" value={form.min} onChange={handleChange} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" placeholder="es. 0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Max (€)</label>
              <input name="max" value={form.max} onChange={handleChange} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" placeholder="lascia vuoto per infinito" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Importo (€)</label>
              <input name="amount" value={form.amount} onChange={handleChange} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" placeholder="es. 100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Slope (€/€) opz.</label>
              <input name="slope" value={form.slope} onChange={handleChange} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" placeholder="es. -0.09" />
            </div>
            <div className="flex items-end"><Button onClick={handleAddRule}><Plus className="w-4 h-4 mr-2" />Aggiungi regola</Button></div>
          </div>

          <div className="mt-6">
            {rules.length === 0 ? (
              <EmptyState title="Nessuna regola" description="Aggiungi la prima regola per l'anno selezionato." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-300">
                      <th className="py-2 pr-4">Anno</th>
                      <th className="py-2 pr-4">Min</th>
                      <th className="py-2 pr-4">Max</th>
                      <th className="py-2 pr-4">Importo</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(r => (
                      <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="py-2 pr-4">{r.year}</td>
                        <td className="py-2 pr-4">{r.min}</td>
                        <td className="py-2 pr-4">{r.max ?? '∞'}</td>
                        <td className="py-2 pr-4">{r.amount}</td>
                        <td className="py-2 pr-4 text-right">
                          <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 mr-1" />Elimina</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-600 mt-3 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


