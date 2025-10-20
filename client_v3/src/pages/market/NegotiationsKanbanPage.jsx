// client_v3/src/pages/market/NegotiationsKanbanPage.jsx
// Vista Kanban per le trattative di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
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
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  UserPlus,
  X,
  Pen,
  ClipboardList,
  Lock
} from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import NegotiationModal from '@/components/market/NegotiationModal';

const NegotiationsKanbanPage = () => {
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

  // === STATE MANAGEMENT ===
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, negotiation: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === KANBAN COLUMNS ===
  const columns = [
    {
      id: 'SCOUTING',
      title: 'Scouting',
      icon: <Eye className="w-4 h-4" />,
      color: 'blue',
      description: 'In fase di osservazione'
    },
    {
      id: 'CONTACT',
      title: 'Contatto',
      icon: <Phone className="w-4 h-4" />,
      color: 'yellow',
      description: 'Primo contatto stabilito'
    },
    {
      id: 'OFFER_SENT',
      title: 'Offerta Inviata',
      icon: <Euro className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
      color: 'orange',
      description: 'Offerta formale inviata'
    },
    {
      id: 'COUNTEROFFER',
      title: 'Controfferta',
      icon: <Euro className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      color: 'purple',
      description: 'In attesa di risposta'
    },
    {
      id: 'AGREEMENT',
      title: 'Accordo',
      icon: <Pen className="w-4 h-4" />,
      color: 'green',
      description: 'Accordo raggiunto'
    },
    {
      id: 'CLOSED',
      title: 'Chiusa',
      icon: <Pen className="w-4 h-4" />,
      color: 'gray',
      description: 'Trattativa completata'
    },
    {
      id: 'REJECTED',
      title: 'Rifiutata',
      icon: <Trash2 className="w-4 h-4" />,
      color: 'red',
      description: 'Trattativa rifiutata'
    }
  ];

  // === API CALLS ===
  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const json = await apiFetch('/api/market/negotiations');
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

  const handleStageUpdate = async (negotiationId, newStage) => {
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/negotiations/${negotiationId}`, {
        method: 'PUT',
        body: JSON.stringify({ stage: newStage })
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento stage');
      
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: `Trattativa aggiornata a ${getStageLabel(newStage)}!`, type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteNegotiation = async (negotiationId) => {
    try {
      setLoading(true);
      
      // Prima chiudiamo la trattativa
      const closeResponse = await apiFetch(`/api/market/negotiations/${negotiationId}/close`, {
        method: 'POST'
      });
      if (closeResponse?.success === false) throw new Error(closeResponse?.error || 'Errore chiusura trattativa');
      
      // Aggiorniamo esplicitamente lo status a CLOSED
      const statusResponse = await apiFetch(`/api/market/negotiations/${negotiationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (statusResponse?.success === false) throw new Error(statusResponse?.error || 'Errore aggiornamento status');
      
      // Poi convertiamo in giocatore
      const convertResponse = await apiFetch(`/api/market/negotiations/${negotiationId}/convert-to-player`, {
        method: 'POST'
      });
      if (convertResponse?.success === false) throw new Error(convertResponse?.error || 'Errore conversione in giocatore');
      
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa completata! Il giocatore è stato aggiunto al team.', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante il completamento: ${e.message}`, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNegotiation = async (negotiationId) => {
    try {
      setLoading(true);
      
      // Aggiorniamo sia stage che status a CLOSED
      const updateResponse = await apiFetch(`/api/market/negotiations/${negotiationId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          stage: 'CLOSED',
          status: 'CLOSED' 
        })
      });
      if (updateResponse?.success === false) throw new Error(updateResponse?.error || 'Errore chiusura trattativa');
      
      await fetchNegotiations();
      setFeedbackDialog({ isOpen: true, message: 'Trattativa chiusa con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la chiusura: ${e.message}`, type: 'danger' });
    } finally {
      setLoading(false);
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
  }, []);

  // === FILTERED DATA ===

  // Raggruppa le trattative per fase
  const negotiationsByStage = useMemo(() => {
    const grouped = {};
    
    // Ordine delle fasi per determinare la cronologia
    const stageOrder = ['SCOUTING', 'CONTACT', 'OFFER_SENT', 'COUNTEROFFER', 'AGREEMENT', 'CLOSED', 'REJECTED'];
    
    columns.forEach(col => {
      if (col.id === 'CLOSED') {
        // Per la colonna CLOSED, mostra tutte le trattative con stage CLOSED o status CLOSED
        grouped[col.id] = negotiations.filter(n => n.stage === 'CLOSED' || n.status === 'CLOSED');
      } else if (col.id === 'REJECTED') {
        // Per la colonna REJECTED, mostra tutte le trattative con stage REJECTED
        grouped[col.id] = negotiations.filter(n => n.stage === 'REJECTED');
      } else {
        // Per le altre colonne, mostra le trattative che hanno attraversato questa fase
        // (fino alla fase corrente inclusa)
        const currentStageIndex = stageOrder.indexOf(col.id);
        grouped[col.id] = negotiations.filter(n => {
          const negotiationStageIndex = stageOrder.indexOf(n.stage);
          
          // Se la trattativa è nello stage corrente
          const isActive = n.stage === col.id;
          
          // Se la trattativa ha stage CLOSED, mostra in tutte le colonne precedenti
          if (n.stage === 'CLOSED') {
            // Mostra in tutte le colonne da SCOUTING ad AGREEMENT
            return ['SCOUTING', 'CONTACT', 'OFFER_SENT', 'COUNTEROFFER', 'AGREEMENT'].includes(col.id);
          }
          
          // Per le altre trattative, mostra solo se hanno attraversato questa fase
          const hasPassedThrough = negotiationStageIndex >= currentStageIndex && n.status !== 'CLOSED';
          return isActive || hasPassedThrough;
        });
      }
    });
    
    return grouped;
  }, [negotiations]);

  // Raggruppa le trattative per giocatore per mantenere l'allineamento delle righe
  const negotiationsByPlayer = useMemo(() => {
    const grouped = {};
    
    negotiations.forEach(negotiation => {
      const playerId = negotiation.targetId || `${negotiation.player_first_name || ''}_${negotiation.player_last_name || ''}`;
      
      if (!grouped[playerId]) {
        grouped[playerId] = {
          playerId,
          playerName: `${negotiation.player_first_name || ''} ${negotiation.player_last_name || ''}`.trim(),
          negotiations: []
        };
      }
      
      grouped[playerId].negotiations.push(negotiation);
    });
    
    // Ordina le trattative per ogni giocatore (più recente prima)
    Object.values(grouped).forEach(player => {
      player.negotiations.sort((a, b) => Number(b.id) - Number(a.id));
    });
    
    return grouped;
  }, [negotiations]);

  // Ordine dei giocatori per allineare le righe tra colonne
  const orderedPlayers = useMemo(() => {
    return Object.values(negotiationsByPlayer).sort((a, b) => {
      if (typeof a.playerId === 'number' && typeof b.playerId === 'number') {
        return a.playerId - b.playerId;
      }
      return String(a.playerId).localeCompare(String(b.playerId));
    });
  }, [negotiationsByPlayer]);

  // Trova la trattativa più appropriata per un giocatore in una specifica colonna
  const getNegotiationsForPlayerInColumn = (player, colId) => {
    const playerNegotiations = player.negotiations;
    
    if (colId === 'CLOSED') {
      // Per CLOSED, mostra la trattativa con stage CLOSED o status CLOSED
      return playerNegotiations.filter(n => n.stage === 'CLOSED' || n.status === 'CLOSED');
    }
    
    if (colId === 'REJECTED') {
      // Per REJECTED, mostra la trattativa con stage REJECTED
      return playerNegotiations.filter(n => n.stage === 'REJECTED');
    }
    
    // Per le altre colonne, trova la trattativa più appropriata
    const stageOrder = ['SCOUTING', 'CONTACT', 'OFFER_SENT', 'COUNTEROFFER', 'AGREEMENT'];
    const currentStageIndex = stageOrder.indexOf(colId);
    
    // Prima cerca una trattativa attiva in questa fase
    let negotiation = playerNegotiations.find(n => 
      n.stage === colId && n.status !== 'CLOSED'
    );
    
    if (negotiation) return [negotiation];
    
    // Se c'è una trattativa con stage CLOSED, mostrala
    const closedNegotiation = playerNegotiations.find(n => n.stage === 'CLOSED');
    if (closedNegotiation) return [closedNegotiation];
    
    // Se non c'è una trattativa attiva, cerca la più recente che ha passato questa fase
    negotiation = playerNegotiations.find(n => {
      const negotiationStageIndex = stageOrder.indexOf(n.stage);
      return negotiationStageIndex >= currentStageIndex && n.status !== 'CLOSED';
    });
    
    return negotiation ? [negotiation] : [];
  };

  const renderColumn = (column) => {
    // Per ogni giocatore, trova TUTTE le trattative per questa colonna
    const columnNegotiations = [];
    
    orderedPlayers.forEach(player => {
      const playerNegotiations = getNegotiationsForPlayerInColumn(player, column.id);
      columnNegotiations.push(...playerNegotiations);
    });
    
    const columnColorClasses = {
      blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
      yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10',
      orange: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10',
      purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10',
      green: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10',
      gray: 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10',
      red: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
    };
    const headerIconBgByColor = {
      blue: 'bg-blue-100 dark:bg-blue-900/30',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
      orange: 'bg-orange-200 dark:bg-orange-800/50',
      purple: 'bg-purple-200 dark:bg-purple-800/50',
      green: 'bg-green-100 dark:bg-green-900/30',
      gray: 'bg-gray-100 dark:bg-gray-900/30',
      red: 'bg-red-100 dark:bg-red-900/30'
    };

    return (
      <div key={column.id} className="w-72 flex-shrink-0">
        <div className={`rounded-lg border-2 ${columnColorClasses[column.color]} p-3 h-full`}>
          {/* Column Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${headerIconBgByColor[column.color]}`}>
              {column.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {column.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight line-clamp-1">
                {column.description}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-full px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0">
              {columnNegotiations.length}
            </div>
          </div>

          {/* Column Content */}
          <div className="space-y-2 min-h-[400px]">
            {columnNegotiations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm">Nessuna trattativa</p>
              </div>
            ) : (
              columnNegotiations.map(n => renderNegotiationCard(n, column.id))
            )}
          </div>
        </div>
      </div>
    );
  };

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-red-600 dark:text-red-400';
      case 2: return 'text-orange-600 dark:text-orange-400';
      case 3: return 'text-yellow-600 dark:text-yellow-400';
      case 4: return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
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
      default: return stage;
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

  // Funzione per tradurre gli enum del database in codici frontend (come nel modale)
  const translatePositionFromEnum = (positionEnum) => {
    const enumToCodeMapping = {
      'GOALKEEPER': 'GK',
      'DEFENDER': 'CB', // Default per DEFENDER
      'MIDFIELDER': 'CM', // Default per MIDFIELDER
      'FORWARD': 'ST' // Default per FORWARD
    };
    return enumToCodeMapping[positionEnum] || positionEnum;
  };

  // === RENDER FUNCTIONS ===
  const renderNegotiationCard = (negotiation, columnId) => {
    const playerName = `${negotiation.player_first_name || ''} ${negotiation.player_last_name || ''}`.trim();
    const target = negotiation.target;
    const isCurrent = negotiation.stage === columnId && negotiation.status !== 'CLOSED';
    const isClosedInColumn = negotiation.status === 'CLOSED' && columnId === 'CLOSED' && !negotiation.signed_player_id;
    const canInteract = isCurrent || isClosedInColumn;
    
    return (
      <div 
        key={negotiation.id} 
        className={`rounded-lg border p-2.5 mb-2 transition-all duration-200 w-full flex flex-col h-72 ${
          isCurrent 
            ? 'bg-white dark:bg-[#0f1424] border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md cursor-pointer' 
            : isClosedInColumn
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50 shadow-sm hover:shadow-md cursor-pointer'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-600/50 opacity-60 cursor-not-allowed'
        }`}
        onClick={(isCurrent || isClosedInColumn) ? () => {
          setSelectedNegotiation(negotiation);
          setIsViewMode(true);
          setIsModalOpen(true);
        } : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-sm leading-tight ${
                isCurrent 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {playerName || 'Giocatore non specificato'}
              </h4>
              {isCurrent && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Attuale
                </span>
              )}
            </div>
            {(target || negotiation.player_snapshot) && (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                {translatePositionToItalian(target?.position || negotiation.player_snapshot?.position)} • {target?.current_club || negotiation.player_snapshot?.current_club || 'Club non specificato'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" title={getRatingTooltip(negotiation)}>
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${
                  i < getPlayerRating(negotiation)
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300 dark:text-gray-600'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Financial Info - evoluzione delle offerte - mostra dati appropriati per ogni fase */}
        {((columnId === 'OFFER_SENT' && (negotiation.first_offer_fee || negotiation.requested_fee || negotiation.first_offer_salary_company || negotiation.requested_salary_company)) ||
          (columnId === 'COUNTEROFFER' && (negotiation.last_counteroffer_fee || negotiation.requested_fee || negotiation.last_counteroffer_salary_company || negotiation.requested_salary_company)) ||
          (columnId === 'AGREEMENT' && (negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee || negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company)) ||
          (columnId === 'CLOSED' && (negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee || negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company)) ||
          (negotiation.status === 'CLOSED' && (negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee || negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company))) && (
          <div className="space-y-1 mb-1.5 pr-1">
            {/* Offerta Inviata - mostra prima offerta SOLO nella colonna Offerta Inviata */}
            {columnId === 'OFFER_SENT' && (
              <>
                {(negotiation.first_offer_fee || negotiation.requested_fee) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                      Prima offerta - Trasferimento: {Number(negotiation.first_offer_fee || negotiation.requested_fee).toLocaleString('it-IT')} €
                    </div>
                  </div>
                )}
                {(negotiation.first_offer_salary_company || negotiation.requested_salary_company) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      Prima offerta - Stipendio: {Number(negotiation.first_offer_salary_company || negotiation.requested_salary_company).toLocaleString('it-IT')} €/anno
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Controfferta - mostra ultima controfferta SOLO nella colonna Controfferta */}
            {columnId === 'COUNTEROFFER' && (
              <>
                {/* Ultima controfferta trasferimento */}
                {(negotiation.last_counteroffer_fee || negotiation.requested_fee) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      Controfferta - Trasferimento: {Number(negotiation.last_counteroffer_fee || negotiation.requested_fee).toLocaleString('it-IT')} €
                    </div>
                  </div>
                )}
                {/* Ultima controfferta stipendio */}
                {(negotiation.last_counteroffer_salary_company || negotiation.requested_salary_company) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      Controfferta - Stipendio: {Number(negotiation.last_counteroffer_salary_company || negotiation.requested_salary_company).toLocaleString('it-IT')} €/anno
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Accordo - mostra accordo finale SOLO nella colonna Accordo */}
            {columnId === 'AGREEMENT' && (
              <>
                {/* Accordo finale trasferimento - ultima controfferta o prima offerta */}
                {(negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                      Accordo finale - Trasferimento: {Number(negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee).toLocaleString('it-IT')} €
                    </div>
                  </div>
                )}
                {/* Accordo finale stipendio - ultima controfferta o prima offerta */}
                {(negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5">
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                      Accordo finale - Stipendio: {Number(negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company).toLocaleString('it-IT')} €/anno
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Chiusa - mostra offerta finale SOLO nella colonna Chiusa */}
            {columnId === 'CLOSED' && (
              <>
                {/* Offerta finale trasferimento - ultima controfferta o prima offerta */}
                {(negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded px-1.5 py-0.5">
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      Offerta finale - Trasferimento: {Number(negotiation.last_counteroffer_fee || negotiation.first_offer_fee || negotiation.requested_fee).toLocaleString('it-IT')} €
                    </div>
                  </div>
                )}
                {/* Offerta finale stipendio - ultima controfferta o prima offerta */}
                {(negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded px-1.5 py-0.5">
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      Offerta finale - Stipendio: {Number(negotiation.last_counteroffer_salary_company || negotiation.first_offer_salary_company || negotiation.requested_salary_company).toLocaleString('it-IT')} €/anno
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Info specifiche per fase Scouting */}
        {(isCurrent || isClosedInColumn) && negotiation.stage === 'SCOUTING' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              In osservazione
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Valutazione in corso
            </div>
          </div>
        )}

        {/* Info specifiche per fase Contatto */}
        {(isCurrent || isClosedInColumn) && negotiation.stage === 'CONTACT' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
              Primo contatto
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              In attesa di risposta
            </div>
          </div>
        )}

        {/* Info specifiche per fase Offerta Inviata - solo se è la fase corrente */}
        {(isCurrent || isClosedInColumn) && negotiation.stage === 'OFFER_SENT' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
              Offerta inviata
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              In attesa di risposta
            </div>
          </div>
        )}

        {/* Info specifiche per fase Controfferta - solo se è la fase corrente */}
        {(isCurrent || isClosedInColumn) && negotiation.stage === 'COUNTEROFFER' && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
              Controfferta ricevuta
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Negoziazione in corso
            </div>
          </div>
        )}

        {/* Info specifiche per fase Accordo - solo se è la fase corrente */}
        {(isCurrent || isClosedInColumn) && negotiation.stage === 'AGREEMENT' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">
              Accordo raggiunto
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Pronto per la firma
            </div>
          </div>
        )}

        {/* Info specifiche per trattative chiuse in attesa di aggiunta al team */}
        {isClosedInColumn && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded px-2 py-1.5 mb-2">
            <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
              Trattativa chiusa
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              In attesa di aggiunta al team
            </div>
          </div>
        )}

        {/* Status and Actions */}
        <div className="mt-auto flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/10">
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(negotiation.status)}`}>
            {getStatusLabel(negotiation.status)}
          </span>
          <div className="flex items-center gap-1">
            {/* Pulsante Aggiungi al Team - per AGREEMENT - escluso ordine speciale in OFFER_SENT, COUNTEROFFER e AGREEMENT */}
            {columnId !== 'OFFER_SENT' && columnId !== 'COUNTEROFFER' && columnId !== 'AGREEMENT' && (isCurrent || isClosedInColumn) && negotiation.stage === 'AGREEMENT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteNegotiation(negotiation.id);
                }}
                className="flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                title="Aggiungi al Team"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Pulsante Chiudi - per AGREEMENT - escluso ordine speciale in OFFER_SENT, COUNTEROFFER e AGREEMENT */}
            {columnId !== 'OFFER_SENT' && columnId !== 'COUNTEROFFER' && columnId !== 'AGREEMENT' && (isCurrent || isClosedInColumn) && negotiation.stage === 'AGREEMENT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseNegotiation(negotiation.id);
                }}
                className="flex items-center justify-center w-6 h-6 rounded border border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Chiudi Trattativa"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Pulsante Crea Contatto - per SCOUTING - solo nella fase corrente */}
            {columnId === 'SCOUTING' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  handleStageUpdate(negotiation.id, 'CONTACT');
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-yellow-300 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Crea Contatto"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pulsante Modifica - per SCOUTING - solo nella fase corrente */}
            {columnId === 'SCOUTING' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  setSelectedNegotiation(negotiation);
                  setIsViewMode(false);
                  setIsModalOpen(true);
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Modifica"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Pulsante Elimina - per SCOUTING - solo nella fase corrente */}
            {columnId === 'SCOUTING' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  setDeleteConfirm({ isOpen: true, negotiation });
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pulsante Modifica - per CONTACT - solo nella fase corrente (stile blu come Scouting) */}
            {columnId === 'CONTACT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  setSelectedNegotiation(negotiation);
                  setIsViewMode(false);
                  setIsModalOpen(true);
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Modifica"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* BLOCCO ORDINATO PER OFFER_SENT */}
            {columnId === 'OFFER_SENT' && (
              <>
                {/* 1) Modifica (blu) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    setSelectedNegotiation(negotiation);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Modifica"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* 2) Controfferta */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    setSelectedNegotiation({ 
                      ...negotiation, 
                      stage: 'COUNTEROFFER',
                      targetId: negotiation.target?.id || null,
                      target: negotiation.target,
                      // Estrai i dati del target per il modale
                      player_first_name: negotiation.target?.first_name || negotiation.player_first_name || '',
                      player_last_name: negotiation.target?.last_name || negotiation.player_last_name || '',
                      player_position: translatePositionFromEnum(negotiation.target?.position || negotiation.player_snapshot?.position || ''),
                      player_nationality: negotiation.target?.nationality || negotiation.player_snapshot?.nationality || '',
                      player_age: negotiation.target?.age || negotiation.player_snapshot?.age || '',
                      player_date_of_birth: negotiation.target?.date_of_birth || negotiation.player_snapshot?.date_of_birth || '',
                      player_current_club: negotiation.target?.current_club || ''
                    });
                    setIsViewMode(false);
                    setIsModalOpen(true);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Controfferta"
              >
                  <Euro className="w-3.5 h-3.5" />
              </button>

                {/* 3) Chiudi Trattativa (nero) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleCloseNegotiation(negotiation.id);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Chiudi Trattativa"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>

                {/* 4) Accordo */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleStageUpdate(negotiation.id, 'AGREEMENT');
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Accordo"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>

                {/* 5) Aggiungi al Team */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleCompleteNegotiation(negotiation.id);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Aggiungi al Team"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>

                {/* 6) Rifiuta Trattativa */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleStageUpdate(negotiation.id, 'REJECTED');
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Rifiuta Trattativa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* 7) Elimina */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    setDeleteConfirm({ isOpen: true, negotiation });
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Pulsante Offerta - per CONTACT - solo nella fase corrente */}
            {columnId === 'CONTACT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  const modalData = { 
                    ...negotiation, 
                    stage: 'OFFER_SENT',
                    targetId: negotiation.target?.id || null,
                    target: negotiation.target,
                    // Estrai i dati del target per il modale
                    player_first_name: negotiation.target?.first_name || negotiation.player_first_name || '',
                    player_last_name: negotiation.target?.last_name || negotiation.player_last_name || '',
                    player_position: translatePositionFromEnum(negotiation.target?.position || negotiation.player_snapshot?.position || ''),
                    player_nationality: negotiation.target?.nationality || negotiation.player_snapshot?.nationality || '',
                    player_age: negotiation.target?.age || negotiation.player_snapshot?.age || '',
                    player_date_of_birth: negotiation.target?.date_of_birth || negotiation.player_snapshot?.date_of_birth || '',
                    player_current_club: negotiation.target?.current_club || ''
                  };
                  
                  
                  setSelectedNegotiation(modalData);
                  setIsViewMode(false);
                  setIsModalOpen(true);
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Fai Offerta"
              >
                <Euro className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pulsante Elimina - per CONTACT - solo nella fase corrente */}
            {columnId === 'CONTACT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  setDeleteConfirm({ isOpen: true, negotiation });
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pulsanti per COUNTEROFFER - stessa sequenza di OFFER_SENT */}
            {columnId === 'COUNTEROFFER' && (
              <>
                {/* 1) Modifica */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                  setSelectedNegotiation(negotiation);
                  setIsViewMode(false);
                  setIsModalOpen(true);
                }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Modifica"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

                {/* 2) Controfferta */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    setSelectedNegotiation({ 
                      ...negotiation, 
                      stage: 'COUNTEROFFER',
                      targetId: negotiation.target?.id || null,
                      target: negotiation.target,
                      // Estrai i dati del target per il modale
                      player_first_name: negotiation.target?.first_name || negotiation.player_first_name || '',
                      player_last_name: negotiation.target?.last_name || negotiation.player_last_name || '',
                      player_position: translatePositionFromEnum(negotiation.target?.position || negotiation.player_snapshot?.position || ''),
                      player_nationality: negotiation.target?.nationality || negotiation.player_snapshot?.nationality || '',
                      player_age: negotiation.target?.age || negotiation.player_snapshot?.age || '',
                      player_date_of_birth: negotiation.target?.date_of_birth || negotiation.player_snapshot?.date_of_birth || '',
                      player_current_club: negotiation.target?.current_club || ''
                    });
                    setIsViewMode(false);
                    setIsModalOpen(true);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Controfferta"
                >
                  <Euro className="w-3.5 h-3.5" />
                </button>

                {/* 3) Chiudi Trattativa (nero) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleCloseNegotiation(negotiation.id);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Chiudi Trattativa"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>

                {/* 4) Accordo */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleStageUpdate(negotiation.id, 'AGREEMENT');
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Accetta Controfferta"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>

                {/* 5) Aggiungi al Team */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleCompleteNegotiation(negotiation.id);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Aggiungi al Team"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>

                {/* 6) Rifiuta Trattativa */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleStageUpdate(negotiation.id, 'REJECTED');
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Rifiuta Trattativa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* 7) Elimina */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    setDeleteConfirm({ isOpen: true, negotiation });
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Pulsanti per AGREEMENT - stessa sequenza di COUNTEROFFER ma senza pulsante Accordo */}
            {columnId === 'AGREEMENT' && (
              <>
                {/* 1) Modifica */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                    if (!canInteract) return;
                    setSelectedNegotiation(negotiation);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Modifica"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* 2) Aggiungi al Team */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleCompleteNegotiation(negotiation.id);
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Aggiungi al Team"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>

                {/* 3) Rifiuta Trattativa */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                    handleStageUpdate(negotiation.id, 'REJECTED');
                  }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Rifiuta Trattativa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* 4) Elimina */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canInteract) return;
                setDeleteConfirm({ isOpen: true, negotiation });
              }}
                  disabled={!canInteract}
                  className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
              title="Elimina"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
              </>
            )}


            {/* Pulsante Chiusa - per AGREEMENT - solo nella fase corrente */}
            {(isCurrent || isClosedInColumn) && negotiation.stage === 'AGREEMENT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseNegotiation(negotiation.id);
                }}
                className="flex items-center justify-center w-6 h-6 rounded border border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Chiudi Trattativa"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            
            {/* Pulsante Modifica (arancione) - esclusi Scouting, Contatto, OFFER_SENT, COUNTEROFFER, AGREEMENT e CLOSED */}
            {(isCurrent || isClosedInColumn) && negotiation.stage !== 'SCOUTING' && negotiation.stage !== 'CONTACT' && negotiation.stage !== 'OFFER_SENT' && negotiation.stage !== 'COUNTEROFFER' && negotiation.stage !== 'AGREEMENT' && negotiation.stage !== 'CLOSED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNegotiation(negotiation);
                  setIsViewMode(false);
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center w-6 h-6 rounded border border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                title="Modifica"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pulsante Rifiuta - per CONTACT - solo nella fase corrente */}
            {columnId === 'CONTACT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canInteract) return;
                  handleStageUpdate(negotiation.id, 'REJECTED');
                }}
                disabled={!canInteract}
                className={`flex items-center justify-center w-6 h-6 rounded border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!canInteract ? 'opacity-50 pointer-events-none' : ''}`}
                title="Rifiuta Trattativa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* PULSANTI PER TRATTATIVE CHIUSE - visibili solo in colonna Chiusa */}
            {columnId === 'CLOSED' && negotiation.stage === 'CLOSED' && !negotiation.signed_player_id && (
              <>
                {/* Pulsante Modifica - per trattative chiuse (blu) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNegotiation(negotiation);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Modifica"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Pulsante Aggiungi al Team - per trattative chiuse */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteNegotiation(negotiation.id);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Aggiungi al Team"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            
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
        title="Kanban Trattative"
        subtitle="Vista a colonne per gestire lo stato delle trattative"
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {!loading && !error && (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-4 items-stretch content-start scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {columns.map(renderColumn)}
          </div>
          {/* Scroll indicator */}
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0f1424] to-transparent pointer-events-none opacity-50"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && negotiations.length === 0 && (
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

export default NegotiationsKanbanPage;
