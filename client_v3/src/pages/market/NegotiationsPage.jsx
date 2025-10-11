// client_v3/src/pages/market/NegotiationsPage.jsx
// Pagina dedicata alla gestione delle trattative di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  DollarSign,
  User,
  Calendar,
  Building,
  Target,
  ArrowRight,
  Clock,
  CheckSquare
} from 'lucide-react';
// Animazioni e grafici rimossi per compatibilità
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import NegotiationModal from '@/components/market/NegotiationModal';
import NegotiationDetailsModal from '@/components/market/NegotiationDetailsModal';

const NegotiationsPage = () => {
  // === STATE MANAGEMENT ===
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, negotiation: null });
  const [convertConfirm, setConvertConfirm] = useState({ isOpen: false, negotiation: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === STAGES CONFIGURATION ===
  const stages = [
    { key: 'SCOUTING', label: 'Scouting', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Target },
    { key: 'CONTACT', label: 'Contatto', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: User },
    { key: 'OFFER_SENT', label: 'Offerta Inviata', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: ArrowRight },
    { key: 'COUNTEROFFER', label: 'Controfferte', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TrendingUp },
    { key: 'AGREEMENT', label: 'Accordo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
    { key: 'CLOSED', label: 'Chiusa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: CheckSquare },
    { key: 'REJECTED', label: 'Rifiutata', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
  ];

  // === API CALLS ===
  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterStage !== 'all') params.set('stage', filterStage);
      if (searchTerm) params.set('search', searchTerm);
      
      const json = await apiFetch(`/api/market/negotiations?${params.toString()}`);
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento trattative');
      
      setNegotiations(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const json = await apiFetch('/api/market/negotiations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore creazione');
      
      setIsCreateModalOpen(false);
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa creata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      
      setIsDetailsModalOpen(false);
      setSelectedNegotiation(null);
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa aggiornata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleClose = async (id) => {
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${id}/close`, {
        method: 'POST'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore chiusura');
      
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa chiusa con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la chiusura: ${e.message}`, type: 'danger' });
    }
  };

  const handleConvertToPlayer = async () => {
    const { negotiation } = convertConfirm;
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${negotiation.id}/convert-to-player`, {
        method: 'POST'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore conversione');
      
      setConvertConfirm({ isOpen: false, negotiation: null });
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Giocatore creato nella rosa con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la conversione: ${e.message}`, type: 'danger' });
    }
  };

  // === COMPUTED VALUES ===
  const filteredNegotiations = useMemo(() => {
    return negotiations.filter(neg => {
      const matchesSearch = !searchTerm || 
        neg.player_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.player_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.agent?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.agent?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [negotiations, searchTerm]);

  const negotiationsByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      grouped[stage.key] = filteredNegotiations.filter(neg => neg.stage === stage.key);
    });
    return grouped;
  }, [filteredNegotiations]);

  const stats = useMemo(() => {
    const total = negotiations.length;
    const open = negotiations.filter(n => n.status === 'OPEN').length;
    const agreement = negotiations.filter(n => n.status === 'AGREEMENT').length;
    const closed = negotiations.filter(n => n.status === 'CLOSED').length;
    const rejected = negotiations.filter(n => n.status === 'REJECTED').length;
    
    const totalValue = negotiations.reduce((sum, n) => {
      return sum + (parseFloat(n.requested_fee) || 0) + (parseFloat(n.requested_salary_net) || 0);
    }, 0);
    
    const totalCommissions = negotiations.reduce((sum, n) => {
      return sum + (parseFloat(n.agent_commission_fee) || 0);
    }, 0);

    return { total, open, agreement, closed, rejected, totalValue, totalCommissions };
  }, [negotiations]);

  // === EFFECTS ===
  useEffect(() => {
    fetchNegotiations();
  }, [filterStatus, filterStage]);

  // === RENDER HELPERS ===
  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Aperta' },
      AGREEMENT: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Accordo' },
      CLOSED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', label: 'Chiusa' },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rifiutata' }
    };
    
    const config = statusConfig[status] || statusConfig.OPEN;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '€ 0';
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderNegotiationCard = (negotiation) => {
    const StageIcon = stages.find(s => s.key === negotiation.stage)?.icon || Target;
    
    return (
      <div
        key={negotiation.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedNegotiation(negotiation);
          setIsViewMode(true);
          setIsDetailsModalOpen(true);
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {negotiation.player_first_name} {negotiation.player_last_name}
            </span>
          </div>
          {getStatusBadge(negotiation.status)}
        </div>

        {/* Agent */}
        {negotiation.agent && (
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {negotiation.agent.first_name} {negotiation.agent.last_name}
            </span>
          </div>
        )}

        {/* Counterpart */}
        {negotiation.counterpart && (
          <div className="flex items-center space-x-2 mb-2">
            <Building className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {negotiation.counterpart}
            </span>
          </div>
        )}

        {/* Financial Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(negotiation.requested_fee)}
            </span>
          </div>
          {negotiation.requested_salary_net && (
            <span className="text-xs text-gray-500">
              + {formatCurrency(negotiation.requested_salary_net)}/anno
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNegotiation(negotiation);
                setIsViewMode(true);
                setIsDetailsModalOpen(true);
              }}
              className="h-6 px-2 text-xs"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNegotiation(negotiation);
                setIsViewMode(false);
                setIsDetailsModalOpen(true);
              }}
              className="h-6 px-2 text-xs"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>
          
          {negotiation.status === 'OPEN' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(negotiation.id);
              }}
              className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
            >
              <CheckCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // === LOADING STATE ===
  if (loading && negotiations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Trattative di Mercato" 
          subtitle="Gestione pipeline, richieste economiche e conversione giocatori" 
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Trattative di Mercato" 
          subtitle="Gestione pipeline, richieste economiche e conversione giocatori" 
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={XCircle}
              title="Errore nel caricamento"
              description={`Errore: ${error}`}
            >
              <Button onClick={fetchNegotiations} variant="outline">
                Riprova
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Trattative di Mercato"
        subtitle="Gestione pipeline, richieste economiche e conversione giocatori"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuova Trattativa</span>
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca per nome giocatore o agente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="OPEN">Aperte</option>
              <option value="AGREEMENT">Accordo</option>
              <option value="CLOSED">Chiuse</option>
              <option value="REJECTED">Rifiutate</option>
            </select>

            {/* Stage Filter */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutti gli stage</option>
              {stages.map(stage => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valore Totale</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Commissioni</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalCommissions)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aperte</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {stages.map(stage => (
          <Card key={stage.key} className="min-h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <stage.icon className="w-4 h-4" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.label}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage.color}`}>
                  {negotiationsByStage[stage.key]?.length || 0}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {negotiationsByStage[stage.key]?.map(negotiation => 
                renderNegotiationCard(negotiation)
              )}
              
              {(!negotiationsByStage[stage.key] || negotiationsByStage[stage.key].length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <stage.icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna trattativa</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <NegotiationModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <NegotiationDetailsModal
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedNegotiation(null);
          setIsViewMode(false);
        }}
        negotiation={selectedNegotiation}
        isViewMode={isViewMode}
        onSubmit={(payload) => selectedNegotiation && handleUpdate(selectedNegotiation.id, payload)}
        onConvertToPlayer={(negotiation) => setConvertConfirm({ isOpen: true, negotiation })}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={convertConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) setConvertConfirm({ isOpen: false, negotiation: null });
        }}
        onConfirm={handleConvertToPlayer}
        title="Crea Giocatore in Rosa"
        message={`Vuoi inserire ${convertConfirm.negotiation?.player_first_name} ${convertConfirm.negotiation?.player_last_name} nella rosa e creare il contratto?`}
      />

      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) setFeedbackDialog({ isOpen: false, message: '', type: 'success' });
        }}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
      />
    </div>
  );
};

export default NegotiationsPage;