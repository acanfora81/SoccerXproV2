import React, { useEffect, useMemo, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/utils/apiClient';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardHeader, CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import GlobalLoader from '@/components/ui/GlobalLoader';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { Plus, Trash2, RefreshCw, Save, XCircle } from 'lucide-react';

export default function BonusL207RulesPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [form, setForm] = useState({ year: new Date().getFullYear(), min_income: '', max_income: '', bonus_percentage: '' });
  const [showDeleteYearDialog, setShowDeleteYearDialog] = useState(false);
  const [yearToDelete, setYearToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState({ isOpen: false, message: '' });

  const availableYears = useMemo(() => {
    const set = new Set(rules.map(r => r.year));
    if (selectedYear && !set.has(selectedYear)) set.add(selectedYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [rules, selectedYear]);

  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState('');

  useEffect(() => {
    if (selectedYear !== null) loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const res = await apiFetch('/api/taxrates/bonus-l207-rules/years');
      const list = res?.data || [];
      const sorted = list.sort((a,b)=>b-a);
      if (sorted.length > 0) setSelectedYear(prev => prev ?? sorted[0]);
    } catch {}
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = selectedYear ? `?year=${selectedYear}` : '';
      const res = await apiFetch(`/api/taxrates/bonus-l207-rules${qs}`);
      const list = res?.data || [];
      setRules(list);
      setForm(f => ({ ...f, year: selectedYear || new Date().getFullYear() }));
    } catch (e) {
      setError('Errore nel caricamento delle regole bonus L207');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

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
      const minVal = parseNum(form.min_income);
      const percVal = parseNum(form.bonus_percentage);
      const maxVal = form.max_income === '' ? null : parseNum(form.max_income);

      if (!Number.isFinite(yearVal)) {
        setError('Anno non valido');
        setLoading(false);
        return;
      }
      if (minVal === null || percVal === null) {
        setError('Inserisci valori numerici validi per Min e Percentuale');
        setLoading(false);
        return;
      }
      if (percVal < 0 || percVal > 100) {
        setError('La percentuale deve essere tra 0 e 100');
        setLoading(false);
        return;
      }

      const payload = {
        year: yearVal,
        min_income: minVal,
        max_income: maxVal,
        bonus_percentage: percVal
      };
      await apiFetch('/api/taxrates/bonus-l207-rules', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setForm({ year: selectedYear, min_income: '', max_income: '', bonus_percentage: '' });
      await loadRules();
    } catch (e) {
      setError('Errore nel salvataggio della regola bonus');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/api/taxrates/bonus-l207-rules/${id}`, { method: 'DELETE' });
      await loadRules();
    } catch (e) {
      setError('Errore nell\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.teamId) {
    return <EmptyState title="Nessun team selezionato" description="Accedi con un team valido per gestire i bonus L207." />;
  }

  if (loading && selectedYear !== null) return <GlobalLoader sectionName="Bonus L207" fullscreen={false} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Bonus L.207/2019" description="Gestisci le regole per anno e scaglioni (per team)." />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Anno</label>
              {availableYears.length > 0 ? (
                <select value={selectedYear ?? ''} onChange={handleYearChange} className="px-3 py-2 rounded border bg-white dark:bg-gray-800">
                  {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Nessun anno configurato</span>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowAddYear(v => !v)}>Nuovo anno</Button>
              {showAddYear && (
                <div className="flex items-center gap-2">
                  <input value={newYear} onChange={e => setNewYear(e.target.value)} className="px-2 py-1 rounded border bg-white dark:bg-gray-800" placeholder="es. 2026" />
                  <Button size="sm" onClick={async () => {
                    const y = parseInt(newYear);
                    if (!Number.isFinite(y)) return;
                    const res = await apiFetch('/api/taxrates/bonus-l207-rules/year', { method:'POST', body: JSON.stringify({ year: y }) });
                    if (res.success) { setSelectedYear(y); setShowAddYear(false); setNewYear(''); setSuccessMessage({ isOpen: true, message: `Anno ${y} creato` }); await fetchYears(); await loadRules(); }
                  }}>Imposta</Button>
                </div>
              )}
              <Button onClick={loadRules} variant="ghost" size="sm" disabled={selectedYear===null}><RefreshCw className="w-4 h-4" /></Button>
            </div>
            {selectedYear !== null && (
              <Button size="sm" variant="danger" onClick={() => { setYearToDelete(selectedYear); setShowDeleteYearDialog(true);} }>
                <Trash2 className="w-4 h-4 mr-1" /> Elimina anno
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedYear === null && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-300">Crea un anno e inserisci gli scaglioni del Bonus L.207/2019 (sconto % sull'IRPEF pre-bonus).</div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Min (€)</label>
                <input 
                  name="min_income" 
                  value={form.min_income} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" 
                  placeholder="es. 0" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Max (€)</label>
                <input 
                  name="max_income" 
                  value={form.max_income} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" 
                  placeholder="lascia vuoto per infinito" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Sconto IRPEF (%)</label>
                <input 
                  name="bonus_percentage" 
                  value={form.bonus_percentage} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-800" 
                  placeholder="es. 100" 
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button 
                onClick={handleAddRule}
                variant="success"
                size="sm"
                className="min-w-[32px] h-8"
                title="Salva scaglione"
              >
                <Save size={14} />
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setForm({ year: selectedYear || new Date().getFullYear(), min_income:'', max_income:'', bonus_percentage:'' })}
                size="sm"
                className="min-w-[32px] h-8"
                title="Reset form"
              >
                <XCircle size={14} />
              </Button>
            </div>
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
                      <th className="py-2 pr-4">Sconto IRPEF (%)</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(r => (
                      <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="py-2 pr-4">{r.year}</td>
                        <td className="py-2 pr-4">{r.min_income}</td>
                        <td className="py-2 pr-4">{r.max_income ?? '∞'}</td>
                        <td className="py-2 pr-4">{r.bonus_percentage}</td>
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

      <ConfirmDialog
        open={showDeleteYearDialog}
        onOpenChange={(open)=> setShowDeleteYearDialog(open)}
        onConfirm={async ()=>{
          if (!yearToDelete) return;
          const res = await apiFetch(`/api/taxrates/bonus-l207-rules/year/${yearToDelete}`, { method:'DELETE' });
          if (res.success) { setSuccessMessage({ isOpen: true, message: `Anno ${yearToDelete} eliminato` }); await fetchYears(); await loadRules(); }
        }}
        title="Elimina Anno"
        message={`Confermi l'eliminazione di tutte le regole per l'anno ${yearToDelete || selectedYear}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      <ConfirmDialog
        open={successMessage.isOpen}
        onOpenChange={(open)=> setSuccessMessage({ isOpen: open, message: '' })}
        onConfirm={()=> setSuccessMessage({ isOpen: false, message: '' })}
        title="Operazione completata"
        message={successMessage.message}
        confirmText="Chiudi"
        showCancel={false}
      />
    </div>
  );
}


