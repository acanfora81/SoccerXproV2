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
  const [showFormula, setShowFormula] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

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
            <div className="bg-gray-50 p-4 rounded space-y-1 text-sm dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-700">
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
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
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
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
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
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
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
            <div className="bg-green-50 border border-green-200 rounded p-4 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100">
              <h4 className="font-semibold mb-3 text-green-800">Risultato Test</h4>
              {/* Fonte dati */}
              <div className="text-xs text-green-900 mb-3">
                Fonte dati: profilo fiscale salvato nel DB (team/anno/contratto, con regione/comune se indicati). In assenza di profilo, l'endpoint restituisce errore.
              </div>
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

              {/* Passaggi logici di calcolo */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-semibold mb-2 text-green-800">Passaggi logici</h5>
                {(() => {
                  const G = Number(testResult.grossSalary || 0);
                  const R = Number(testResult.imponibileFiscale || 0);
                  const contribWorkerTot = Number(testResult.totaleContributiWorker || 0);
                  const irpefLorda = Number(testResult.irpef || 0);
                  const detraz = Number(testResult.detrazione || 0);
                  const l207Perc = Number(testResult.l207Discount || 0);
                  const l207Extra = Number(testResult.l207ExtraDeduction || 0);
                  const irpefPostL207 = Number(testResult.irpefAfterL207 || 0);
                  const addReg = Number(testResult.addRegionale || 0);
                  const addCom = Number(testResult.addComunale || 0);
                  const tasseTot = Number(testResult.totalTax || 0);
                  const netto = Number(testResult.netSalary || 0);
                  const rr = testResult._rawRates || {};
                  const inpsEmp = G * ((rr.inpsEmployer || 0) / 100);
                  const inailEmp = G * ((rr.inailEmployer || 0) / 100);
                  const ffcEmp = G * ((rr.ffcEmployer || 0) / 100);
                  const solidEmp = G * ((rr.solidarityEmployer || 0) / 100);
                  const contribEmployerTot = inpsEmp + inailEmp + ffcEmp + solidEmp;
                  const fondoRate = (rr.fondoRate || 0) / 100;
                  const costoAzienda = Number(testResult.companyCost || (G + contribEmployerTot + (G * fondoRate)));
                  
                  return (
                    <div>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        <li>
                          Netto di input → calcolo Lordo risultante: <span className="font-medium">€ {G.toFixed(2)}</span>
                        </li>
                        <li>
                          Contributi lavoratore (totale) su lordo: <span className="font-medium">€ {contribWorkerTot.toFixed(2)}</span>
                        </li>
                        <li>
                          Imponibile fiscale R = Lordo − Contributi lavoratore: <span className="font-medium">€ {R.toFixed(2)}</span>
                        </li>
                        <li>
                          IRPEF lorda su R: <span className="font-medium">€ {irpefLorda.toFixed(2)}</span>
                        </li>
                        <li>
                          Detrazione art. 13: <span className="font-medium">€ {detraz.toFixed(2)}</span>
                        </li>
                        <li>
                          L.207: sconto { (l207Perc * 100).toFixed(2) }% e ulteriore detrazione di <span className="font-medium">€ {l207Extra.toFixed(2)}</span>
                        </li>
                        <li>
                          IRPEF dopo L.207: <span className="font-medium">€ {irpefPostL207.toFixed(2)}</span>
                        </li>
                        <li>
                          Addizionale regionale: <span className="font-medium">€ {addReg.toFixed(2)}</span> — Addizionale comunale: <span className="font-medium">€ {addCom.toFixed(2)}</span>
                        </li>
                        <li>
                          Tasse totali (IRPEF dopo L.207 + addizionali): <span className="font-medium">€ {tasseTot.toFixed(2)}</span>
                        </li>
                        <li>
                          Netto = R − Tasse totali: <span className="font-medium">€ {netto.toFixed(2)}</span>
                        </li>
                        <li>
                          Contributi datore su lordo: inps € {inpsEmp.toFixed(2)}, inail € {inailEmp.toFixed(2)}, ffc € {ffcEmp.toFixed(2)}, solidarietà € {solidEmp.toFixed(2)} — Totale: <span className="font-medium">€ {contribEmployerTot.toFixed(2)}</span>
                        </li>
                        <li>
                          Costo azienda = Lordo + contributi datore (+ eventuale fondo): <span className="font-medium">€ {costoAzienda.toFixed(2)}</span>
                        </li>
                      </ol>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setShowFormula(v => !v)}
                          className="text-xs underline text-green-800"
                        >
                          {showFormula ? 'Nascondi dettagli formula' : 'Mostra dettagli formula'}
                        </button>
                      </div>

                      {showFormula && (
                        <div className="mt-3 text-xs text-green-900 bg-white/50 rounded p-3 border border-green-200">
                          <div className="space-y-1">
                            <div>
                              G (Lordo trovato)
                            </div>
                            <div>
                              − Contributi Lavoratore (totale) = € {contribWorkerTot.toFixed(2)}
                            </div>
                            <div>
                              = R (Imponibile) = € {R.toFixed(2)}
                            </div>
                            <div className="mt-2">
                              IRPEF lorda(R) = € {irpefLorda.toFixed(2)}
                            </div>
                            <div>
                              − Detrazione art.13 = € {detraz.toFixed(2)}
                            </div>
                            <div>
                              = IRPEF dopo detrazione = € {(Math.max(irpefLorda - detraz, 0)).toFixed(2)}
                            </div>
                            <div className="mt-2">
                              Sconto L.207% = IRPEF lorda × (1 − {(l207Perc * 100).toFixed(2)}%) = € {(irpefLorda * (1 - l207Perc)).toFixed(2)}
                            </div>
                            <div>
                              − Ulteriore detrazione L.207 = € {l207Extra.toFixed(2)}
                            </div>
                            <div>
                              = IRPEF dopo L.207 = € {irpefPostL207.toFixed(2)}
                            </div>
                            <div className="mt-2">
                              Addizionale Regionale(R) = € {addReg.toFixed(2)}
                            </div>
                            <div>
                              Addizionale Comunale(R) = € {addCom.toFixed(2)}
                            </div>
                            <div>
                              Tasse totali = max(0, IRPEF dopo L.207) + Add.Reg + Add.Com = € {tasseTot.toFixed(2)}
                            </div>
                            <div className="mt-2">
                              Netto = R − Tasse totali = € {netto.toFixed(2)}
                            </div>
                            <div className="mt-2">
                              Contrib. Datore = G × INPS% + G × INAIL% + G × FFC% + G × Solid.
                            </div>
                            <div>
                              = € {inpsEmp.toFixed(2)} + € {inailEmp.toFixed(2)} + € {ffcEmp.toFixed(2)} + € {solidEmp.toFixed(2)} = € {contribEmployerTot.toFixed(2)}
                            </div>
                            <div className="mt-2">
                              Fondo (se previsto) = G × {(rr.fondoRate || 0).toFixed(2)}%
                            </div>
                            <div>
                              Costo Azienda = G + Contrib. Datore + Fondo = € {costoAzienda.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Narrativa: come troviamo il Lordo dal Netto */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setShowNarrative(v => !v)}
                          className="text-xs underline text-green-800"
                        >
                          {showNarrative ? 'Nascondi spiegazione net→lordo' : 'Mostra spiegazione net→lordo'}
                        </button>
                      </div>

                      {showNarrative && (
                        <div className="mt-3 text-xs text-green-900 bg-white/50 rounded p-3 border border-green-200 space-y-2">
                          <p>
                            Per ricavare il <strong>Lordo</strong> che produce il <strong>Netto</strong> inserito, usiamo una <strong>ricerca binaria</strong>.
                          </p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>
                              Partiamo da un intervallo di possibili lordi: <em>low = Netto</em> e <em>high ≈ 3 × Netto</em>.
                            </li>
                            <li>
                              Prendiamo il <em>Lordo medio</em> (<em>mid</em>) e calcoliamo il Netto che ne risulta usando le regole reali (contributi, IRPEF, detrazioni, L.207, addizionali).
                            </li>
                            <li>
                              Se il netto calcolato è <strong>più basso</strong> del netto desiderato, significa che il lordo è <strong>troppo basso</strong> → spostiamo <em>low</em> verso l’alto.
                            </li>
                            <li>
                              Se il netto calcolato è <strong>più alto</strong> del netto desiderato, il lordo è <strong>troppo alto</strong> → spostiamo <em>high</em> verso il basso.
                            </li>
                            <li>
                              Ripetiamo finché la differenza tra netto calcolato e netto target è piccola (tolleranza ~ €0.50) o finché raggiungiamo un numero di tentativi massimo.
                            </li>
                          </ol>
                          <p>
                            In questo modo troviamo un <strong>Lordo coerente</strong> con le aliquote e le regole impostate a sistema. Se una regola è sbagliata o mancante, il lordo risultante apparirà anomalo: la narrativa e le formule sopra aiutano a capire <em>dove</em> si genera la differenza (contributi, IRPEF, addizionali, ecc.).
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
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

