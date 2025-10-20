// client_v3/src/pages/market/NegotiationsPage.jsx
// Pagina dedicata alla gestione delle trattative di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2,
  Handshake,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Euro,
  Star,
  Filter,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  ArrowLeft,
  Pen
} from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import NegotiationModal from '@/components/market/NegotiationModal';

const NegotiationsPage = () => {
  // === UTILITY FUNCTIONS ===
  const getPlayerRating = (negotiation) => {
    const target = negotiation.target;
    
    // Priorità: overall_rating > potential_rating > recommendation_level
    if (target?.overall_rating) {
      // overall_rating è in scala 0-100, convertiamo in 1-5 stelle
      const rating = Number(target.overall_rating);
      if (rating >= 90) return 5;      // 90-100 = 5 stelle
      else if (rating >= 75) return 4; // 75-89 = 4 stelle
      else if (rating >= 60) return 3; // 60-74 = 3 stelle
      else if (rating >= 45) return 2; // 45-59 = 2 stelle
      else return 1;                   // 0-44 = 1 stella
    }
    
    if (target?.potential_rating) {
      // potential_rating è in scala 0-100, convertiamo in 1-5 stelle
      const rating = Number(target.potential_rating);
      if (rating >= 90) return 5;      // 90-100 = 5 stelle
      else if (rating >= 75) return 4; // 75-89 = 4 stelle
      else if (rating >= 60) return 3; // 60-74 = 3 stelle
      else if (rating >= 45) return 2; // 45-59 = 2 stelle
      else return 1;                   // 0-44 = 1 stella
    }
    
    if (target?.recommendation_level) {
      // recommendation_level è già in scala 1-5
      return Number(target.recommendation_level);
    }
    
    // Fallback: usa la priorità della trattativa se non c'è rating del giocatore
    return negotiation.priority || 3;
  };

  const getRatingTooltip = (negotiation) => {
    const target = negotiation.target;
    const rating = getPlayerRating(negotiation);
    
    if (target?.overall_rating) {
      return `Rating Generale: ${target.overall_rating}/100 (${rating}/5 stelle)`;
    }
    
    if (target?.potential_rating) {
      return `Rating Potenziale: ${target.potential_rating}/100 (${rating}/5 stelle)`;
    }
    
    if (target?.recommendation_level) {
      return `Livello Raccomandazione: ${target.recommendation_level}/5`;
    }
    
    return `Priorità Trattativa: ${rating}/5`;
  };

  const translatePositionToItalian = (position) => {
    const positionMap = {
      // Enum values from database (market_target.position)
      'GOALKEEPER': 'Portiere',
      'DEFENDER': 'Difensore',
      'MIDFIELDER': 'Centrocampista',
      'FORWARD': 'Attaccante',
      // Codici abbreviati (da prospect o altri sistemi)
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'LB': 'Terzino Sinistro',
      'RB': 'Terzino Destro',
      'LWB': 'Terzino Sinistro',
      'RWB': 'Terzino Destro',
      'CDM': 'Mediano',
      'CM': 'Centrocampista',
      'CAM': 'Trequartista',
      'LM': 'Centrocampista Sinistro',
      'RM': 'Centrocampista Destro',
      'LW': 'Ala Sinistra',
      'RW': 'Ala Destra',
      'ST': 'Attaccante',
      'CF': 'Centravanti',
      'LF': 'Ala Sinistra',
      'RF': 'Ala Destra',
      'WINGER': 'Ala',
      'STRIKER': 'Attaccante',
      // Altri possibili valori
      'ATTACKER': 'Attaccante',
      'DEFENDER_CENTRAL': 'Difensore Centrale',
      'DEFENDER_LEFT': 'Terzino Sinistro',
      'DEFENDER_RIGHT': 'Terzino Destro',
      'MIDFIELDER_CENTRAL': 'Centrocampista',
      'MIDFIELDER_LEFT': 'Centrocampista Sinistro',
      'MIDFIELDER_RIGHT': 'Centrocampista Destro',
      'ATTACKER_LEFT': 'Ala Sinistra',
      'ATTACKER_RIGHT': 'Ala Destra',
      'ATTACKER_CENTRAL': 'Attaccante'
    };
    return positionMap[position] || position;
  };

  // === STATE MANAGEMENT ===
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, negotiation: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === API CALLS ===
  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterStage !== 'all') params.set('stage', filterStage);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      
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
      
      setIsModalOpen(false);
      setSelectedNegotiation(null);
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa creata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedNegotiation?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${selectedNegotiation.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      
      setIsModalOpen(false);
      setSelectedNegotiation(null);
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa aggiornata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleConfirmDelete = async () => {
    const { negotiation } = deleteConfirm;
    if (!negotiation?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${negotiation.id}`, {
        method: 'DELETE'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore eliminazione');
      
      setDeleteConfirm({ isOpen: false, negotiation: null });
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa eliminata con successo!', type: 'success' });
    } catch (e) {
      setDeleteConfirm({ isOpen: false, negotiation: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${e.message}`, type: 'danger' });
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    fetchNegotiations();
  }, [filterStatus, filterStage, filterPriority]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') fetchNegotiations();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // === FILTERED DATA ===
  const filteredNegotiations = useMemo(() => {
    let filtered = negotiations;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.player_first_name?.toLowerCase().includes(term) ||
        n.player_last_name?.toLowerCase().includes(term) ||
        n.counterpart?.toLowerCase().includes(term) ||
        n.notes?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [negotiations, searchTerm]);

  // === STATS ===
  const stats = useMemo(() => {
    const totalNegotiations = negotiations.length;
    const openNegotiations = negotiations.filter(n => n.status === 'OPEN').length;
    const highPriorityNegotiations = negotiations.filter(n => n.priority === 1 || n.priority === 2).length;
    const totalValue = negotiations.reduce((sum, n) => sum + Number(n.requested_fee || 0), 0);
    
    return {
      total: totalNegotiations,
      open: openNegotiations,
      highPriority: highPriorityNegotiations,
      totalValue
    };
  }, [negotiations]);

  // === HELPER FUNCTIONS ===
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'AGREEMENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'SCOUTING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CONTACT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'OFFER_SENT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'COUNTEROFFER': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'AGREEMENT': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-red-600 dark:text-red-400';
      case 2: return 'text-orange-600 dark:text-orange-400';
      case 3: return 'text-yellow-600 dark:text-yellow-400';
      case 4: return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'SCOUTING': return <Eye className="w-4 h-4" />;
      case 'CONTACT': return <Phone className="w-4 h-4" />;
      case 'OFFER_SENT': return <Euro className="w-4 h-4" />;
      case 'COUNTEROFFER': return <Euro className="w-4 h-4" />;
      case 'AGREEMENT': return <Pen className="w-4 h-4" />;
      case 'CLOSED': return <Pen className="w-4 h-4" />;
      case 'REJECTED': return <Trash2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN': return 'Aperta';
      case 'AGREEMENT': return 'Accordo';
      case 'CLOSED': return 'Chiusa';
      case 'REJECTED': return 'Rifiutata';
      default: return 'Non definita';
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'SCOUTING': return 'Scouting';
      case 'CONTACT': return 'Contatto';
      case 'OFFER_SENT': return 'Offerta Inviata';
      case 'COUNTEROFFER': return 'Controfferta';
      case 'AGREEMENT': return 'Accordo';
      case 'CLOSED': return 'Chiusa';
      case 'REJECTED': return 'Rifiutata';
      default: return 'Non definita';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Critica';
      case 2: return 'Alta';
      case 3: return 'Media';
      case 4: return 'Bassa';
      default: return 'Non definita';
    }
  };

  // === RENDER FUNCTIONS ===
  const renderNegotiationCard = (negotiation) => {
    const playerName = `${negotiation.player_first_name || ''} ${negotiation.player_last_name || ''}`.trim();
    const target = negotiation.target;
    
    return (
      <div key={negotiation.id} className={`bg-white dark:bg-[#0f1424] rounded-xl border transition-all duration-200 flex flex-col h-96 ${
        'border-2 border-green-300 dark:border-green-500/60 hover:shadow-md ring-1 ring-green-300/20 dark:ring-green-500/20 hover:ring-green-300/30 dark:hover:ring-green-500/30'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
              <span>{negotiation.player_first_name?.[0]}{negotiation.player_last_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {playerName || 'Giocatore non specificato'}
              </div>
              {target && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {target.nationality || 'Nazionalità n/d'} • {translatePositionToItalian(target.position) || 'Ruolo n/d'} • {target.current_club || 'Club n/d'}
                </div>
              )}
              {!target && negotiation.player_snapshot && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {negotiation.player_snapshot.nationality || 'Nazionalità n/d'} • {translatePositionToItalian(negotiation.player_snapshot.position) || 'Ruolo n/d'}
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(negotiation.status)}`}>
                    {getStatusLabel(negotiation.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStageColor(negotiation.stage)}`}>
                    {getStageIcon(negotiation.stage)}
                    <span>{getStageLabel(negotiation.stage)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1" title={getRatingTooltip(negotiation)}>
                  {[...Array(5)].map((_, i) => {
                    const playerRating = getPlayerRating(negotiation);
                    return (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${
                          i < playerRating
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Dati anagrafici sintetici */}
            {(target?.date_of_birth || target?.nationality || negotiation.player_snapshot?.nationality) && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Anagrafica</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {(target?.date_of_birth ? new Date(target.date_of_birth).toLocaleDateString('it-IT') : null) || 'Data n/d'} • {(target?.nationality || negotiation.player_snapshot?.nationality || 'Nazionalità n/d')}
                </div>
              </div>
            )}
            {/* Transfer Fee */}
            {negotiation.requested_fee && (
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Costo Trasferimento</div>
                <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {Number(negotiation.requested_fee).toLocaleString('it-IT')} €
                </div>
              </div>
            )}

            {/* Salary */}
            {negotiation.requested_salary_company && (
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stipendio Richiesto</div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {Number(negotiation.requested_salary_company).toLocaleString('it-IT')} €/anno
                </div>
              </div>
            )}

            {/* Counterpart */}
            {negotiation.counterpart && (
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Controparte</div>
                <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 truncate">
                  {negotiation.counterpart}
                </div>
              </div>
            )}

            {/* Contract Years */}
            {negotiation.requested_contract_years && (
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Durata Contratto</div>
                <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {negotiation.requested_contract_years} anni
                </div>
              </div>
            )}

            {/* Next Action */}
            {negotiation.next_action_date && (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prossima Azione</div>
                <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  {new Date(negotiation.next_action_date).toLocaleDateString('it-IT')}
                </div>
              </div>
            )}

            {/* Budget Included */}
            {negotiation.budget_included && (
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget</div>
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Incluso
                </div>
              </div>
            )}

            {/* Notes Preview */}
            {negotiation.notes && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Note</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {negotiation.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-white/10 mt-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedNegotiation(negotiation);
                setIsViewMode(true);
                setIsModalOpen(true);
              }}
              className="flex-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizza
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedNegotiation(negotiation);
                setIsViewMode(false);
                setIsModalOpen(true);
              }}
              className="flex-1 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: true, negotiation })}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // === MAIN RENDER ===
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Trattative di Mercato"
        subtitle="Gestione trattative economiche e negoziazioni"
        actions={
          <Button onClick={() => { setSelectedNegotiation(null); setIsViewMode(false); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuova Trattativa</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Totale Trattative</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
              </div>
              <Handshake className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Aperte</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.open}
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Alta Priorità</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.highPriority}
                </div>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Valore Totale</div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalValue.toLocaleString('it-IT')} €
                </div>
              </div>
              <Euro className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca per nome o controparte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutte le fasi</option>
              <option value="SCOUTING">Scouting</option>
              <option value="CONTACT">Contatto</option>
              <option value="OFFER_SENT">Offerta Inviata</option>
              <option value="COUNTEROFFER">Controfferta</option>
              <option value="AGREEMENT">Accordo</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutte le priorità</option>
              <option value="1">Critica</option>
              <option value="2">Alta</option>
              <option value="3">Media</option>
              <option value="4">Bassa</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Negotiations Grid */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredNegotiations.length === 0 && (
        <EmptyState
          icon={Handshake}
          title="Nessuna trattativa trovata"
          description="Inizia creando la tua prima trattativa di mercato"
          action={
            <Button onClick={() => { setSelectedNegotiation(null); setIsViewMode(false); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Trattativa
            </Button>
          }
        />
      )}

      {!loading && !error && filteredNegotiations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNegotiations.map(renderNegotiationCard)}
        </div>
      )}

      {/* Modals */}
      <NegotiationModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedNegotiation(null); }}
        onSubmit={selectedNegotiation ? handleUpdate : handleCreate}
        initial={selectedNegotiation}
        isViewMode={isViewMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, negotiation: null })}
        onConfirm={handleConfirmDelete}
        title="Elimina Trattativa"
        message={`Sei sicuro di voler eliminare la trattativa per ${deleteConfirm.negotiation?.player_first_name} ${deleteConfirm.negotiation?.player_last_name}? L'operazione non può essere annullata.`}
      />

      {/* Feedback Dialog */}
      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => !open && setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
      />
    </div>
  );
};

export default NegotiationsPage;