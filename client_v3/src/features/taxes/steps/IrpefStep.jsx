import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Save } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const IrpefStep = () => {
  const { teamId, year, fetchStatus, setActiveTab, currentScenarioId } = useFiscalSetup();
  const [brackets, setBrackets] = useState([
    { min: 0, max: 28000, rate: 23 },
    { min: 28000, max: 50000, rate: 35 },
    { min: 50000, max: null, rate: 43 }
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addBracket = () => {
    setBrackets([...brackets, { min: 0, max: null, rate: 0 }]);
  };

  const removeBracket = (index) => {
    setBrackets(brackets.filter((_, i) => i !== index));
  };

  const updateBracket = (index, field, value) => {
    const updated = [...brackets];
    updated[index][field] = field === 'rate' ? parseFloat(value) : (value === '' ? null : parseFloat(value));
    setBrackets(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/irpef`,
        { teamId, year, brackets },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: 'Scaglioni IRPEF salvati con successo!' });
      setActiveTab('detractions');
      fetchStatus();
    } catch (error) {
      console.error('Error saving IRPEF:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!teamId || !year) return;
      try {
        const res = await axios.get('/api/fiscal-setup/step/irpef', { params: { teamId, year }, withCredentials: true });
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setBrackets(res.data.data.map(b => ({ min: b.min, max: b.max, rate: b.rate })));
        }
      } catch (e) {}
    };
    load();
  }, [teamId, year, currentScenarioId]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Scaglioni IRPEF</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Definisci gli scaglioni progressivi IRPEF. L'ultimo scaglione può avere "max" vuoto (illimitato).
          </p>

          {/* Table */}
          <div className="border rounded dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 dark:text-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Da (€)</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">A (€)</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Aliquota (%)</th>
                  <th className="px-4 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((bracket, index) => (
                  <tr key={index} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={bracket.min}
                        onChange={(e) => updateBracket(index, 'min', e.target.value)}
                        className="w-full border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={bracket.max || ''}
                        onChange={(e) => updateBracket(index, 'max', e.target.value)}
                        placeholder="∞"
                        className="w-full border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={bracket.rate}
                        onChange={(e) => updateBracket(index, 'rate', e.target.value)}
                        className="w-full border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeBracket(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addBracket}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Scaglione
          </button>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva IRPEF'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IrpefStep;

