import React, { useMemo, useState } from 'react';
import ConfirmDialog, { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/design-system/ds/ConfirmDialog';
import Button from '@/design-system/ds/Button';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { FiscalSetupProvider, useFiscalSetup } from './FiscalSetupProvider';

// Import step components
import RatesStep from './steps/RatesStep';
import IrpefStep from './steps/IrpefStep';
import DetractionsStep from './steps/DetractionsStep';
import RegionalStep from './steps/RegionalStep';
import MunicipalStep from './steps/MunicipalStep';
import ReviewStep from './steps/ReviewStep';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const FiscalSetupPageContent = () => {
  const { 
    teamId, year, contractType, region, municipality, status, activeTab, setActiveTab, 
    setYear, setContractType, setRegion, setMunicipality, availableScenarios, currentScenarioId, isNewScenario,
    loadScenario, createNewScenario, fetchAvailableScenarios, persistNewScenario
  } = useFiscalSetup();

  const [scenarioMessage, setScenarioMessage] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showDeleteYear, setShowDeleteYear] = useState(false);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [pendingContractType, setPendingContractType] = useState(contractType || 'PROFESSIONAL');
  const [pendingRegion, setPendingRegion] = useState(region || '');
  const [pendingMunicipality, setPendingMunicipality] = useState(municipality || '');
  const contractTypeLabel = (t) => {
    switch ((t || '').toUpperCase()) {
      case 'PROFESSIONAL':
        return 'Professionista';
      case 'APPRENTICE':
        return 'Apprendista';
      case 'EMPLOYEE':
        return 'Dipendente';
      case 'INTERN':
        return 'Stagista';
      default:
        return t || '—';
    }
  };
  const pendingScenarioName = useMemo(() => {
    const typeLabel = contractTypeLabel(pendingContractType || '');
    return `${typeLabel} • ${pendingRegion || '—'}${pendingMunicipality ? ' / ' + pendingMunicipality : ''} • ${year ?? ''}`;
  }, [pendingContractType, pendingRegion, pendingMunicipality, year]);

  // Opzioni scenari da mostrare (esclude i placeholder "anno vuoto")
  const scenarioOptions = useMemo(() => {
    return (availableScenarios || []).filter(s => (s.contractType || s.region || s.municipality));
  }, [availableScenarios]);

  const formatScenarioLabel = (s) => {
    const type = contractTypeLabel(s.contractType || '');
    const location = s.region ? (s.municipality ? `${s.region} / ${s.municipality}` : s.region) : '';
    return [type, location, s.year || ''].filter(Boolean).join(' • ');
  };
  const pendingValid = useMemo(() => !!(pendingContractType && pendingRegion && pendingMunicipality), [pendingContractType, pendingRegion, pendingMunicipality]);

  // Se non c'è teamId, mostra loading
  if (!teamId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <p>Caricamento configurazione fiscale...</p>
        </div>
      </div>
    );
  }

  const calculateProgress = () => {
    const hasActiveScenario = Boolean(currentScenarioId) || Boolean(isNewScenario);
    if (!hasActiveScenario) return 0;
    // Core steps must be explicitly true
    const coreSteps = [
      status.rates === true,
      status.contributions === true,
      status.irpef === true,
      status.detractions === true
    ];

    // Territorial steps count only if the related dimension is selected
    const regionalStep = (region ? status.regional === true : true);
    const municipalStep = (municipality ? status.municipal === true : true);

    const steps = [...coreSteps, regionalStep, municipalStep];
    const completed = steps.filter(Boolean).length;
    return (completed / steps.length) * 100;
  };

  const StepIndicator = ({ stepKey, label }) => {
    const isCompleted = status[stepKey];
    const Icon = isCompleted ? CheckCircle2 : Circle;
    const color = isCompleted ? 'text-green-600' : 'text-gray-400';

    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className={color}>{label}</span>
      </div>
    );
  };


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configurazione Fiscale</h1>
        <p className="text-gray-600">
          Sistema guidato per configurare aliquote, contributi e parametri fiscali
        </p>
      </div>

      {/* Gestione Scenari */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Gestione Scenari</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Scenario Attuale:</label>
              <div className="flex gap-2 items-center flex-wrap">
                <select
                  value={currentScenarioId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const scenario = scenarioOptions.find(s => s.id === e.target.value);
                      if (scenario) loadScenario(scenario);
                    }
                  }}
                  className="flex-1 border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                  disabled={isNewScenario}
                >
                  <option value="">Seleziona scenario esistente...</option>
                  {scenarioOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatScenarioLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setNewYear(year ?? new Date().getFullYear());
                    setShowAddYear(true);
                  }}
                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm whitespace-nowrap"
                >
                  + Aggiungi Anno
                </button>
                <button
                  onClick={() => setShowDeleteYear(true)}
                  className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  🗑 Elimina Anno
                </button>
                <button
                  onClick={() => {
                    setScenarioMessage(null);
                    // apre sempre il modal guidato; l'utente può completare i campi mancanti lì
                    setPendingContractType(contractType || 'PROFESSIONAL');
                    setPendingRegion(region || '');
                    setPendingMunicipality(municipality || '');
                    setShowScenarioModal(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm whitespace-nowrap"
                >
                  + Nuovo Scenario
                </button>
              </div>
              {scenarioMessage && (
                <div className="mt-2">
                  <Alert className="border-yellow-500">
                    <AlertDescription>{scenarioMessage}</AlertDescription>
                  </Alert>
                </div>
              )}
              {isNewScenario && (
                <p className="text-sm text-blue-600 mt-2">
                  ✓ Creando nuovo scenario - compila i campi sotto
                </p>
              )}
              {/* Modal di conferma creazione scenario */}
              <Dialog open={showScenarioModal} onOpenChange={setShowScenarioModal}>
                <DialogContent className="max-w-2xl md:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">Crea nuovo scenario</DialogTitle>
                    <DialogDescription>
                      Compila i campi richiesti; il nome viene generato automaticamente in base ai valori inseriti.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2 px-3 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo Contratto</label>
                        <select
                          value={pendingContractType}
                          onChange={(e) => setPendingContractType(e.target.value)}
                          className="w-full max-w-md border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                        >
                          <option value="PROFESSIONAL">Professionista</option>
                          <option value="APPRENTICE">Apprendista</option>
                          <option value="EMPLOYEE">Dipendente</option>
                          <option value="INTERN">Stagista</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Anno</label>
                        <input value={year ?? ''} readOnly className="w-full max-w-md border rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Regione</label>
                        <input
                          type="text"
                          value={pendingRegion}
                          onChange={(e) => setPendingRegion(e.target.value)}
                          placeholder="Es. Marche"
                          className="w-full max-w-md border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Comune</label>
                        <input
                          type="text"
                          value={pendingMunicipality}
                          onChange={(e) => setPendingMunicipality(e.target.value)}
                          placeholder="Es. Pesaro"
                          className="w-full max-w-md border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    <div className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded max-w-xl">
                      <div className="font-medium mb-1">Anteprima Nome Scenario</div>
                      <div className="text-gray-700 dark:text-gray-200">{pendingScenarioName}</div>
                    </div>
                    {!pendingValid && (
                      <Alert className="border-yellow-500">
                        <AlertDescription>
                          Compila Tipo Contratto, Regione e Comune per abilitare la creazione.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setShowScenarioModal(false)}>Annulla</Button>
                    <Button
                      disabled={!pendingValid}
                      onClick={async () => {
                        // Aggiorna il contesto con i valori scelti nel modal
                        setContractType(pendingContractType);
                        setRegion(pendingRegion);
                        setMunicipality(pendingMunicipality);
                        createNewScenario();
                        await persistNewScenario(pendingScenarioName, {
                          contractType: pendingContractType,
                          region: pendingRegion,
                          municipality: pendingMunicipality,
                          year
                        });
                        setShowScenarioModal(false);
                      }}
                    >Crea</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profilo corrente */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Profilo Corrente</h3>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium mr-2">Anno:</span>
              {Array.from(new Set(availableScenarios.map(s => s.year))).length > 0 ? (
                <select
                  value={year ?? ''}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  disabled={!!currentScenarioId}
                >
                  <option value="" disabled>Seleziona anno</option>
                  {Array.from(new Set(availableScenarios.map(s => s.year))).sort().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              ) : (
                <>
                  <span>—</span>
                  <div className="text-xs text-gray-500">Crea un anno con “+ Aggiungi Anno”.</div>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo Contratto:</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                disabled={!!currentScenarioId}
              >
                <option value="PROFESSIONAL">Professionista</option>
                <option value="APPRENTICE">Apprendista</option>
                <option value="EMPLOYEE">Dipendente</option>
                <option value="INTERN">Stagista</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Regione:</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="es. Lombardia"
                className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                disabled={!!currentScenarioId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comune:</label>
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="es. Milano"
                className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
                disabled={!!currentScenarioId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal elimina anno */}
      <Dialog open={showDeleteYear} onOpenChange={setShowDeleteYear}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminare tutte le configurazioni dell'anno {year}?</DialogTitle>
            <DialogDescription>
              L'operazione rimuove scenari e dati fiscali per questo anno. Questa azione è irreversibile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteYear(false)}>Annulla</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  const params = new URLSearchParams({ teamId: teamId || '', year: String(year) });
                  await fetch(`${API_BASE_URL}/api/fiscal-setup/year?${params}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  setShowDeleteYear(false);
                  await fetchAvailableScenarios();
                } catch (e) { console.error('Delete year error', e); }
              }}
            >
              Elimina Anno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal aggiungi anno */}
      <Dialog open={showAddYear} onOpenChange={setShowAddYear}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Crea nuovo anno</DialogTitle>
            <DialogDescription>Inserisci l'anno fiscale da creare.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Anno</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddYear(false)}>Annulla</Button>
            <Button
              onClick={async () => {
                try {
                  await fetch(`${API_BASE_URL}/api/fiscal-setup/year`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ teamId, year: newYear })
                  });
                  setShowAddYear(false);
                  // seleziona l'anno appena creato
                  await fetchAvailableScenarios();
                } catch (e) { console.error('Add year error', e); }
              }}
            >Crea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Stato Configurazione</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Completamento Configurazione</span>
              <span className="font-medium">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mt-4">
            <StepIndicator stepKey="rates" label="Aliquote" />
            <StepIndicator stepKey="contributions" label="Contributi" />
            <StepIndicator stepKey="irpef" label="IRPEF" />
            <StepIndicator stepKey="detractions" label="Detrazioni" />
            <StepIndicator stepKey="regional" label="Reg." />
            <StepIndicator stepKey="municipal" label="Com." />
          </div>
        </CardContent>
      </Card>

      {/* Tabs o placeholder */}
      {(!currentScenarioId && !isNewScenario) ? (
        <Card className="mt-4">
          <CardContent>
            <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Seleziona uno scenario esistente oppure crea un nuovo scenario per iniziare la configurazione. I campi mostreranno esempi solo come placeholder finché non salvi i dati.
            </div>
          </CardContent>
        </Card>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rates">Aliquote</TabsTrigger>
          <TabsTrigger value="irpef">IRPEF</TabsTrigger>
          <TabsTrigger value="detractions">Detrazioni</TabsTrigger>
          <TabsTrigger value="regional">Regionale</TabsTrigger>
          <TabsTrigger value="municipal">Comunale</TabsTrigger>
          <TabsTrigger value="review">Riepilogo</TabsTrigger>
        </TabsList>

        {/* Render solo il contenuto della tab selezionata */}
        {activeTab === 'rates' && <RatesStep />}
        {activeTab === 'irpef' && <IrpefStep />}
        {activeTab === 'detractions' && <DetractionsStep />}
        {activeTab === 'regional' && <RegionalStep />}
        {activeTab === 'municipal' && <MunicipalStep />}
        {activeTab === 'review' && <ReviewStep />}
      </Tabs>
      )}
    </div>
  );
};

const FiscalSetupPage = () => {
  return (
    <FiscalSetupProvider>
      <FiscalSetupPageContent />
    </FiscalSetupProvider>
  );
};

export default FiscalSetupPage;