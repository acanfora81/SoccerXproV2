import React from 'react';
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

const FiscalSetupPageContent = () => {
  const { teamId, year, contractType, region, municipality, status, activeTab, setActiveTab } = useFiscalSetup();

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
    const steps = [
      status.rates,
      status.contributions,
      status.irpef,
      status.detractions,
      status.regional !== false,
      status.municipal !== false
    ];
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

      {/* Profilo corrente */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Profilo Corrente</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Anno:</span> {year}
            </div>
            <div>
              <span className="font-medium">Tipo Contratto:</span> {contractType}
            </div>
            <div>
              <span className="font-medium">Regione:</span> {region || 'Non specificata'}
            </div>
            <div>
              <span className="font-medium">Comune:</span> {municipality || 'Non specificato'}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rates">Aliquote</TabsTrigger>
          <TabsTrigger value="irpef">IRPEF</TabsTrigger>
          <TabsTrigger value="detractions">Detrazioni</TabsTrigger>
          <TabsTrigger value="regional">Regionale</TabsTrigger>
          <TabsTrigger value="municipal">Comunale</TabsTrigger>
          <TabsTrigger value="review">Riepilogo</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <RatesStep />
        </TabsContent>

        <TabsContent value="irpef">
          <IrpefStep />
        </TabsContent>

        <TabsContent value="detractions">
          <DetractionsStep />
        </TabsContent>

        <TabsContent value="regional">
          <RegionalStep />
        </TabsContent>

        <TabsContent value="municipal">
          <MunicipalStep />
        </TabsContent>

        <TabsContent value="review">
          <ReviewStep />
        </TabsContent>
      </Tabs>
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