import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Euro,
  User,
  Building2
} from "lucide-react";
import axios from "axios";
import useAuthStore from "../store/authStore";
import { formatItalianCurrency } from "../utils/italianNumbers";
import "../styles/contracts-summary.css";
// Rimosse KPI: nessun import di stili KPI
import "../styles/contracts-dashboard.css";
import "../styles/contracts.css";
import ContractSummaryKPI from "../components/contracts/ContractSummaryKPI";

export default function ContractsSummary() {
  const { user } = useAuthStore();
  const teamId = user?.teamId;

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/contracts-summary/summary?teamId=${teamId}`);
      setContracts(response.data.data || response.data);
    } catch (err) {
      setError("Errore nel caricamento dei contratti");
      console.error("Errore fetch contratti:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      
      const response = await axios.get(`/api/contracts-summary/export?teamId=${teamId}`, {
        responseType: 'blob'
      });
      
      // Crea un link per il download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `riepilogo-contratti-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError("Errore nell'esportazione Excel");
      console.error("Errore esportazione:", err);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchContracts();
    }
  }, [teamId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount) => {
    return formatItalianCurrency(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'EXPIRED': return 'status-expired';
      case 'DRAFT': return 'status-draft';
      case 'TERMINATED': return 'status-terminated';
      default: return 'status-default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'EXPIRED': return 'Scaduto';
      case 'DRAFT': return 'Bozza';
      case 'TERMINATED': return 'Terminato';
      default: return status;
    }
  };

  // Filtra i contratti
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.protocolNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Caricamento riepilogo contratti...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header (standard come nelle altre pagine) */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <FileText size={32} color="#3B82F6" />
            <div>
              <h1>Riepilogo Contratti</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
            <div className="upload-step-container">
              <div className="max-w-7xl mx-auto">
          {/* Main Card */}
          <div className="upload-card">
            {/* KPI Cards sopra i filtri */}
            {filteredContracts.length > 0 && (
              <ContractSummaryKPI contracts={filteredContracts} />
            )}

            {/* Error Display */}
            {error && (
              <div className="upload-error">
                <AlertTriangle size={20} color="#EF4444" />
                <div className="error-content">
                  <strong>Errore:</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Filtri e Azioni */}
            <div className="contracts-filters">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Cerca per nominativo o protocollo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-box">
                <Filter size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="ACTIVE">Attivi</option>
                  <option value="EXPIRED">Scaduti</option>
                  <option value="DRAFT">Bozze</option>
                  <option value="TERMINATED">Terminati</option>
                </select>
              </div>

              <div className="filter-box">
                <button
                  onClick={exportToExcel}
                  disabled={exporting || contracts.length === 0}
                  className="btn btn-excel"
                >
                  {exporting ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Esportazione...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Esporta in Excel
                    </>
                  )}
                </button>
              </div>

              <div className="filter-box">
                <button
                  onClick={fetchContracts}
                  className="btn btn-refresh"
                >
                  <RefreshCw size={20} />
                  Aggiorna
                </button>
              </div>
            </div>

            {/* KPI cards rimosse su richiesta */}

            {/* Tabella Contratti - Standardizzata come Lista Contratti */}
            {filteredContracts.length > 0 ? (
              <div className="table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th>Status</th>
                      <th>Scadenza</th>
                      <th>Stipendio Netto</th>
                      <th>Stipendio Lordo</th>
                      <th>Costo Azienda</th>
                      <th>Bonus Totali</th>
                      <th>Procuratore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract, index) => {
                      const totalBonuses = (contract.contractPremiums || 0) + 
                                         (contract.exitIncentive || 0) + 
                                         (contract.allowances || 0) + 
                                         (contract.imageRights || 0) + 
                                         (contract.accommodation || 0);
                      
                      const totalCompanyCost = (contract.grossSalary || 0) + 
                                              (contract.inpsContributions || 0) + 
                                              (contract.inailContributions || 0) + 
                                              (contract.ffcContributions || 0);
                      
                      return (
                        <tr key={index}>
                          <td>
                            <span className="player-name">
                              {contract.playerName || '-'}
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
                            <span className="period-value">
                              {formatDate(contract.endDate)}
                            </span>
                          </td>
                          <td>
                            <span className="salary-value">
                              {formatCurrency(contract.netTotal)}
                            </span>
                          </td>
                          <td>
                            <span className="salary-value">
                              {formatCurrency(contract.grossSalary)}
                            </span>
                          </td>
                          <td>
                            <span className="salary-value">
                              {formatCurrency(totalCompanyCost)}
                            </span>
                          </td>
                          <td>
                            <span className="salary-value">
                              {formatCurrency(totalBonuses)}
                            </span>
                          </td>
                          <td>
                            <span className="signed-value">{contract.agentName || '-'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun contratto trovato
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nessun contratto corrisponde ai filtri selezionati'
                    : 'Non ci sono contratti da visualizzare'
                  }
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="btn btn-primary"
                  >
                    Rimuovi filtri
                  </button>
                )}
              </div>
            )}

            
          </div>
        </div>
      </div>
    </div>
  );
}
