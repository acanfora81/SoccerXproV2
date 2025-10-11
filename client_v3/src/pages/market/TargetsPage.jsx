// client_v3/src/pages/market/TargetsPage.jsx
// Pagina dedicata alla gestione dei target di mercato (Obiettivi)

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2,
  Target as TargetIcon,
  TrendingUp,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import TargetModal from '@/components/market/TargetModal';

const TargetsPage = () => {
  // === STATE MANAGEMENT ===
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === STATUS CONFIGURATION ===
  const statusConfig = {
    'SCOUTING': { label: 'Scouting', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: TargetIcon },
    'INTERESTED': { label: 'Interessato', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Star },
    'CONTACT': { label: 'Contattato', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: User },
    'NEGOTIATING': { label: 'Negoziazione', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TrendingUp },
    'OFFER_SENT': { label: 'Offerta Inviata', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: DollarSign },
    'SIGNED': { label: 'Firmato', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
    'REJECTED': { label: 'Rifiutato', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
    'ARCHIVED': { label: 'Archiviato', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: AlertCircle }
  };

  const priorityColors = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-500 text-white',
    3: 'bg-yellow-500 text-white',
    4: 'bg-blue-500 text-white',
    5: 'bg-gray-500 text-white'
  };

  // === API CALLS ===
  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterPosition !== 'all') params.set('position', filterPosition);
      if (searchTerm) params.set('search', searchTerm);
      
      const json = await apiFetch(`/api/market/targets?${params.toString()}`);
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento obiettivi');
      
      setTargets(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const json = await apiFetch('/api/market/targets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore creazione');
      
      setIsModalOpen(false);
      setSelectedTarget(null);
      await fetchTargets();
      setFeedbackDialog({ isOpen: true, message: 'Obiettivo creato con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedTarget?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/targets/${selectedTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      
      setIsModalOpen(false);
      setSelectedTarget(null);
      await fetchTargets();
      setFeedbackDialog({ isOpen: true, message: 'Obiettivo aggiornato con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleConfirmDelete = async () => {
    const { target } = deleteConfirm;
    if (!target?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/targets/${target.id}`, {
        method: 'DELETE'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore eliminazione');
      
      setDeleteConfirm({ isOpen: false, target: null });
      await fetchTargets();
      setFeedbackDialog({ isOpen: true, message: 'Obiettivo archiviato con successo!', type: 'success' });
    } catch (e) {
      setDeleteConfirm({ isOpen: false, target: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${e.message}`, type: 'danger' });
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    fetchTargets();
  }, [filterStatus, filterPriority, filterPosition]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') fetchTargets();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // === FILTERED DATA ===
  const filteredTargets = useMemo(() => {
    let filtered = targets;
    
    // Client-side additional filtering if needed
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(term) ||
        t.current_club?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [targets, searchTerm]);

  // === STATS ===
  const stats = useMemo(() => {
    return {
      total: targets.length,
      scouting: targets.filter(t => t.status === 'SCOUTING').length,
      active: targets.filter(t => ['INTERESTED', 'CONTACT', 'NEGOTIATING', 'OFFER_SENT'].includes(t.status)).length,
      signed: targets.filter(t => t.status === 'SIGNED').length,
      highPriority: targets.filter(t => t.priority <= 2).length
    };
  }, [targets]);

  // === RENDER FUNCTIONS ===
  const renderTargetCard = (target) => {
    const statusInfo = statusConfig[target.status] || statusConfig['SCOUTING'];
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card key={target.id} className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          {/* Header con Priority e Status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[target.priority] || priorityColors[3]}`}>
                P{target.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>

          {/* Nome Giocatore */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {target.first_name} {target.last_name}
          </h3>

          {/* Info Giocatore */}
          <div className="space-y-2 mb-4">
            {target.position && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <TargetIcon className="w-4 h-4 mr-2" />
                <span>{target.position}</span>
              </div>
            )}
            
            {target.current_club && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{target.current_club}</span>
              </div>
            )}
            
            {target.age && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{target.age} anni</span>
              </div>
            )}
            
            {target.market_value && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>{Number(target.market_value).toLocaleString('it-IT')} €</span>
              </div>
            )}

            {target.agent && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4 mr-2" />
                <span>{target.agent.first_name} {target.agent.last_name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTarget(target);
                setIsViewMode(true);
                setIsModalOpen(true);
              }}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizza
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTarget(target);
                setIsViewMode(false);
                setIsModalOpen(true);
              }}
              className="text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: true, target })}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Archivia
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // === MAIN RENDER ===
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Obiettivi di Mercato"
        subtitle="Gestione target e giocatori d'interesse"
        actions={
          <Button onClick={() => { setSelectedTarget(null); setIsViewMode(false); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuovo Obiettivo</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Totale Obiettivi</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">In Scouting</div>
            <div className="text-2xl font-bold text-blue-600">{stats.scouting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Attivi</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Firmati</div>
            <div className="text-2xl font-bold text-purple-600">{stats.signed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Alta Priorità</div>
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
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
                placeholder="Cerca giocatore o club..."
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
              <option value="SCOUTING">Scouting</option>
              <option value="INTERESTED">Interessato</option>
              <option value="CONTACT">Contattato</option>
              <option value="NEGOTIATING">Negoziazione</option>
              <option value="OFFER_SENT">Offerta Inviata</option>
              <option value="SIGNED">Firmato</option>
              <option value="REJECTED">Rifiutato</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutte le priorità</option>
              <option value="1">Priorità 1 (Massima)</option>
              <option value="2">Priorità 2</option>
              <option value="3">Priorità 3</option>
              <option value="4">Priorità 4</option>
              <option value="5">Priorità 5 (Minima)</option>
            </select>

            {/* Position Filter */}
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutti i ruoli</option>
              <option value="POR">Portiere</option>
              <option value="DIF">Difensore</option>
              <option value="CEN">Centrocampista</option>
              <option value="ATT">Attaccante</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Targets Grid */}
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

      {!loading && !error && filteredTargets.length === 0 && (
        <EmptyState
          icon={TargetIcon}
          title="Nessun obiettivo trovato"
          description="Inizia aggiungendo il tuo primo obiettivo di mercato"
          action={
            <Button onClick={() => { setSelectedTarget(null); setIsViewMode(false); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Obiettivo
            </Button>
          }
        />
      )}

      {!loading && !error && filteredTargets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map(renderTargetCard)}
        </div>
      )}

      {/* Modals */}
      <TargetModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTarget(null); }}
        onSubmit={selectedTarget ? handleUpdate : handleCreate}
        initial={selectedTarget}
        isViewMode={isViewMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, target: null })}
        onConfirm={handleConfirmDelete}
        title="Archivia Obiettivo"
        message={`Sei sicuro di voler archiviare "${deleteConfirm.target?.first_name} ${deleteConfirm.target?.last_name}"? Potrà essere ripristinato in seguito.`}
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

export default TargetsPage;
