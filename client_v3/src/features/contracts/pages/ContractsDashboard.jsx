// client_v3/src/features/contracts/pages/ContractsDashboard.jsx
// Dashboard principale per la gestione contratti - SoccerXpro V2

import React, { useState, useEffect } from 'react';
import { Plus, FileText, TrendingUp, Users, Euro, Calendar, AlertTriangle, BarChart3, PieChart, LineChart } from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import useAuthStore from '@/store/authStore';
import PageHeader from '@/design-system/ds/PageHeader';
import PageLoading from '@/design-system/ds/PageLoading';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import KPICard from '@/design-system/ds/KPICard';

// Import dei componenti dashboard
import ContractKPICards from '../components/dashboard/ContractKPICards';
import ContractCharts from '../components/dashboard/ContractCharts';
import ContractTables from '../components/dashboard/ContractTables';
import ContractTimeline from '../components/dashboard/ContractTimeline';

// Import dei modali
import NewContractModal from '../components/NewContractModal';
import ContractDetailsModal from '../components/ContractDetailsModal';
import ContractHistoryModal from '../components/ContractHistoryModal';

const ContractsDashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  // Stati principali
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Stati per i modali
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');

  // Carica dati dashboard
  const loadDashboardData = async () => {
    if (!isAuthenticated) {
      setError('Devi essere autenticato per visualizzare i contratti');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Caricamento dati dashboard contratti...');
      
      // Carica dati dashboard contratti
      const data = await apiFetch('/api/contracts/dashboard/all');
      console.log('🟢 Dati dashboard caricati:', data);
      console.log('🟢 data.data:', data.data);
      console.log('🟢 data.data.kpis:', data.data?.kpis);
      
      setDashboardData(data.data);
    } catch (err) {
      console.error('❌ Errore caricamento dashboard contratti:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
      
      // Fallback a dati mock per sviluppo
      setDashboardData({
        summary: {
          totalContracts: 15,
          activeContracts: 12,
          expiringContracts: 3,
          totalValue: 2500000,
          averageSalary: 166667,
          monthlyExpenses: 208333
        },
        trends: [
          { month: 'Gen', value: 2000000, count: 10 },
          { month: 'Feb', value: 2100000, count: 11 },
          { month: 'Mar', value: 2200000, count: 12 },
          { month: 'Apr', value: 2300000, count: 13 },
          { month: 'Mag', value: 2400000, count: 14 },
          { month: 'Giu', value: 2500000, count: 15 }
        ],
        distributions: {
          byType: [
            { name: 'Professionale', value: 8, percentage: 53.3 },
            { name: 'Giovanile', value: 4, percentage: 26.7 },
            { name: 'Prestito', value: 2, percentage: 13.3 },
            { name: 'Dilettante', value: 1, percentage: 6.7 }
          ],
          byRole: [
            { name: 'Portieri', value: 2, percentage: 13.3 },
            { name: 'Difensori', value: 4, percentage: 26.7 },
            { name: 'Centrocampisti', value: 6, percentage: 40.0 },
            { name: 'Attaccanti', value: 3, percentage: 20.0 }
          ]
        },
        topPlayers: [
          { id: 1, playerName: 'Mario Rossi', role: 'FORWARD', salary: 500000, currency: 'EUR', endDate: '2025-06-30' },
          { id: 2, playerName: 'Giuseppe Verdi', role: 'MIDFIELDER', salary: 450000, currency: 'EUR', endDate: '2025-06-30' },
          { id: 3, playerName: 'Antonio Bianchi', role: 'DEFENDER', salary: 400000, currency: 'EUR', endDate: '2025-06-30' }
        ],
        expiring: [
          { id: 1, playerName: 'Mario Rossi', role: 'FORWARD', salary: 500000, currency: 'EUR', endDate: '2024-12-31', status: 'ACTIVE' },
          { id: 2, playerName: 'Giuseppe Verdi', role: 'MIDFIELDER', salary: 450000, currency: 'EUR', endDate: '2025-01-15', status: 'ACTIVE' },
          { id: 3, playerName: 'Antonio Bianchi', role: 'DEFENDER', salary: 400000, currency: 'EUR', endDate: '2025-02-28', status: 'ACTIVE' }
        ],
        monthlyExpenses: [
          { month: 'Gen', expenses: 200000 },
          { month: 'Feb', expenses: 210000 },
          { month: 'Mar', expenses: 220000 },
          { month: 'Apr', expenses: 230000 },
          { month: 'Mag', expenses: 240000 },
          { month: 'Giu', expenses: 250000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Carica dati al mount
  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  // Gestione modali
  const handleNewContract = () => {
    setIsNewContractModalOpen(true);
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setIsDetailsModalOpen(true);
  };

  const handleViewHistory = (playerId, playerName) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerName(playerName);
    setIsHistoryModalOpen(true);
  };

  const handleModalClose = () => {
    setIsNewContractModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsHistoryModalOpen(false);
    setSelectedContract(null);
    setSelectedPlayerId(null);
    setSelectedPlayerName('');
  };

  const handleContractSuccess = () => {
    // Ricarica i dati dopo creazione/modifica
    loadDashboardData();
  };

  // Loading state
  if (loading) {
    return (
      <PageLoading
        title="Dashboard Contratti"
        description="Panoramica completa della gestione contratti"
        showText={true}
        text="Recupero dei dati della dashboard contratti..."
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Contratti"
          description="Panoramica completa della gestione contratti"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Errore di caricamento"
          description={error}
        >
          <Button onClick={loadDashboardData} variant="primary">
            Riprova
          </Button>
        </EmptyState>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Contratti"
          description="Panoramica completa della gestione contratti"
        />
        <EmptyState
          icon={FileText}
          title="Nessun dato disponibile"
          description="Non ci sono contratti da visualizzare"
        >
          <Button onClick={handleNewContract} variant="primary">
            <Plus size={16} />
            Crea Primo Contratto
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Contratti"
        description="Panoramica completa della gestione contratti"
        actions={
          <Button onClick={handleNewContract} variant="primary">
            <Plus size={16} />
            Nuovo Contratto
          </Button>
        }
      />

      {/* KPI Cards */}
      {console.log('🔵 dashboardData:', dashboardData)}
      {console.log('🔵 dashboardData.kpis:', dashboardData?.kpis)}
      <ContractKPICards data={dashboardData?.kpis} />

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Analisi e Grafici
          </h3>
        </CardHeader>
        <CardContent>
          <ContractCharts 
            trends={dashboardData.trends}
            distributions={dashboardData.distributions}
            topPlayers={dashboardData.topPlayers}
            monthlyExpenses={dashboardData.monthlyExpenses}
          />
        </CardContent>
      </Card>

      {/* Contratti in Scadenza - Tabella Estesa */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            Contratti in Scadenza
          </h3>
        </CardHeader>
        <CardContent>
          <ContractTables 
            expiring={dashboardData.expiring}
            topPlayers={dashboardData.topPlayers}
            onViewContract={handleViewContract}
            onViewHistory={handleViewHistory}
          />
        </CardContent>
      </Card>

      {/* Timeline Scadenze - Sezione Estesa */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Timeline Scadenze
          </h3>
        </CardHeader>
        <CardContent>
          <ContractTimeline 
            data={dashboardData.expiring}
            onEditContract={handleViewContract}
          />
        </CardContent>
      </Card>

      {/* Modali */}
      <NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={handleModalClose}
        onSuccess={handleContractSuccess}
      />

      <ContractDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleModalClose}
        contract={selectedContract}
      />

      <ContractHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleModalClose}
        playerId={selectedPlayerId}
        playerName={selectedPlayerName}
      />
    </div>
  );
};

export default ContractsDashboard;
