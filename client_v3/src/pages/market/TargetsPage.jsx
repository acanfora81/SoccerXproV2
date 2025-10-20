// client_v3/src/pages/market/TargetsPage.jsx
// Pagina dedicata alla gestione dei target di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Euro,
  Star,
  Filter,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { Building2 as Building } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';
import TargetModal from '@/components/market/TargetModal';

const TargetsPage = () => {
  // Funzione per tradurre gli enum del database in nomi italiani
  const translatePositionToItalian = (positionEnum) => {
    const positionMapping = {
      'GOALKEEPER': 'Portiere',
      'DEFENDER': 'Difensore',
      'MIDFIELDER': 'Centrocampista',
      'FORWARD': 'Attaccante'
    };
    return positionMapping[positionEnum] || positionEnum;
  };

  // Funzione per tradurre i codici posizione in nomi italiani
  const translatePositionCodeToItalian = (positionCode) => {
    const positionMapping = {
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'LB': 'Terzino Sinistro',
      'RB': 'Terzino Destro',
      'CDM': 'Centrocampista Difensivo',
      'CM': 'Centrocampista',
      'CAM': 'Centrocampista Offensivo',
      'LW': 'Ala Sinistra',
      'RW': 'Ala Destra',
      'ST': 'Attaccante'
    };
    return positionMapping[positionCode] || positionCode;
  };

  // Traduzione piede preferito
  const translateFootToItalian = (foot) => {
    if (!foot) return '-';
    const map = {
      LEFT: 'Sinistro',
      RIGHT: 'Destro',
      BOTH: 'Ambidestro',
      L: 'Sinistro',
      R: 'Destro',
      B: 'Ambidestro'
    };
    const key = String(foot).toUpperCase();
    return map[key] || foot;
  };

  // Traduci stringa ruoli separata da virgole/campi
  const translateRolesList = (roles) => {
    if (!roles) return '-';
    return roles
      .split(/[,;]|\s+/)
      .filter(Boolean)
      .map((r) => translatePositionCodeToItalian(r))
      .join(', ');
  };

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

  // === API CALLS ===
  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterPosition !== 'all') params.set('position', filterPosition);
      
      const json = await apiFetch(`/api/market/targets?${params.toString()}`);
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento target');
      
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
      setFeedbackDialog({ isOpen: true, message: 'Target creato con successo!', type: 'success' });
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
      setFeedbackDialog({ isOpen: true, message: 'Target aggiornato con successo!', type: 'success' });
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
      setFeedbackDialog({ isOpen: true, message: 'Target eliminato con successo!', type: 'success' });
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
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.first_name?.toLowerCase().includes(term) ||
        t.last_name?.toLowerCase().includes(term) ||
        t.current_club?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [targets, searchTerm]);

  // === STATS ===
  const stats = useMemo(() => {
    const totalTargets = targets.length;
    const activeTargets = targets.filter(t => t.status === 'ACTIVE').length;
    const highPriorityTargets = targets.filter(t => t.priority <= 2).length;
    const totalMarketValue = targets.reduce((sum, t) => sum + Number(t.market_value || 0), 0);
    
    return {
      total: totalTargets,
      active: activeTargets,
      highPriority: highPriorityTargets,
      totalMarketValue
    };
  }, [targets]);

  // === HELPER FUNCTIONS ===
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'SCOUTING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'INTERESTED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'CONTACT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-red-600 dark:text-red-400';
      case 2: return 'text-orange-600 dark:text-orange-400';
      case 3: return 'text-yellow-600 dark:text-yellow-400';
      case 4: return 'text-blue-600 dark:text-blue-400';
      case 5: return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Critica';
      case 2: return 'Alta';
      case 3: return 'Media';
      case 4: return 'Bassa';
      case 5: return 'Molto Bassa';
      default: return 'Non definita';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'SCOUTING': return 'In Scouting';
      case 'INTERESTED': return 'Interessato';
      case 'CONTACT': return 'In Contatto';
      case 'NEGOTIATING': return 'In Negoziazione';
      case 'ARCHIVED': return 'Archiviato';
      default: return 'Non definito';
    }
  };

  // === CARD COMPONENT CON TABS (stile compatto, colori invariati) ===
  const TargetCard = ({ target }) => {
    const [activeTab, setActiveTab] = React.useState('info'); // info | club | vdm | valutazioni | link
    const age = target.date_of_birth ? 
      new Date().getFullYear() - new Date(target.date_of_birth).getFullYear() : null;
    
    // Debug: verifica la posizione che arriva dal database
    console.log('🎯 Target position debug:', { 
      id: target.id, 
      name: `${target.first_name} ${target.last_name}`,
      position: target.position,
      translated: translatePositionToItalian(target.position)
    });
    
    return (
      <div className={`bg-white dark:bg-[#0f1424] rounded-xl border transition-all duration-200 flex flex-col h-full ${
        'border-2 border-blue-300 dark:border-blue-500/60 hover:shadow-md ring-1 ring-blue-300/20 dark:ring-blue-500/20 hover:ring-blue-300/30 dark:hover:ring-blue-500/30'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
              <span>{target.first_name?.[0]}{target.last_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {target.first_name} {target.last_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {translatePositionToItalian(target.position)} • {age ? `${age} anni` : ''} • {target.nationality}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  target.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                  target.status === 'SCOUTING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                  target.status === 'NEGOTIATING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                }`}>
                  {getStatusLabel(target.status)}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${
                        i < (target.priority || 3) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs header */}
        <div className="px-4 pt-3">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 dark:border-white/10">
            {[
              { id: 'info', label: 'Informazioni Tecnico', Icon: Users },
              { id: 'club', label: 'Club e Contratto', Icon: Building || Calendar },
              { id: 'vdm', label: 'VdM', Icon: Euro },
              { id: 'valutazioni', label: 'Valutazioni', Icon: Star },
              { id: 'link', label: 'Collegamento e Note', Icon: FileText },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`text-[11px] leading-none px-1.5 py-1.5 -mb-[1px] border-b-2 transition-colors ${
                  activeTab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {t.Icon ? <t.Icon className="w-3 h-3" /> : null}
                  <span>{t.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenuto principale (una tab alla volta) */}
        <div className="p-4 flex-1">
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ruolo Preferito</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{translatePositionCodeToItalian(target.preferred_role) || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ruoli Secondari</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{translateRolesList(target.secondary_roles)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Piede</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{translateFootToItalian(target.foot)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Altezza / Peso</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{target.height_cm ? `${target.height_cm} cm` : '-'}{target.height_cm || target.weight_kg ? ' • ' : ''}{target.weight_kg ? `${target.weight_kg} kg` : '-'}</div>
              </div>
            </div>
          )}

          {activeTab === 'club' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Club Attuale</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{target.current_club || '-'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">{target.club_country || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contratto fino al</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{target.contract_until ? new Date(target.contract_until).toLocaleDateString('it-IT') : '-'}</div>
              </div>
            </div>
          )}

          {activeTab === 'vdm' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valore Mercato</div>
                <div className="text-sm font-semibold text-green-700 dark:text-green-300">{target.market_value != null ? `${Number(target.market_value).toLocaleString('it-IT')} €` : '-'}</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valore Precedente</div>
                <div className="text-sm font-semibold text-green-700 dark:text-green-300">{target.previous_market_value != null ? `${Number(target.previous_market_value).toLocaleString('it-IT')} €` : '-'}</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stipendio Attuale</div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">{target.current_salary != null ? `${Number(target.current_salary).toLocaleString('it-IT')} €` : '-'}</div>
              </div>
            </div>
          )}

          {activeTab === 'valutazioni' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rating Attuale</div>
                <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{target.overall_rating != null ? `${target.overall_rating}/100` : '-'}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Potenziale</div>
                <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">{target.potential_rating != null ? `${target.potential_rating}/100` : '-'}</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Probabilità Trasferimento</div>
                <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">{target.transfer_likelihood != null ? `${target.transfer_likelihood}/100` : '-'}</div>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Raccomandazione</div>
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{target.recommendation_level != null ? `${target.recommendation_level}/5` : '-'}</div>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profilo</div>
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{target.profile_url || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Video</div>
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{target.video_url || '-'}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Note</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{target.notes || '-'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-white/10 mt-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTarget(target);
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
                setSelectedTarget(target);
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
              onClick={() => setDeleteConfirm({ isOpen: true, target })}
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
        title="Target di Mercato"
        subtitle="Gestione obiettivi di mercato e giocatori da acquisire"
        actions={
          <Button onClick={() => { setSelectedTarget(null); setIsViewMode(false); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuovo Target</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Totale Target</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attivi</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
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
                  {stats.totalMarketValue.toLocaleString('it-IT')} €
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
                placeholder="Cerca per nome o club..."
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
              <option value="CONTACT">In contatto</option>
              <option value="ACTIVE">Attivo</option>
              <option value="ARCHIVED">Archiviato</option>
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
              <option value="5">Molto Bassa</option>
            </select>

            {/* Position Filter */}
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutte le posizioni</option>
              <option value="GK">Portiere</option>
              <option value="CB">Difensore Centrale</option>
              <option value="LB">Terzino Sinistro</option>
              <option value="RB">Terzino Destro</option>
              <option value="CDM">Centrocampista Difensivo</option>
              <option value="CM">Centrocampista</option>
              <option value="CAM">Trequartista</option>
              <option value="LW">Ala Sinistra</option>
              <option value="RW">Ala Destra</option>
              <option value="ST">Attaccante</option>
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
          icon={Target}
          title="Nessun target trovato"
          description="Inizia creando il tuo primo target di mercato"
          action={
            <Button onClick={() => { setSelectedTarget(null); setIsViewMode(false); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Target
            </Button>
          }
        />
      )}

      {!loading && !error && filteredTargets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
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
        title="Elimina Target"
        message={`Sei sicuro di voler eliminare il target ${deleteConfirm.target?.first_name} ${deleteConfirm.target?.last_name}? L'operazione non può essere annullata.`}
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