import { useState } from 'react'
import MainLayout from './app/layout/MainLayout'
import PageHeader from './design-system/ds/PageHeader'
import Button from './design-system/ds/Button'
import Card, { CardHeader, CardContent, CardFooter } from './design-system/ds/Card'
import KPICard from './design-system/ds/KPICard'
import EmptyState from './design-system/ds/EmptyState'
import ConfirmDialog from './design-system/ds/ConfirmDialog'
import { Users, BarChart3, FileText, Plus, Trash2 } from 'lucide-react'

function App() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <MainLayout>
      <PageHeader 
        title="Design System Showcase" 
        subtitle="Fase C - Componenti UI pronti per il WOW effect!"
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Test Dialog
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard 
          icon={Users} 
          value="24" 
          label="Giocatori Attivi" 
        />
        <KPICard 
          icon={BarChart3} 
          value="87%" 
          label="Performance Media" 
        />
        <KPICard 
          icon={FileText} 
          value="12" 
          label="Contratti Attivi" 
        />
      </div>

      {/* Button Variants */}
      <Card className="mb-8">
        <CardHeader>
          <h3 className="text-lg font-semibold">Button Variants</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Card Standard</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Questo è un esempio di card con header, content e footer.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">Azione</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Card con Azioni</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Card con pulsanti di azione nel footer.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="primary" size="sm">Modifica</Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Empty State */}
      <EmptyState 
        icon={Users}
        title="Nessun giocatore trovato"
        description="Inizia aggiungendo il primo giocatore alla tua rosa"
        action={<Button>Aggiungi Giocatore</Button>}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Conferma Azione"
        message="Sei sicuro di voler procedere con questa operazione?"
        onConfirm={() => {
          alert('Azione confermata!')
          setShowDialog(false)
        }}
      />
    </MainLayout>
  )
}

export default App
