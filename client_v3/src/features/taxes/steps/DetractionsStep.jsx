import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Info } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const DetractionsStep = () => {
  const { teamId, year, fetchStatus, setActiveTab, currentScenarioId } = useFiscalSetup();
  const [detractions, setDetractions] = useState({
    contributionrate: 0,
    solidarityrate: 0,
    detrazioneFascia1: 1955,
    detrazioneMinimo: 690,
    detrazioneFascia2: 1910,
    detrazioneFascia2Max: 1190,
    detrazioneFascia3: 1910
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (field, value) => {
    setDetractions(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/detractions`,
        {
          teamId,
          year,
          ...detractions
        },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: 'Detrazioni salvate con successo!' });
      setActiveTab('regional');
      fetchStatus();
    } catch (error) {
      console.error('Error saving detractions:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!teamId || !year) return;
      try {
        const res = await axios.get('/api/fiscal-setup/step/detractions', { params: { teamId, year }, withCredentials: true });
        if (res.data?.data) {
          const d = res.data.data;
          setDetractions(prev => ({
            ...prev,
            contributionrate: d.contributionrate ?? prev.contributionrate,
            solidarityrate: d.solidarityrate ?? prev.solidarityrate,
            detrazioneFascia1: d.detrazioneFascia1 ?? prev.detrazioneFascia1,
            detrazioneMinimo: d.detrazioneMinimo ?? prev.detrazioneMinimo,
            detrazioneFascia2: d.detrazioneFascia2 ?? prev.detrazioneFascia2,
            detrazioneFascia2Max: d.detrazioneFascia2Max ?? prev.detrazioneFascia2Max,
            detrazioneFascia3: d.detrazioneFascia3 ?? prev.detrazioneFascia3
          }));
        }
      } catch (e) {}
    };
    load();
  }, [teamId, year, currentScenarioId]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Detrazioni Art. 13 (Lavoro Dipendente)</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Parametri base obbligatori per salvataggio (schema tax_config) */}
          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Parametri base</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Aliquota Contributiva (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.contributionrate}
                  onChange={(e) => handleChange('contributionrate', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Aliquota Solidarity (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.solidarityrate}
                  onChange={(e) => handleChange('solidarityrate', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <Alert variant="default" className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
            <AlertDescription>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Detrazioni per redditi da lavoro dipendente (Art. 13 TUIR)</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Fascia 1 (fino a €15.000):</strong> detrazione massima che decresce linearmente</li>
                    <li><strong>Fascia 2 (€15.001 - €28.000):</strong> detrazione base + importo variabile</li>
                    <li><strong>Fascia 3 (€28.001 - €50.000):</strong> detrazione che decresce fino a zero</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Fascia 1: fino a 15.000 € */}
          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-100">Fascia 1: Reddito fino a €15.000</h4>
            <p className="text-sm text-blue-700">
              Formula: max(detrazioneFascia1 × (15.000 - R) / 15.000, detrazioneMinimo)
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Detrazione Massima (€)
                  <span className="text-xs text-gray-500 ml-1">(a reddito zero)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.detrazioneFascia1}
                  onChange={(e) => handleChange('detrazioneFascia1', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="1955"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Detrazione Minima (€)
                  <span className="text-xs text-gray-500 ml-1">(a €15.000)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.detrazioneMinimo}
                  onChange={(e) => handleChange('detrazioneMinimo', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="690"
                />
              </div>
            </div>
          </div>

          {/* Fascia 2: 15.001 - 28.000 € */}
          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-100">Fascia 2: Reddito da €15.001 a €28.000</h4>
            <p className="text-sm text-green-700">
              Formula: detrazioneFascia2 + (detrazioneFascia2Max × (28.000 - R) / 13.000)
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Detrazione Base (€)
                  <span className="text-xs text-gray-500 ml-1">(parte fissa)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.detrazioneFascia2}
                  onChange={(e) => handleChange('detrazioneFascia2', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="1910"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Detrazione Max Variabile (€)
                  <span className="text-xs text-gray-500 ml-1">(a €15.001)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detractions.detrazioneFascia2Max}
                  onChange={(e) => handleChange('detrazioneFascia2Max', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  placeholder="1190"
                />
              </div>
            </div>
          </div>

          {/* Fascia 3: 28.001 - 50.000 € */}
          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-100">Fascia 3: Reddito da €28.001 a €50.000</h4>
            <p className="text-sm text-yellow-700">
              Formula: detrazioneFascia3 × (50.000 - R) / 22.000
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Detrazione a €28.001 (€)
                <span className="text-xs text-gray-500 ml-1">(decresce fino a 0 a €50.000)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={detractions.detrazioneFascia3}
                onChange={(e) => handleChange('detrazioneFascia3', e.target.value)}
                className="w-full max-w-xs border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                placeholder="1910"
              />
            </div>
          </div>

          {/* Valori di default suggeriti */}
          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-3 rounded text-sm">
            <p className="font-medium mb-1">💡 Valori standard 2025:</p>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• Detrazione Massima Fascia 1: €1.955</li>
              <li>• Detrazione Minima Fascia 1: €690</li>
              <li>• Detrazione Base Fascia 2: €1.910</li>
              <li>• Detrazione Max Variabile Fascia 2: €1.190</li>
              <li>• Detrazione Fascia 3: €1.910</li>
            </ul>
          </div>

          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
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
              {saving ? 'Salvataggio...' : 'Salva Detrazioni'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetractionsStep;

