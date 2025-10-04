// client_v3/src/features/contracts/components/dashboard/ContractTimeline.jsx
// Componente per la timeline delle scadenze contratti

import { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Edit
} from 'lucide-react';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import NewContractModal from '../NewContractModal';
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import Button from "@/design-system/ds/Button";
import EmptyState from "@/design-system/ds/EmptyState";
import KPICard from "@/design-system/ds/KPICard";

const ContractTimeline = ({ data }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  // Raggruppa contratti per mese
  const groupContractsByMonth = (contracts) => {
    const grouped = {};
    
    contracts?.forEach(contract => {
      const endDate = new Date(contract.endDate);
      const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: endDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
          contracts: []
        };
      }
      
      grouped[monthKey].contracts.push(contract);
    });

    // Ordina per mese
    return Object.keys(grouped)
      .sort()
      .map(key => grouped[key]);
  };

  // Naviga tra i mesi
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Gestione modifica contratto
  const handleEditContract = (contract) => {
    console.log('🔵 Apertura modale modifica contratto dalla timeline:', contract.id);
    setEditingContract(contract);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    console.log('🔵 Chiusura modale modifica contratto dalla timeline');
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  const handleEditModalSuccess = () => {
    console.log('🔵 Contratto modificato con successo dalla timeline');
    setIsEditModalOpen(false);
    setEditingContract(null);
    // Notifica il componente padre per ricaricare i dati
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('contractUpdated'));
    }
  };

  // Filtra contratti per il mese corrente
  const getCurrentMonthContracts = () => {
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const grouped = groupContractsByMonth(data);
    
    return grouped.find(group => {
      const groupMonthKey = `${new Date(group.contracts[0]?.endDate).getFullYear()}-${String(new Date(group.contracts[0]?.endDate).getMonth() + 1).padStart(2, '0')}`;
      return groupMonthKey === currentMonthKey;
    });
  };

  const currentMonthData = getCurrentMonthContracts();
  const groupedData = groupContractsByMonth(data);

  return (
    <div className="space-y-6">
      {/* Header con navigazione */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold">Timeline Scadenze Contratti</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(-1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiche mese corrente */}
      {currentMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPICard
            title="Contratti in Scadenza"
            value={currentMonthData.contracts.length.toString()}
            subtitle="Questo mese"
            icon={Calendar}
            color="warning"
          />
          <KPICard
            title="Valore Totale"
            value={formatCurrency(
              currentMonthData.contracts.reduce((sum, c) => sum + Number(c.salary || 0), 0)
            )}
            subtitle="Contratti in scadenza"
            icon={Calendar}
            color="primary"
          />
        </div>
      )}

      {/* Dettagli mese corrente */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold">
            Contratti in Scadenza - {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </h4>
        </CardHeader>
        <CardContent>
          {currentMonthData ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Data Scadenza</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Giocatore</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ruolo</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stipendio</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Giorni Rimanenti</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthData.contracts
                    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
                    .map((contract) => {
                      const daysRemaining = getDaysRemaining(contract.endDate);
                      
                      return (
                        <tr key={contract.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {formatDate(contract.endDate)}
                              </span>
                            </div>
                          </td>
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
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {getStatusLabel(contract.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-medium ${getDaysClass(daysRemaining)}`}>
                              {daysRemaining < 0 ? 'Scaduto' : `${daysRemaining} giorni`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContract(contract)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nessun contratto in scadenza"
              description="Non ci sono contratti in scadenza questo mese"
            />
          )}
        </CardContent>
      </Card>

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

export default ContractTimeline;
