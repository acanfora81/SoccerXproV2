// client_v3/src/pages/market/OffersPage.jsx
// Pagina dedicata alla gestione delle offerte di mercato

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/http';
import OfferModal from '@/components/market/OfferModal';

const OffersPage = () => {
  // === STATE MANAGEMENT ===
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDirection, setFilterDirection] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, offer: null });
  const [acceptConfirm, setAcceptConfirm] = useState({ isOpen: false, offer: null });
  const [rejectConfirm, setRejectConfirm] = useState({ isOpen: false, offer: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // === STATUS CONFIGURATION ===
  const statusConfig = {
    'DRAFT': { label: 'Bozza', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: FileText },
    'PENDING': { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    'ACCEPTED': { label: 'Accettata', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
    'REJECTED': { label: 'Rifiutata', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
    'EXPIRED': { label: 'Scaduta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: Calendar }
  };

  const directionConfig = {
    'IN': { label: 'In Entrata', color: 'text-green-600 dark:text-green-400', icon: ArrowDownCircle },
    'OUT': { label: 'In Uscita', color: 'text-blue-600 dark:text-blue-400', icon: ArrowUpCircle }
  };

  // === API CALLS ===
  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterDirection !== 'all') params.set('direction', filterDirection);
      if (searchTerm) params.set('search', searchTerm);
      
      const json = await apiFetch(`/api/market/offers?${params.toString()}`);
      if (json?.success === false) throw new Error(json?.error || 'Errore caricamento offerte');
      
      setOffers(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const json = await apiFetch('/api/market/offers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore creazione');
      
      setIsModalOpen(false);
      setSelectedOffer(null);
      await fetchOffers();
      setFeedbackDialog({ isOpen: true, message: 'Offerta creata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante la creazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedOffer?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/offers/${selectedOffer.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore aggiornamento');
      
      setIsModalOpen(false);
      setSelectedOffer(null);
      await fetchOffers();
      setFeedbackDialog({ isOpen: true, message: 'Offerta aggiornata con successo!', type: 'success' });
    } catch (e) {
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'aggiornamento: ${e.message}`, type: 'danger' });
    }
  };

  const handleAccept = async () => {
    const { offer } = acceptConfirm;
    if (!offer?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/offers/${offer.id}/accept`, {
        method: 'POST'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore accettazione');
      
      setAcceptConfirm({ isOpen: false, offer: null });
      await fetchOffers();
      setFeedbackDialog({ isOpen: true, message: 'Offerta accettata con successo!', type: 'success' });
    } catch (e) {
      setAcceptConfirm({ isOpen: false, offer: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'accettazione: ${e.message}`, type: 'danger' });
    }
  };

  const handleReject = async () => {
    const { offer } = rejectConfirm;
    if (!offer?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/offers/${offer.id}/reject`, {
        method: 'POST'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore rifiuto');
      
      setRejectConfirm({ isOpen: false, offer: null });
      await fetchOffers();
      setFeedbackDialog({ isOpen: true, message: 'Offerta rifiutata con successo!', type: 'success' });
    } catch (e) {
      setRejectConfirm({ isOpen: false, offer: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante il rifiuto: ${e.message}`, type: 'danger' });
    }
  };

  const handleConfirmDelete = async () => {
    const { offer } = deleteConfirm;
    if (!offer?.id) return;
    
    try {
      setLoading(true);
      const json = await apiFetch(`/api/market/offers/${offer.id}`, {
        method: 'DELETE'
      });
      if (json?.success === false) throw new Error(json?.error || 'Errore eliminazione');
      
      setDeleteConfirm({ isOpen: false, offer: null });
      await fetchOffers();
      setFeedbackDialog({ isOpen: true, message: 'Offerta eliminata con successo!', type: 'success' });
    } catch (e) {
      setDeleteConfirm({ isOpen: false, offer: null });
      setFeedbackDialog({ isOpen: true, message: `Errore durante l'eliminazione: ${e.message}`, type: 'danger' });
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    fetchOffers();
  }, [filterStatus, filterDirection]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') fetchOffers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // === FILTERED DATA ===
  const filteredOffers = useMemo(() => {
    return offers;
  }, [offers]);

  // === STATS ===
  const stats = useMemo(() => {
    return {
      total: offers.length,
      pending: offers.filter(o => o.status === 'PENDING').length,
      accepted: offers.filter(o => o.status === 'ACCEPTED').length,
      rejected: offers.filter(o => o.status === 'REJECTED').length,
      totalValue: offers.reduce((sum, o) => sum + (Number(o.fee) || 0), 0)
    };
  }, [offers]);

  // === RENDER FUNCTIONS ===
  const renderOfferCard = (offer) => {
    const statusInfo = statusConfig[offer.status] || statusConfig['DRAFT'];
    const directionInfo = directionConfig[offer.direction] || directionConfig['IN'];
    const StatusIcon = statusInfo.icon;
    const DirectionIcon = directionInfo.icon;
    
    return (
      <Card key={offer.id} className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </span>
              <span className={`flex items-center space-x-1 text-sm font-medium ${directionInfo.color}`}>
                <DirectionIcon className="w-4 h-4" />
                <span>{directionInfo.label}</span>
              </span>
            </div>
          </div>

          {/* Negotiation Info */}
          {offer.negotiation && (
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {offer.negotiation.player_first_name} {offer.negotiation.player_last_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trattativa #{offer.negotiation.id} - {offer.negotiation.stage}
              </p>
            </div>
          )}

          {/* Offer Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 mr-2" />
              <span className="font-medium">Tipo:</span>
              <span className="ml-2">{offer.type}</span>
            </div>
            
            {offer.fee && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="font-medium">Importo:</span>
                <span className="ml-2">{Number(offer.fee).toLocaleString('it-IT')} {offer.currency}</span>
              </div>
            )}
            
            {offer.salary_offer && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="font-medium">Stipendio:</span>
                <span className="ml-2">{Number(offer.salary_offer).toLocaleString('it-IT')} {offer.currency}/anno</span>
              </div>
            )}
            
            {offer.contract_years && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">Durata:</span>
                <span className="ml-2">{offer.contract_years} {offer.contract_years === 1 ? 'anno' : 'anni'}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOffer(offer);
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
                setSelectedOffer(offer);
                setIsViewMode(false);
                setIsModalOpen(true);
              }}
              className="text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifica
            </Button>
            {offer.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAcceptConfirm({ isOpen: true, offer })}
                  className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accetta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectConfirm({ isOpen: true, offer })}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rifiuta
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: true, offer })}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Elimina
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
        title="Offerte di Mercato"
        subtitle="Gestione offerte in entrata e in uscita"
        actions={
          <Button onClick={() => { setSelectedOffer(null); setIsViewMode(false); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuova Offerta</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Totale Offerte</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">In Attesa</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Accettate</div>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Rifiutate</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Valore Totale</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalValue.toLocaleString('it-IT')} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca offerte..."
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
              <option value="DRAFT">Bozza</option>
              <option value="PENDING">In Attesa</option>
              <option value="ACCEPTED">Accettata</option>
              <option value="REJECTED">Rifiutata</option>
              <option value="EXPIRED">Scaduta</option>
            </select>

            {/* Direction Filter */}
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tutte le direzioni</option>
              <option value="IN">In Entrata</option>
              <option value="OUT">In Uscita</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredOffers.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Nessuna offerta trovata"
          description="Inizia aggiungendo la tua prima offerta di mercato"
          action={
            <Button onClick={() => { setSelectedOffer(null); setIsViewMode(false); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Offerta
            </Button>
          }
        />
      )}

      {!loading && !error && filteredOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map(renderOfferCard)}
        </div>
      )}

      {/* Modals */}
      <OfferModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedOffer(null); }}
        onSubmit={selectedOffer ? handleUpdate : handleCreate}
        initial={selectedOffer}
        isViewMode={isViewMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, offer: null })}
        onConfirm={handleConfirmDelete}
        title="Elimina Offerta"
        message="Sei sicuro di voler eliminare questa offerta? L'operazione non può essere annullata."
      />

      {/* Accept Confirmation */}
      <ConfirmDialog
        open={acceptConfirm.isOpen}
        onOpenChange={(open) => !open && setAcceptConfirm({ isOpen: false, offer: null })}
        onConfirm={handleAccept}
        title="Accetta Offerta"
        message="Sei sicuro di voler accettare questa offerta?"
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectConfirm.isOpen}
        onOpenChange={(open) => !open && setRejectConfirm({ isOpen: false, offer: null })}
        onConfirm={handleReject}
        title="Rifiuta Offerta"
        message="Sei sicuro di voler rifiutare questa offerta?"
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

export default OffersPage;
