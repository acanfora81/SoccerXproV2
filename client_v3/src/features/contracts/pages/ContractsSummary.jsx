import React, { useState, useEffect, useCallback } from 'react';
import { 
  Euro,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw,
  Download
} from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import Button from '@/design-system/ds/Button';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import KPICard from '@/design-system/ds/KPICard';
import PageHeader from '@/design-system/ds/PageHeader';
import GlobalLoader from '@/components/ui/GlobalLoader';
import EmptyState from '@/design-system/ds/EmptyState';
import ContractSummaryKPI from '@/features/contracts/components/ContractSummaryKPI';

const ContractsSummary = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({});
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Carica tutti i contratti
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/contracts');
      setContracts(response.data || []);

    } catch (err) {
      console.error('Errore caricamento contratti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica dati di riepilogo
  const fetchSummaryData = useCallback(async () => {
    try {
      const response = await apiFetch('/api/contracts/dashboard/all');
      setSummaryData(response.data || {});
    } catch (err) {
      console.error('Errore caricamento dati riepilogo:', err);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchSummaryData();
  }, [fetchContracts, fetchSummaryData]);

  // Filtra contratti
  useEffect(() => {
    let filtered = contracts;

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.players?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.players?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro per status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Filtro per tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(contract => contract.contractType === typeFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, typeFilter]);

  // Helper per formattazione
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  // Funzioni di traduzione
  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'DRAFT': return 'Bozza';
      case 'EXPIRED': return 'Non Attivo';
      case 'TERMINATED': return 'Non Attivo';
      case 'RENEWED': return 'Attivo';
      default: return status || 'Non specificato';
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

  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position || 'Non specificato';
    }
  };

  // Calcola statistiche
  const calculateStats = () => {
    const total = filteredContracts.length;
    const active = filteredContracts.filter(c => ['ACTIVE', 'RENEWED'].includes(c.status)).length;
    const expiring = filteredContracts.filter(c => {
      if (!['ACTIVE', 'RENEWED'].includes(c.status)) return false;
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 90 && diffDays > 0;
    }).length;

    const totalValue = filteredContracts
      .filter(c => ['ACTIVE', 'RENEWED'].includes(c.status))
      .reduce((sum, c) => sum + parseFloat(c.salary || 0), 0);

    const averageSalary = active > 0 ? totalValue / active : 0;

    return {
      total,
      active,
      expiring,
      totalValue,
      averageSalary
    };
  };

  const stats = calculateStats();

  // Raggruppa per tipo di contratto
  const contractsByType = filteredContracts.reduce((acc, contract) => {
    const type = contract.contractType || 'Non specificato';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Raggruppa per status
  const contractsByStatus = filteredContracts.reduce((acc, contract) => {
    const status = contract.status || 'Non specificato';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const handleExportData = () => {
    // TODO: Implementare esportazione dati
    console.log('Esportazione dati contratti');
  };

  if (loading) {
    return <GlobalLoader sectionName="Contratti e Finanze" fullscreen />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Riepilogo Contratti"
          subtitle="Panoramica completa dei contratti"
        />
        <Card>
          <CardContent className="text-center py-12">
            <FileText size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Errore di Caricamento</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchContracts} variant="secondary">
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
        title="Riepilogo Contratti"
        subtitle={`Panoramica completa di ${filteredContracts.length} contratti`}
        actions={
          <Button variant="secondary" onClick={handleExportData}>
            <Download size={20} />
            Esporta Dati
          </Button>
        }
      />

      {/* Filtri */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cerca per nome giocatore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base w-full"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-base"
              >
                <option value="all">Tutti gli status</option>
                <option value="ACTIVE">Attivi</option>
                <option value="RENEWED">Rinnovati</option>
                <option value="EXPIRED">Scaduti</option>
                <option value="TERMINATED">Rescissi</option>
                <option value="DRAFT">Bozze</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-base"
              >
                <option value="all">Tutti i tipi</option>
                <option value="PROFESSIONAL">Professionale</option>
                <option value="AMATEUR">Amatoriale</option>
                <option value="YOUTH">Giovanile</option>
                <option value="TRAINING">Tirocinio</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          icon={FileText}
          value={stats.total}
          label="Totale Contratti"
        />
        <KPICard
          icon={Users}
          value={stats.active}
          label="Contratti Attivi"
        />
        <KPICard
          icon={Calendar}
          value={stats.expiring}
          label="In Scadenza"
        />
        <KPICard
          icon={Euro}
          value={formatCurrency(stats.totalValue)}
          label="Valore Totale"
        />
        <KPICard
          icon={TrendingUp}
          value={formatCurrency(stats.averageSalary)}
          label="Stipendio Medio"
        />
      </div>

      {/* KPI Dettagliati */}
      {filteredContracts.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Analisi Dettagliata
            </h3>
          </CardHeader>
          <CardContent>
            <ContractSummaryKPI contracts={filteredContracts} />
          </CardContent>
        </Card>
      )}

      {/* Distribuzione per Tipo */}
      {Object.keys(contractsByType).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart size={20} className="text-primary" />
              Distribuzione per Tipo di Contratto
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(contractsByType).map(([type, count]) => (
                <div key={type} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getContractTypeLabel(type)}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText size={20} className="text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuzione per Status */}
      {Object.keys(contractsByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Distribuzione per Status
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(contractsByStatus).map(([status, count]) => {
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'ACTIVE': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
                    case 'RENEWED': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
                    case 'EXPIRED': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
                    case 'TERMINATED': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
                    case 'DRAFT': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
                    default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
                  }
                };

                return (
                  <div key={status} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusLabel(status)}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
                        <span className="text-sm font-semibold">{status[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista Contratti Recenti */}
      {filteredContracts.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              Contratti Recenti
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredContracts.slice(0, 10).map(contract => (
                <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {contract.players?.firstName?.[0]}{contract.players?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contract.players?.firstName} {contract.players?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getContractTypeLabel(contract.contractType)} • {getPositionLabel(contract.players?.position)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(contract.salary, contract.currency)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Scade: {formatDate(contract.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredContracts.length === 0 && !loading && (
        <EmptyState
          icon={FileText}
          title="Nessun contratto trovato"
          description="Non ci sono contratti che corrispondono ai filtri selezionati"
        />
      )}
    </div>
  );
};

export default ContractsSummary;
