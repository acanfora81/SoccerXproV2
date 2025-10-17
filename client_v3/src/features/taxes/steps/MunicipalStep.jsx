import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const MunicipalStep = () => {
  const { teamId, year, region, municipality, fetchStatus, setActiveTab, currentScenarioId } = useFiscalSetup();
  const [isProgressive, setIsProgressive] = useState(false);
  const [flatRate, setFlatRate] = useState(0.8);
  const [brackets, setBrackets] = useState([
    { min: 0, max: 15000, rate: 0.5 },
    { min: 15001, max: null, rate: 0.8 }
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addBracket = () => {
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket.max ? lastBracket.max + 1 : 0;
    setBrackets([...brackets, { min: newMin, max: null, rate: 0 }]);
  };

  const removeBracket = (index) => {
    if (brackets.length > 1) {
      setBrackets(brackets.filter((_, i) => i !== index));
    }
  };

  const updateBracket = (index, field, value) => {
    const updated = [...brackets];
    if (field === 'max') {
      updated[index][field] = value === '' || value === null ? null : parseFloat(value);
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setBrackets(updated);
  };

  const handleSave = async () => {
    if (!region || !municipality) {
      setMessage({ type: 'error', text: 'Specifica regione e comune nel contesto fiscale' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/municipal`,
        {
          teamId,
          year,
          region,
          municipality,
          is_progressive: isProgressive,
          flat_rate: isProgressive ? null : flatRate,
          brackets: isProgressive ? brackets : []
        },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: 'Addizionale comunale salvata!' });
      setActiveTab('review');
      fetchStatus();
    } catch (error) {
      console.error('Error saving municipal:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!teamId || !year || !region || !municipality) return;
      try {
        const res = await axios.get('/api/fiscal-setup/step/municipal', { params: { teamId, year, region, municipality }, withCredentials: true });
        const data = res.data?.data;
        if (data?.config) {
          setIsProgressive(!!data.config.is_progressive);
          if (data.config.is_progressive) {
            setBrackets((data.brackets || []).map(b => ({ min: Number(b.min), max: b.max == null ? null : Number(b.max), rate: Number(b.rate) })));
          } else {
            setBrackets([{ min: 0, max: null, rate: 0 }]);
          }
          if (!data.config.is_progressive && data.config.flat_rate != null) {
            setFlatRate(Number(data.config.flat_rate));
          }
        }
      } catch (e) {}
    };
    load();
  }, [teamId, year, region, municipality, currentScenarioId]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Addizionale Comunale</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configura l'addizionale comunale IRPEF per il comune selezionato.
          </p>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isProgressive}
                onChange={(e) => setIsProgressive(e.target.checked)}
              />
              <span>Addizionale Progressiva</span>
            </label>
          </div>

          {!isProgressive ? (
            <div>
              <label className="block text-sm font-medium mb-1">
                Aliquota Flat (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={flatRate}
                onChange={(e) => setFlatRate(parseFloat(e.target.value) || 0)}
                className="w-full max-w-xs border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">
                  Scaglioni Progressivi
                </label>
                <button
                  onClick={addBracket}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi Scaglione
                </button>
              </div>

              <div className="space-y-2">
                {brackets.map((bracket, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-3 rounded">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Da €</label>
                        <input
                          type="number"
                          value={bracket.min}
                          onChange={(e) => updateBracket(index, 'min', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">A € (vuoto = ∞)</label>
                        <input
                          type="number"
                          value={bracket.max || ''}
                          onChange={(e) => updateBracket(index, 'max', e.target.value)}
                          placeholder="∞"
                          className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Aliquota %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bracket.rate}
                          onChange={(e) => updateBracket(index, 'rate', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    {brackets.length > 1 && (
                      <button
                        onClick={() => removeBracket(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!municipality && (
            <Alert className="border-yellow-500">
              <AlertDescription>
                ⚠️ Specifica un comune nel tab "Configurazione" per abilitare il salvataggio
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !region || !municipality}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva Comunale'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MunicipalStep;

