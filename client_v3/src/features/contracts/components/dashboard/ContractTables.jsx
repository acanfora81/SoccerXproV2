// client_v3/src/features/contracts/components/dashboard/ContractTables.jsx
// Componente per le tabelle dettagliate della dashboard contratti

import { useState } from 'react';
import { 
  Calendar, 
  Euro, 
  AlertTriangle, 
  Clock, 
  User, 
  TrendingUp,
  Eye,
  Edit,
  CheckCircle
} from 'lucide-react';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import ContractDetailsModal from '../ContractDetailsModal';
import NewContractModal from '../NewContractModal';
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import Button from "@/design-system/ds/Button";
import EmptyState from "@/design-system/ds/EmptyState";

const ContractTables = ({ expiring, topPlayers }) => {
  const [activeTable, setActiveTable] = useState('expiring');
  const [viewingContract, setViewingContract] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Formatta valuta
  const formatCurrency = (amount, currency = 'EUR') => {
    return formatItalianCurrency(amount || 0, currency);
  };

  // Formatta data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcola giorni rimanenti
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Ottieni classe CSS per giorni rimanenti
  const getDaysClass = (days) => {
    if (days < 0) return 'text-red-600 dark:text-red-400';
    if (days <= 30) return 'text-red-500 dark:text-red-300';
    if (days <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Traduce status in italiano
  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'RENEWED': return 'Rinnovato';
      case 'EXPIRED': return 'Scaduto';
      case 'TERMINATED': return 'Terminato';
      case 'DRAFT': return 'Bozza';
      case 'SUSPENDED': return 'Sospeso';
      default: return status;
    }
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
    // Chiudi il modal
    setIsEditModalOpen(false);
    setEditingContract(null);
    // Notifica il componente padre per ricaricare i dati
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('contractUpdated'));
    }
  };

  // Traduce ruoli in italiano
  const getRoleLabel = (role) => {
    switch (role) {
      case 'PROFESSIONAL_PLAYER': return 'Giocatore Professionista';
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      case 'STRIKER': return 'Attaccante';
      case 'WINGER': return 'Centrocampista';
      case 'CENTER_BACK': return 'Difensore';
      case 'FULL_BACK': return 'Difensore';
      case 'DEFENSIVE_MIDFIELDER': return 'Centrocampista';
      case 'ATTACKING_MIDFIELDER': return 'Centrocampista';
      default: return role || 'Non specificato';
    }
  };

  // Tabella Contratti in Scadenza
  const ExpiringTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold">Contratti in Scadenza</h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {expiring?.length || 0} contratti
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {expiring && expiring.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Giocatore</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ruolo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stipendio</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Data Scadenza</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Giorni Rimanenti</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);
                  return (
                    <tr key={contract.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {contract.playerName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getRoleLabel(contract.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(contract.salary, contract.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                        {formatDate(contract.endDate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${getDaysClass(daysRemaining)}`}>
                          {daysRemaining < 0 ? 'Scaduto' : `${daysRemaining} giorni`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
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
                            variant="warning"
                            size="sm"
                            title="Modifica contratto"
                            onClick={() => handleEditContract(contract)}
                            className="min-w-[32px] h-8"
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="Nessun contratto in scadenza"
            description="Non ci sono contratti in scadenza nei prossimi 90 giorni"
          />
        )}
      </CardContent>
    </Card>
  );

  // Tabella Top Giocatori
  const TopPlayersTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold">Top Giocatori per Stipendio</h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {topPlayers?.length || 0} giocatori
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {topPlayers && topPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Posizione</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Giocatore</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ruolo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stipendio Annuo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stipendio Mensile</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status Contratto</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player, index) => (
                  <tr key={player.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {player.playerName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getRoleLabel(player.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(player.salary, player.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(player.salary / 12, player.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {getStatusLabel(player.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="info"
                          size="sm"
                          title="Visualizza contratto"
                          onClick={() => handleViewContract(player)}
                          className="min-w-[32px] h-8"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          title="Modifica contratto"
                          onClick={() => handleEditContract(player)}
                          className="min-w-[32px] h-8"
                        >
                          <Edit size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={User}
            title="Nessun giocatore trovato"
            description="Non ci sono giocatori da visualizzare"
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button
          variant={activeTable === 'expiring' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTable('expiring')}
          className="flex items-center gap-2"
        >
          <AlertTriangle size={16} />
          Contratti in Scadenza
        </Button>
        <Button
          variant={activeTable === 'topPlayers' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTable('topPlayers')}
          className="flex items-center gap-2"
        >
          <TrendingUp size={16} />
          Top Giocatori
        </Button>
      </div>

      {/* Table Content */}
      <div>
        {activeTable === 'expiring' && <ExpiringTable />}
        {activeTable === 'topPlayers' && <TopPlayersTable />}
      </div>

      {/* Modale dettagli contratto */}
      <ContractDetailsModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        contract={viewingContract}
      />

      {/* Modale modifica contratto */}
      <NewContractModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditModalSuccess}
        editingContract={editingContract}
      />
    </div>
  );
};

export default ContractTables;
