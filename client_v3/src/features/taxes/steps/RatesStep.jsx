import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Save } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const RatesStep = () => {
  const { teamId, year, contractType, fetchStatus, setActiveTab, currentScenarioId } = useFiscalSetup();
  const [rates, setRates] = useState({
    inpsWorkerPct: 9.19,
    ffcWorkerPct: 0.5,
    solidarityWorkerPct: 0,
    inpsEmployerPct: 30,
    ffcEmployerPct: 6.25,
    inailEmployerPct: 1.5,
    solidarityEmployerPct: 0,
    fondoRatePct: 0.5
  });
  const [mode, setMode] = useState('PIECEWISE'); // LOOKUP | PIECEWISE
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (field, value) => {
    setRates(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save rates
      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/rates`,
        { teamId, year, contractType, rates },
        { withCredentials: true }
      );

      // Save contribution profile (mode only for now)
      await axios.post(
        `${API_BASE_URL}/api/fiscal-setup/step/contributions`,
        {
          teamId,
          year,
          contractType,
          mode,
          points: mode === 'LOOKUP' ? [] : undefined,
          brackets: mode === 'PIECEWISE' ? [
            { from_amount: 0, to_amount: null, rate: rates.inpsWorkerPct + rates.ffcWorkerPct + rates.solidarityWorkerPct, fixed: 0 }
          ] : undefined
        },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: 'Aliquote salvate con successo!' });
      // Avanza alla tab successiva
      setActiveTab('irpef');
      fetchStatus();
    } catch (error) {
      console.error('Error saving rates:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setSaving(false);
    }
  };

  // Carica dati salvati quando cambia scenario/tab
  useEffect(() => {
    const load = async () => {
      if (!teamId || !year || !contractType) return;
      try {
        const res = await axios.get('/api/fiscal-setup/step/rates', {
          params: { teamId, year, contractType },
          withCredentials: true
        });
        if (res.data?.data) {
          const d = res.data.data;
          setRates(prev => ({
            ...prev,
            inpsWorkerPct: parseFloat(d.inpsWorkerPct ?? prev.inpsWorkerPct),
            ffcWorkerPct: parseFloat(d.ffcWorkerPct ?? prev.ffcWorkerPct),
            solidarityWorkerPct: parseFloat(d.solidarityWorkerPct ?? prev.solidarityWorkerPct),
            inpsEmployerPct: parseFloat(d.inpsEmployerPct ?? prev.inpsEmployerPct),
            ffcEmployerPct: parseFloat(d.ffcEmployerPct ?? prev.ffcEmployerPct),
            inailEmployerPct: parseFloat(d.inailEmployerPct ?? prev.inailEmployerPct),
            solidarityEmployerPct: parseFloat(d.solidarityEmployerPct ?? prev.solidarityEmployerPct),
            fondoRatePct: parseFloat(d.fondoRatePct ?? prev.fondoRatePct)
          }));
        }
      } catch (e) {
        // silenzioso: se non esiste ancora nessun dato, mantieni i placeholder
      }
    };
    load();
  }, [teamId, year, contractType, currentScenarioId]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Aliquote Contributive e Oneri</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Worker Contributions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Contributi a carico del Lavoratore
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  INPS Lavoratore (%)
                  <span className="text-xs text-gray-500 block">Previdenza a carico tesserato</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.inpsWorkerPct}
                  onChange={(e) => handleChange('inpsWorkerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fondo Lavoratore (%)
                  <span className="text-xs text-gray-500 block">Ex FFC a carico tesserato</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.ffcWorkerPct}
                  onChange={(e) => handleChange('ffcWorkerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Solidarietà Lavoratore (%)
                  <span className="text-xs text-gray-500 block">Contributo solidarietà (0.5%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.solidarityWorkerPct}
                  onChange={(e) => handleChange('solidarityWorkerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Employer Contributions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Contributi a carico della Società
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  INPS Società (%)
                  <span className="text-xs text-gray-500 block">Previdenza datore</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.inpsEmployerPct}
                  onChange={(e) => handleChange('inpsEmployerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  INAIL Società (%)
                  <span className="text-xs text-gray-500 block">Assicurazione infortuni</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.inailEmployerPct}
                  onChange={(e) => handleChange('inailEmployerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fondo Società (%)
                  <span className="text-xs text-gray-500 block">Quota fondo datore</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.ffcEmployerPct}
                  onChange={(e) => handleChange('ffcEmployerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Solidarietà Società (%)
                  <span className="text-xs text-gray-500 block">Contributo solidarietà</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.solidarityEmployerPct}
                  onChange={(e) => handleChange('solidarityEmployerPct', e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Fondo Rate */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Quota Fondo sul Lordo (%)
              <span className="text-xs text-gray-500 block">Impatta solo sul costo azienda finale</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={rates.fondoRatePct}
              onChange={(e) => handleChange('fondoRatePct', e.target.value)}
              className="w-full max-w-xs border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
            />
          </div>

          {/* Contribution Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Modalità Calcolo Contributi Lavoratore
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="PIECEWISE"
                  checked={mode === 'PIECEWISE'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>Scaglioni Percentuali (PIECEWISE)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="LOOKUP"
                  checked={mode === 'LOOKUP'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>Tabella Punti (LOOKUP)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'PIECEWISE' 
                ? 'Applica le percentuali sopra come scaglioni sul lordo'
                : 'Richiede una tabella di punti Lordo → Contributi (da configurare separatamente)'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva Aliquote'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RatesStep;

