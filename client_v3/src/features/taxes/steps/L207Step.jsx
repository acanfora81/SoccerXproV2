import React, { useState } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Info } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const L207Step = () => {
  const { teamId, year, fetchStatus } = useFiscalSetup();
  const [bands, setBands] = useState([
    { max_amount: 100000, pct: 50 }
  ]);
  const [extraDeduction, setExtraDeduction] = useState({
    full: 1000,
    full_to: 80000,
    fade_to: 100000
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/l207`,
        { teamId, year, bands, extraDeduction },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: 'L.207/2019 salvata con successo!' });
      fetchStatus();
    } catch (error) {
      console.error('Error saving L207:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Legge 207/2019 - Bonus e Detrazioni</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Bande Sconto IRPEF
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Definisci le bande di reddito e la percentuale di sconto IRPEF applicabile.
            </p>
            {bands.map((band, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reddito Max (€)
                  </label>
                  <input
                    type="number"
                    value={band.max_amount}
                    onChange={(e) => {
                      const updated = [...bands];
                      updated[index].max_amount = parseFloat(e.target.value);
                      setBands(updated);
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sconto IRPEF (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={band.pct}
                    onChange={(e) => {
                      const updated = [...bands];
                      updated[index].pct = parseFloat(e.target.value);
                      setBands(updated);
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Ulteriore Detrazione
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Importo fisso fino a una soglia, che decresce linearmente fino a 0.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Importo Pieno (€)
                </label>
                <input
                  type="number"
                  value={extraDeduction.full}
                  onChange={(e) => setExtraDeduction({
                    ...extraDeduction,
                    full: parseFloat(e.target.value)
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pieno Fino a (€)
                </label>
                <input
                  type="number"
                  value={extraDeduction.full_to}
                  onChange={(e) => setExtraDeduction({
                    ...extraDeduction,
                    full_to: parseFloat(e.target.value)
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Decade a 0 a (€)
                </label>
                <input
                  type="number"
                  value={extraDeduction.fade_to}
                  onChange={(e) => setExtraDeduction({
                    ...extraDeduction,
                    fade_to: parseFloat(e.target.value)
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

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
              {saving ? 'Salvataggio...' : 'Salva L.207'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default L207Step;

