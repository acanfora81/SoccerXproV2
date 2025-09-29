import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Calendar,
  Euro,
  AlertTriangle,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  History
} from 'lucide-react';
import ContractsListKPI from '../../components/contracts/ContractsListKPI';
import { apiFetch } from '../../utils/http';
import PageLoader from '../../components/ui/PageLoader';
import NewContractModal from '../../components/contracts/NewContractModal';
import ContractDetailsModal from '../../components/contracts/ContractDetailsModal';
import ContractHistoryModal from '../../components/contracts/ContractHistoryModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatItalianCurrency } from '../../utils/italianNumbers';
import '../../styles/contracts.css';
import '../../styles/contract-modal.css';

const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showExpiring, setShowExpiring] = useState(false);
  const [stats, setStats] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, contract: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // Carica contratti
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterType !== 'all') params.set('contractType', filterType);
      if (showExpiring) params.set('expiring', 'true');

      const response = await apiFetch(`/api/contracts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setContracts(data.data || []);

    } catch (err) {
      console.error('Errore caricamento contratti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterType, showExpiring]);

  // Calcola statistiche in base ai contratti filtrati
  const calculateStats = useCallback(() => {
    // Usa tutti i contratti per le statistiche totali, non quelli filtrati
    const total = contracts.length;
    const active = contracts.filter(c => ['ACTIVE', 'RENEWED', 'DRAFT'].includes(c.status)).length;
    const expiring = contracts.filter(c => {
      // Solo contratti ACTIVE e RENEWED possono essere in scadenza
      if (!['ACTIVE', 'RENEWED'].includes(c.status)) return false;
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 90 && diffDays > 0;
    }).length;
    
    // Calcola valore totale considerando contratti attivi E rinnovati
    // Esclude contratti SUSPENDED (Sospeso) dal conteggio
    // Include contratti DRAFT (Bozza) come potenziali costi
    const currentDate = new Date();
    const activeContracts = contracts.filter(c => {
      // Include contratti ACTIVE, RENEWED e DRAFT (esclude SUSPENDED e EXPIRED)
      if (!['ACTIVE', 'RENEWED', 'DRAFT'].includes(c.status)) return false;
      
      // Verifica che il contratto sia effettivamente valido oggi
      const startDate = new Date(c.startDate);
      const endDate = new Date(c.endDate);
      
      return startDate <= currentDate && endDate >= currentDate;
    });
    
    // Raggruppa per giocatore e prendi solo il contratto più recente
    const uniquePlayerContracts = new Map();
    activeContracts.forEach(contract => {
      if (!uniquePlayerContracts.has(contract.playerId)) {
        uniquePlayerContracts.set(contract.playerId, contract);
      } else {
        // Se esiste già, confronta le date e prendi il più recente
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

    console.log('💰 Frontend - Calcolo valore totale:', {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      uniquePlayers: uniquePlayerContracts.size,
      totalValue: totalValue,
      contractsUsed: Array.from(uniquePlayerContracts.values()).map(c => ({
        playerId: c.playerId,
        playerName: `${c.players?.firstName || ''} ${c.players?.lastName || ''}`,
        salary: c.salary
      }))
    });

    setStats({
      total,
      active,
      expiring,
      totalValue
    });
  }, [contracts]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Calcola statistiche quando cambiano i contratti
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Handler per aprire modale nuovo contratto
  const handleAddContract = () => {
    console.log('🔵 Apertura modale nuovo contratto');
    setIsModalOpen(true);
  };


  // Handler per chiudere modale
  const handleCloseModal = () => {
    console.log('🔵 Chiusura modale contratto');
    setIsModalOpen(false);
  };

  // Gestione modifica contratto
  const handleEditContract = (contract) => {
    console.log('🔵 Apertura modale modifica contratto:', contract.id);
    setEditingContract(contract);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    console.log('🔵 Chiusura modale modifica contratto');
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  const handleEditModalSuccess = () => {
    console.log('🔵 Contratto modificato con successo');
    // Ricarica i contratti dopo la modifica
    fetchContracts();
    // Forza il ricalcolo delle statistiche
    setTimeout(() => {
      calculateStats();
    }, 100);
    // Chiudi modale
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  // Gestione eliminazione contratto
  const handleDeleteContract = (contract) => {
    console.log('🔵 Apertura popup conferma eliminazione:', contract.id);
    setDeleteConfirm({ isOpen: true, contract });
  };

  const handleConfirmDelete = async () => {
    const { contract } = deleteConfirm;
    
    try {
      setLoading(true);
      console.log('🔵 Eliminazione contratto:', contract.id);
      
      const response = await apiFetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      // Ricarica i contratti dopo l'eliminazione
      await fetchContracts();
      
      // Chiudi popup di conferma
      setDeleteConfirm({ isOpen: false, contract: null });
      
      // Mostra messaggio di successo standardizzato
      setFeedbackDialog({ isOpen: true, message: 'Contratto eliminato con successo!', type: 'success' });
      
    } catch (err) {
      console.error('Errore eliminazione contratto:', err);
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${err.message}` , type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('🔵 Annullamento eliminazione contratto');
    setDeleteConfirm({ isOpen: false, contract: null });
  };

  // Gestione visualizzazione contratto
  const handleViewContract = (contract) => {
    console.log('🔵 Apertura modale visualizzazione contratto:', contract.id);
    setViewingContract(contract);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    console.log('🔵 Chiusura modale visualizzazione contratto');
    setIsViewModalOpen(false);
    setViewingContract(null);
  };

  // Gestione visualizzazione storia contratti
  const handleViewHistory = (contract) => {
    console.log('🔵 Apertura modale storia contratti per giocatore:', contract.playerId);
    setHistoryPlayer({
      id: contract.playerId,
      name: `${contract.players.firstName} ${contract.players.lastName}`
    });
    setIsHistoryModalOpen(true);
  };

  const handleHistoryModalClose = () => {
    console.log('🔵 Chiusura modale storia contratti');
    setIsHistoryModalOpen(false);
    setHistoryPlayer(null);
  };



  // Handler per successo creazione contratto
  const handleContractSuccess = (newContract) => {
    console.log('🟢 Contratto creato con successo:', newContract);
    
    // Aggiungi nuovo contratto alla lista
    setContracts(prev => [newContract, ...prev]);
    
    // Ricarica lista per avere dati completi
    fetchContracts();
    
    // Chiudi modale
    setIsModalOpen(false);
  };

  // Filtra contratti (l'ordinamento è ora gestito dal backend)
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.players.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.players.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
      case 'ACTIVE': return 'status-green';
      case 'DRAFT': return 'status-blue';
      case 'EXPIRED': return 'status-red';
      case 'TERMINATED': return 'status-red';
      case 'RENEWED': return 'status-green';
      case 'SUSPENDED': return 'status-yellow';
      default: return 'status-default';
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

  const isExpiring = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  };

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <PageLoader message="Caricamento Contratti..." minHeight={360} />;
  }

  if (error) {
    return (
      <div className="contracts-list">
        <div className="contracts-header">
          <h2>Gestione Contratti</h2>
        </div>
        <div className="error-state">
          <p style={{ color: '#EF4444' }}>Errore: {error}</p>
          <button onClick={fetchContracts} className="btn btn-secondary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contracts-list">
      {/* Header */}
      <div className="contracts-header">
        <div className="header-left">
          <h2>Gestione Contratti</h2>
          <p>{filteredContracts.length} contratti trovati</p>
        </div>
        <div className="header-right">
        <button className="btn btn-primary" onClick={handleAddContract}>
          <Plus size={20} />
          Nuovo Contratto
        </button>
      </div>
      </div>

      {/* Statistiche - KPI standard */}
      <ContractsListKPI stats={stats} />

      {/* Filtri */}
      <div className="contracts-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca giocatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutti gli stati</option>
            <option value="ACTIVE">Attivi</option>
            <option value="DRAFT">Bozze</option>
            <option value="EXPIRED">Scaduti</option>
            <option value="TERMINATED">Rescissi</option>
            <option value="RENEWED">Rinnovati</option>
          </select>
        </div>

        <div className="filter-box">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutti i tipi</option>
            <option value="PERMANENT">Permanenti</option>
            <option value="LOAN">Prestiti</option>
            <option value="TRIAL">Prove</option>
            <option value="YOUTH">Giovanili</option>
          </select>
        </div>

        <div className="filter-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showExpiring}
              onChange={(e) => setShowExpiring(e.target.checked)}
            />
            <span>In scadenza (90 giorni)</span>
          </label>
        </div>
      </div>

      {/* Lista contratti */}
      {filteredContracts.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>Nessun contratto trovato</h3>
          <p>
            {contracts.length === 0 
              ? 'Inizia creando il primo contratto'
              : 'Prova a modificare i filtri di ricerca'
            }
          </p>
          {contracts.length === 0 && (
            <button className="btn btn-primary" onClick={handleAddContract}>
              <Plus size={20} />
              Crea Primo Contratto
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Tipo</th>
                <th>Stipendio</th>
                <th>Firmato</th>
                <th>Periodo</th>
                <th>Status</th>
                <th>Ruolo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map(contract => (
                <tr key={contract.id}>
                  <td>
                    <span className="player-name">
                      {contract.players.firstName} {contract.players.lastName}
                    </span>
                  </td>
                  <td>
                    <span className="type-badge">{getTypeLabel(contract.contractType)}</span>
                  </td>
                  <td>
                    <span className="salary-value">
                      {formatCurrency(contract.salary, contract.currency)}
                    </span>
                  </td>
                  <td>
                    <span className="signed-value">
                      {contract.signedDate ? formatDate(contract.signedDate) : '-'}
                    </span>
                  </td>
                  <td>
                    <span className="period-value">
                      {formatDate(contract.endDate)}
                    </span>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-badge ${getStatusColor(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge">{getPositionLabel(contract.players.position)}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-icon-success" 
                        title="Visualizza contratto"
                        onClick={() => handleViewContract(contract)}
                      >
                        <Eye size={16} color="#ffffff" />
                      </button>
                      <button 
                        className="btn-icon btn-icon-primary" 
                        title="Visualizza storia contratti"
                        onClick={() => handleViewHistory(contract)}
                      >
                        <History size={16} color="#ffffff" />
                      </button>
                      <button 
                        className="btn-icon btn-icon-warning" 
                        title="Modifica contratto"
                        onClick={() => handleEditContract(contract)}
                      >
                        <Edit3 size={16} color="#ffffff" />
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        title="Elimina contratto"
                        onClick={() => handleDeleteContract(contract)}
                      >
                        <Trash2 size={16} color="#ffffff" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Elimina Contratto"
        message={`Sei sicuro di voler eliminare il contratto di ${deleteConfirm.contract?.players?.firstName} ${deleteConfirm.contract?.players?.lastName}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog standardizzato esiti operazioni */}
      <ConfirmDialog
        isOpen={feedbackDialog.isOpen}
        onClose={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
        confirmText="Ok"
        cancelText={null}
        type={feedbackDialog.type === 'success' ? 'success' : 'danger'}
      />
    </div>
  );
};

export default ContractsList;
