import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Euro,
  FileText,
  Users,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import Button from '@/design-system/ds/Button';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import KPICard from '@/design-system/ds/KPICard';
import PageHeader from '@/design-system/ds/PageHeader';
import GlobalLoader from '@/components/ui/GlobalLoader';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';

const ExpiringContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Carica contratti in scadenza
  const fetchExpiringContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/contracts?expiring=true');
      setContracts(response.data || []);

    } catch (err) {
      console.error('Errore caricamento contratti in scadenza:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica statistiche
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch('/api/contracts/stats');
      setStats(response.data || {});
    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpiringContracts();
    fetchStats();
  }, [fetchExpiringContracts, fetchStats]);

  // Helper per formattazione
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Funzioni di traduzione
  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position || 'Non specificato';
    }
  };

  const getContractTypeLabel = (type) => {
    switch (type) {
      case 'PROFESSIONAL': return 'Professionale';
      case 'SEMI_PROFESSIONAL': return 'Semi-Professionale';
      case 'YOUTH': return 'Giovanile';
      case 'AMATEUR': return 'Dilettante';
      case 'TRAINING': return 'Tirocinio';
      case 'APPRENTICESHIP': return 'Apprendistato';
      case 'TRAINING_AGREEMENT': return 'Accordo formativo';
      default: return type || 'Non specificato';
    }
  };

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (days) => {
    if (days <= 30) return 'critical';
    if (days <= 60) return 'high';
    return 'medium';
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'high': return <Clock size={16} />;
      case 'medium': return <Calendar size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Raggruppa contratti per urgenza
  const contractsByUrgency = contracts.reduce((acc, contract) => {
    const days = getDaysUntilExpiry(contract.endDate);
    const level = getUrgencyLevel(days);
    
    if (!acc[level]) acc[level] = [];
    acc[level].push({ ...contract, daysUntilExpiry: days });
    
    return acc;
  }, {});

  // Ordina per giorni rimanenti
  Object.keys(contractsByUrgency).forEach(level => {
    contractsByUrgency[level].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  });

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setViewModalOpen(true);
  };

  const handleRenewContract = (contract) => {
    // TODO: Implementare logica rinnovo
    console.log('Rinnova contratto:', contract);
  };

  const handleNegotiateContract = (contract) => {
    // TODO: Implementare logica negoziazione
    console.log('Negozia contratto:', contract);
  };

  if (loading) {
    return <GlobalLoader sectionName="Contratti e Finanze" fullscreen />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Contratti in Scadenza"
          subtitle="Gestione contratti in scadenza"
        />
        <Card>
          <CardContent className="text-center py-12">
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Errore di Caricamento</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchExpiringContracts} variant="secondary">
              <RefreshCw size={16} />
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Contratti in Scadenza"
        subtitle={`${contracts.length} contratti in scadenza nei prossimi 90 giorni`}
        actions={
          <Button variant="warning">
            <Bell size={20} />
            Invia Notifiche
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={AlertTriangle}
          value={contracts.length}
          label="In Scadenza"
        />
        <KPICard
          icon={Clock}
          value={contractsByUrgency.critical?.length || 0}
          label="Critici (≤30 giorni)"
        />
        <KPICard
          icon={Calendar}
          value={contractsByUrgency.high?.length || 0}
          label="Alta Priorità (≤60 giorni)"
        />
        <KPICard
          icon={Euro}
          value={formatCurrency(
            contracts.reduce((sum, contract) => sum + parseFloat(contract.salary), 0)
          )}
          label="Valore Totale"
        />
      </div>

      {/* Lista contratti raggruppati per urgenza */}
      {contracts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Nessun contratto in scadenza"
          description="Tutti i contratti sono in regola per i prossimi 90 giorni"
        />
      ) : (
        <div className="space-y-6">
          {/* Contratti critici */}
          {contractsByUrgency.critical && contractsByUrgency.critical.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-500" />
                    <h3 className="text-lg font-semibold">Contratti Critici (≤30 giorni)</h3>
                  </div>
                  <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                    {contractsByUrgency.critical.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractsByUrgency.critical.map(contract => (
                    <ExpiringContractCard 
                      key={contract.id} 
                      contract={contract} 
                      urgencyLevel="critical"
                      onView={handleViewContract}
                      onRenew={handleRenewContract}
                      onNegotiate={handleNegotiateContract}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contratti alta priorità */}
          {contractsByUrgency.high && contractsByUrgency.high.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-orange-500" />
                    <h3 className="text-lg font-semibold">Alta Priorità (≤60 giorni)</h3>
                  </div>
                  <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium">
                    {contractsByUrgency.high.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractsByUrgency.high.map(contract => (
                    <ExpiringContractCard 
                      key={contract.id} 
                      contract={contract} 
                      urgencyLevel="high"
                      onView={handleViewContract}
                      onRenew={handleRenewContract}
                      onNegotiate={handleNegotiateContract}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contratti media priorità */}
          {contractsByUrgency.medium && contractsByUrgency.medium.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-yellow-500" />
                    <h3 className="text-lg font-semibold">Media Priorità (≤90 giorni)</h3>
                  </div>
                  <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                    {contractsByUrgency.medium.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractsByUrgency.medium.map(contract => (
                    <ExpiringContractCard 
                      key={contract.id} 
                      contract={contract} 
                      urgencyLevel="medium"
                      onView={handleViewContract}
                      onRenew={handleRenewContract}
                      onNegotiate={handleNegotiateContract}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal per visualizzare contratto */}
      <ConfirmDialog
        open={viewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setViewModalOpen(false);
            setSelectedContract(null);
          }
        }}
        onConfirm={() => setViewModalOpen(false)}
        title="Dettagli Contratto"
        message={selectedContract ? `Contratto di ${selectedContract.players?.firstName} ${selectedContract.players?.lastName}` : ''}
      />
    </div>
  );
};

// Componente per la card del contratto in scadenza
const ExpiringContractCard = ({ contract, urgencyLevel, onView, onRenew, onNegotiate }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertTriangle size={16} className="text-red-500" />;
      case 'high': return <Clock size={16} className="text-orange-500" />;
      case 'medium': return <Calendar size={16} className="text-yellow-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getUrgencyColor(urgencyLevel)}`}>
      <CardContent className="p-4">
        {/* Header con urgenza */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {contract.players?.firstName?.[0]}{contract.players?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {contract.players?.firstName} {contract.players?.lastName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getPositionLabel(contract.players?.position)} 
                {contract.players?.shirtNumber && ` #${contract.players.shirtNumber}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {getUrgencyIcon(urgencyLevel)}
            <span className={urgencyLevel === 'critical' ? 'text-red-600 dark:text-red-400' : 
                           urgencyLevel === 'high' ? 'text-orange-600 dark:text-orange-400' : 
                           'text-yellow-600 dark:text-yellow-400'}>
              {contract.daysUntilExpiry} giorni
            </span>
          </div>
        </div>

        {/* Informazioni contratto */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Scadenza:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(contract.endDate)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Stipendio:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(contract.salary, contract.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {getContractTypeLabel(contract.contractType)}
            </span>
          </div>
        </div>

        {/* Azioni rapide */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="info" 
            onClick={() => onView(contract)}
            className="flex-1"
          >
            <Eye size={14} />
            Visualizza
          </Button>
          <Button 
            size="sm" 
            variant="warning" 
            onClick={() => onRenew(contract)}
            className="flex-1"
          >
            <TrendingUp size={14} />
            Rinnova
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => onNegotiate(contract)}
            className="flex-1"
          >
            <Users size={14} />
            Negozia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpiringContracts;
