import React, { useState } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator } from 'lucide-react';
import { useFiscalSetup } from '../FiscalSetupProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const ReviewStep = () => {
  const { teamId, year, contractType, region, municipality } = useFiscalSetup();
  const [testNet, setTestNet] = useState(33500);
  const [testRegion, setTestRegion] = useState(region || '');
  const [testMunicipality, setTestMunicipality] = useState(municipality || '');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);

  const runTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setTestResult(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/taxes/v2/gross-from-net`,
        {
          netSalary: testNet,
          year,
          contractType,
          region: testRegion || null,
          municipality: testMunicipality || null,
          teamId
        },
        { withCredentials: true }
      );

      setTestResult(response.data.data);
    } catch (err) {
      console.error('Test error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Riepilogo & Test</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Configurazione Corrente</h3>
            <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
              <p><strong>Anno:</strong> {year}</p>
              <p><strong>Tipo Contratto:</strong> {contractType}</p>
              <p><strong>Regione:</strong> {region || 'Non specificata'}</p>
              <p><strong>Comune:</strong> {municipality || 'Non specificato'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Test Calcolo (Netto → Lordo)</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Netto di Test (€)
                </label>
                <input
                  type="number"
                  value={testNet}
                  onChange={(e) => setTestNet(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Regione (per Addizionale Regionale)
                </label>
                <input
                  type="text"
                  value={testRegion}
                  onChange={(e) => setTestRegion(e.target.value)}
                  placeholder="Es. Marche"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Comune (per Addizionale Comunale)
                </label>
                <input
                  type="text"
                  value={testMunicipality}
                  onChange={(e) => setTestMunicipality(e.target.value)}
                  placeholder="Es. Pesaro"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button
                onClick={runTest}
                disabled={testing}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {testing ? 'Calcolo...' : 'Calcola'}
              </button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-semibold mb-3 text-green-800">Risultato Test</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Lordo</p>
                  <p className="text-lg font-bold">€ {testResult.grossSalary?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Netto</p>
                  <p className="text-lg font-bold">€ {testResult.netSalary?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Costo Azienda</p>
                  <p className="text-lg font-bold">€ {testResult.companyCost?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contrib. Worker</p>
                  <p className="font-medium">€ {testResult.totaleContributiWorker?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contrib. Employer</p>
                  <p className="font-medium">€ {testResult.totaleContributiEmployer?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">IRPEF dopo L.207</p>
                  <p className="font-medium">€ {testResult.irpefAfterL207?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              <strong>Nota:</strong> Verifica che i calcoli siano corretti prima di utilizzare la configurazione nei contratti.
              Se i valori non corrispondono, controlla le aliquote e i parametri inseriti negli step precedenti.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewStep;

