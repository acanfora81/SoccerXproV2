// Percorso: client_v3/src/features/contracts/pages/ContractsList.jsx
// Pagina lista contratti con tabella e azioni

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Edit3,
  Trash2,
  Eye,
  History
} from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import PageHeader from '@/design-system/ds/PageHeader';
import GlobalLoader from '@/components/ui/GlobalLoader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import DataTable from '@/design-system/ds/DataTable';
import NewContractModal from '../components/NewContractModal';
import ContractDetailsModal from '../components/ContractDetailsModal';
import ContractHistoryModal from '../components/ContractHistoryModal';
import ContractKPICards from '../components/dashboard/ContractKPICards';

const ContractsList = () => {
  const { id: contractIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showExpiring, setShowExpiring] = useState(false);
  const [stats, setStats] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, contract: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // Se c'è un contractId nell'URL (come parametro o query string), apri la modale dettagli
  useEffect(() => {
    const contractIdFromUrl = contractIdParam || searchParams.get('id');
    if (contractIdFromUrl && contracts.length > 0 && !isViewModalOpen) {
      const contract = contracts.find(c => c.id === parseInt(contractIdFromUrl));
      if (contract) {
        setViewingContract(contract);
        setIsViewModalOpen(true);
      }
    }
  }, [contractIdParam, searchParams, contracts, isViewModalOpen]);

  // Carica contratti
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      // Rimuovo searchTerm dal filtro server - uso solo filtro client
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterType !== 'all') params.set('contractType', filterType);
      if (showExpiring) params.set('expiring', 'true');

      const data = await apiFetch(`/api/contracts?${params.toString()}`);
      setContracts(data.data || []);

    } catch (err) {
      console.error('Errore caricamento contratti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, showExpiring]);

  // Carica dati dashboard per KPI completi
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔵 Caricamento dati dashboard per KPI...');
      const data = await apiFetch('/api/contracts/dashboard/all');
      console.log('🟢 Dati dashboard caricati per KPI:', data);
      setDashboardData(data.data);
    } catch (err) {
      console.error('❌ Errore caricamento dati dashboard:', err);
      // Fallback ai dati locali se l'API fallisce
      setDashboardData(null);
    }
  }, []);

  // Calcola statistiche in base ai contratti filtrati
  const calculateStats = useCallback((contractsToAnalyze = contracts) => {
    const total = contractsToAnalyze.length;
    const active = contractsToAnalyze.filter(c => ['ACTIVE', 'RENEWED', 'DRAFT'].includes(c.status)).length;
    const expiring = contractsToAnalyze.filter(c => {
      if (!['ACTIVE', 'RENEWED'].includes(c.status)) return false;
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 90 && diffDays > 0;
    }).length;
    
    const currentDate = new Date();
    const activeContracts = contractsToAnalyze.filter(c => {
      if (!['ACTIVE', 'RENEWED', 'DRAFT'].includes(c.status)) return false;
      const startDate = new Date(c.startDate);
      const endDate = new Date(c.endDate);
      return startDate <= currentDate && endDate >= currentDate;
    });
    
    const uniquePlayerContracts = new Map();
    activeContracts.forEach(contract => {
      if (!uniquePlayerContracts.has(contract.playerId)) {
        uniquePlayerContracts.set(contract.playerId, contract);
      } else {
        const existing = uniquePlayerContracts.get(contract.playerId);
        const existingEndDate = new Date(existing.endDate);
        const currentEndDate = new Date(contract.endDate);
        
        if (currentEndDate > existingEndDate) {
          uniquePlayerContracts.set(contract.playerId, contract);
        }
      }
    });
    
    const totalValue = Array.from(uniquePlayerContracts.values())
      .reduce((sum, c) => sum + parseFloat(c.salary || 0), 0);

    // Calcola stipendio medio
    const averageSalary = active > 0 ? totalValue / active : 0;

    // Calcola rinnovi questo mese
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const renewalsThisMonth = contractsToAnalyze.filter(c => {
      if (c.status !== 'RENEWED') return false;
      const updatedAt = new Date(c.updatedAt);
      return updatedAt >= firstDayOfMonth;
    }).length;

    // Calcola rinnovi sospesi (contratti in scadenza nei prossimi 30 giorni)
    const pendingRenewals = contractsToAnalyze.filter(c => {
      if (!['ACTIVE', 'RENEWED'].includes(c.status)) return false;
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;

    setStats({
      totalValue,
      totalValueTrend: 0, // Non calcoliamo trend per i dati filtrati
      activeContracts: active,
      activeContractsTrend: 0,
      expiringContracts: expiring,
      expiringContractsTrend: 0,
      averageSalary,
      averageSalaryTrend: 0,
      renewalsThisMonth,
      renewalsThisMonthTrend: 0,
      pendingRenewals,
      pendingRenewalsTrend: 0
    });
  }, [contracts]);

  useEffect(() => {
    fetchContracts();
    fetchDashboardData();
  }, [fetchContracts, fetchDashboardData]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Debounce per la ricerca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms di delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtra contratti con debounce
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = debouncedSearchTerm === '' || 
        contract.players.firstName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        contract.players.lastName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [contracts, debouncedSearchTerm]);

  // Ricalcola statistiche quando cambiano i contratti filtrati
  useEffect(() => {
    calculateStats(filteredContracts);
  }, [filteredContracts, calculateStats]);

  // Handler per aprire modale nuovo contratto
  const handleAddContract = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Gestione modifica contratto
  const handleEditContract = async (contract) => {
    try {
      // Carica il contratto completo dall'API per avere tutti i dati
      console.log('🔵 Caricamento contratto completo per ID:', contract.id);
      const response = await apiFetch(`/api/contracts/${contract.id}`);
      console.log('🔵 Contratto completo caricato:', response);
      
      setEditingContract(response.data || response);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('❌ Errore caricamento contratto:', error);
      // Fallback: usa il contratto dalla tabella
      setEditingContract(contract);
      setIsEditModalOpen(true);
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  const handleEditModalSuccess = () => {
    fetchContracts();
    setTimeout(() => {
      calculateStats();
    }, 100);
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  // Gestione eliminazione contratto
  const handleDeleteContract = (contract) => {
    console.log('🔴 handleDeleteContract chiamata per contratto:', contract.id);
    console.log('🔴 Contratto:', contract);
    setDeleteConfirm({ isOpen: true, contract });
    console.log('🔴 deleteConfirm impostato a:', { isOpen: true, contract });
  };

  const handleConfirmDelete = async () => {
    const { contract } = deleteConfirm;
    
    try {
      setLoading(true);
      
      await apiFetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE'
      });

      await fetchContracts();
      setDeleteConfirm({ isOpen: false, contract: null });
      setFeedbackDialog({ isOpen: true, message: 'Contratto eliminato con successo!', type: 'success' });
      
    } catch (err) {
      console.error('Errore eliminazione contratto:', err);
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${err.message}`, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, contract: null });
  };

  // Gestione visualizzazione contratto
  const handleViewContract = (contract) => {
    setViewingContract(contract);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewingContract(null);
  };

  // Gestione visualizzazione storia contratti
  const handleViewHistory = (contract) => {
    setHistoryPlayer({
      id: contract.playerId,
      name: `${contract.players.firstName} ${contract.players.lastName}`
    });
    setIsHistoryModalOpen(true);
  };

  const handleHistoryModalClose = () => {
    setIsHistoryModalOpen(false);
    setHistoryPlayer(null);
  };

  // Handler per successo creazione contratto
  const handleContractSuccess = (newContract) => {
    setContracts(prev => [newContract, ...prev]);
    fetchContracts();
    setIsModalOpen(false);
  };

  // Helper per formattazione
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return formatItalianCurrency(amount, currency);
  };

  // Helper per tradurre i ruoli in italiano
  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DRAFT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'EXPIRED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'TERMINATED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RENEWED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'DRAFT': return 'Bozza';
      case 'EXPIRED': return 'Non Attivo';
      case 'TERMINATED': return 'Non Attivo';
      case 'RENEWED': return 'Attivo';
      case 'SUSPENDED': return 'Sospeso';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'PERMANENT': return 'Permanente';
      case 'PROFESSIONAL': return 'Professionale';
      case 'LOAN': return 'Prestito';
      case 'TRIAL': return 'Prova';
      case 'YOUTH': return 'Giovanile';
      case 'AMATEUR': return 'Dilettante';
      case 'SEMI_PROFESSIONAL': return 'Semi-Professionale';
      case 'TRAINING_AGREEMENT': return 'Accordo formativo';
      case 'APPRENTICESHIP': return 'Apprendistato';
      default: return type;
    }
  };

  if (loading) {
    return <GlobalLoader sectionName="Contratti e Finanze" fullscreen />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lista Contratti"
          description="Gestione completa dei contratti del team"
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Errore nel caricamento"
              description={`Errore: ${error}`}
            >
              <Button onClick={fetchContracts} variant="outline">
                Riprova
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista Contratti"
        description="Gestione completa dei contratti del team"
        actions={
          <Button onClick={handleAddContract} variant="primary">
            <Plus size={16} />
            Nuovo Contratto
          </Button>
        }
      />

      {/* KPI Cards */}
      <ContractKPICards data={
        // Se c'è un filtro attivo, usa i dati filtrati, altrimenti i dati globali
        (debouncedSearchTerm || filterStatus !== 'all' || filterType !== 'all' || showExpiring) 
          ? stats 
          : (dashboardData?.kpis || stats)
      } />

      {/* Filtri */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Filtri e Ricerca</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca giocatori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tutti gli stati</option>
                <option value="ACTIVE">Attivi</option>
                <option value="DRAFT">Bozze</option>
                <option value="EXPIRED">Scaduti</option>
                <option value="TERMINATED">Rescissi</option>
                <option value="RENEWED">Rinnovati</option>
              </select>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tutti i tipi</option>
              <option value="PERMANENT">Permanenti</option>
              <option value="LOAN">Prestiti</option>
              <option value="TRIAL">Prove</option>
              <option value="YOUTH">Giovanili</option>
            </select>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExpiring}
                  onChange={(e) => setShowExpiring(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">In scadenza (90 giorni)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista contratti */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Nessun contratto trovato"
              description={
                contracts.length === 0 
                  ? 'Inizia creando il primo contratto'
                  : 'Prova a modificare i filtri di ricerca'
              }
            >
              {contracts.length === 0 && (
                <Button onClick={handleAddContract} variant="primary">
                  <Plus size={16} />
                  Crea Primo Contratto
                </Button>
              )}
            </EmptyState>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <DataTable
              data={filteredContracts}
              columns={[
                { 
                  header: "Giocatore", 
                  accessor: (contract) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {contract.players.firstName} {contract.players.lastName}
                    </span>
                  ),
                  align: 'left'
                },
                { 
                  header: "Tipo", 
                  accessor: (contract) => (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {getTypeLabel(contract.contractType)}
                    </span>
                  )
                },
                { 
                  header: "Stipendio", 
                  accessor: (contract) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(contract.salary, contract.currency)}
                    </span>
                  )
                },
                { 
                  header: "Firmato", 
                  accessor: (contract) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {contract.signedDate ? formatDate(contract.signedDate) : '-'}
                    </span>
                  )
                },
                { 
                  header: "Periodo", 
                  accessor: (contract) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(contract.endDate)}
                    </span>
                  )
                },
                { 
                  header: "Status", 
                  accessor: (contract) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                      {getStatusLabel(contract.status)}
                    </span>
                  )
                },
                { 
                  header: "Ruolo", 
                  accessor: (contract) => (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                      {getPositionLabel(contract.players.position)}
                    </span>
                  )
                },
                {
                  header: "Azioni",
                  accessor: (contract) => (
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="info"
                        size="sm"
                        title="Visualizza contratto"
                        onClick={() => handleViewContract(contract)}
                        className="min-w-[32px] h-8"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Visualizza storia contratti"
                        onClick={() => handleViewHistory(contract)}
                        className="min-w-[32px] h-8"
                      >
                        <History size={16} />
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        title="Modifica contratto"
                        onClick={() => handleEditContract(contract)}
                        className="min-w-[32px] h-8"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Elimina contratto"
                        onClick={() => handleDeleteContract(contract)}
                        className="min-w-[32px] h-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Modale nuovo contratto */}
      <NewContractModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleContractSuccess}
      />

      {/* Modale modifica contratto */}
      <NewContractModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditModalSuccess}
        editingContract={editingContract}
      />

      {/* Modale dettagli contratto */}
      <ContractDetailsModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        contract={viewingContract}
      />

      {/* Modale storia contratti */}
      <ContractHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleHistoryModalClose}
        playerId={historyPlayer?.id}
        playerName={historyPlayer?.name}
      />

      {/* Popup conferma eliminazione */}
      {console.log('🔴 ConfirmDialog props:', {
        isOpen: deleteConfirm.isOpen,
        contract: deleteConfirm.contract,
        message: `Sei sicuro di voler eliminare il contratto di ${deleteConfirm.contract?.players?.firstName} ${deleteConfirm.contract?.players?.lastName}?`
      })}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Elimina Contratto"
        message={`Sei sicuro di voler eliminare il contratto di ${deleteConfirm.contract?.players?.firstName} ${deleteConfirm.contract?.players?.lastName}?`}
      />

      {/* Dialog standardizzato esiti operazioni */}
      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog({ isOpen: false, message: '', type: 'success' });
          }
        }}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
      />
    </div>
  );
};

export default ContractsList;