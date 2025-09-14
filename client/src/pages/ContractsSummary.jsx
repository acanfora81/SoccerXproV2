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
import "../styles/contracts.css";

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
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
      {/* Header */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <FileText size={32} color="#3B82F6" />
            <div>
              <h1>Riepilogo Contratti</h1>
              <p>Visualizza e gestisci il riepilogo completo di tutti i contratti</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
            <div className="upload-step-container">
              <div className="max-w-7xl mx-auto">
          {/* Main Card */}
          <div className="upload-card">
            <div className="upload-card-header">
              <div className="upload-icon">
                <Building2 size={48} color="#3B82F6" />
              </div>
              <h2>Riepilogo Contratti</h2>
              <p>Tabella completa con tutti i dati economici e fiscali dei contratti</p>
            </div>

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
                  className="btn btn-primary export-btn"
                >
                  {exporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Esportazione...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Esporta Excel
                    </>
                  )}
                </button>
              </div>

              <div className="filter-box">
                <button
                  onClick={fetchContracts}
                  className="btn btn-outline"
                >
                  <RefreshCw size={16} />
                  Aggiorna
                </button>
              </div>
            </div>

            {/* Tabella Contratti */}
            {filteredContracts.length > 0 ? (
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="contracts-summary-table">
                    <thead>
                      <tr>
                        <th>Protocollo</th>
                        <th>STATUS</th>
                        <th>Nominativo</th>
                        <th>Data di nascita</th>
                        <th>Data scadenza contratto</th>
                        <th>NETTO COMPRENSIVO DI INDENNITA' DI TRASFERTA</th>
                        <th>Emolumenti CONTRATTI</th>
                        <th colSpan="3">Costo aziendale</th>
                        <th>Premi contratto</th>
                        <th>INCENTIVO ALL'ESODO</th>
                        <th>Indennità</th>
                        <th>Diritti d'immagine</th>
                        <th>ALLOGGIO</th>
                        <th>PROCURATORE</th>
                      </tr>
                      <tr className="sub-header">
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th>Contributi INPS</th>
                        <th>Contributi INAIL</th>
                        <th>FFC</th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract, index) => (
                        <tr key={index} className="contract-row">
                          <td className="protocol-cell">
                            <span className="protocol-number">{contract.protocolNumber || '-'}</span>
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge ${getStatusColor(contract.status)}`}>
                              {getStatusLabel(contract.status)}
                            </span>
                          </td>
                          <td className="player-cell">
                            <div className="player-info">
                              <User size={16} className="player-icon" />
                              <span className="player-name">{contract.playerName || '-'}</span>
                            </div>
                          </td>
                          <td className="date-cell">
                            <div className="date-info">
                              <Calendar size={16} className="date-icon" />
                              <span>{formatDate(contract.birthDate)}</span>
                            </div>
                          </td>
                          <td className="date-cell">
                            <div className="date-info">
                              <Calendar size={16} className="date-icon" />
                              <span>{formatDate(contract.endDate)}</span>
                            </div>
                          </td>
                          <td className="amount-cell net-amount">
                            <div className="amount-info">
                              <Euro size={16} className="amount-icon" />
                              <span className="amount-value">{formatCurrency(contract.netTotal)}</span>
                            </div>
                          </td>
                          <td className="amount-cell gross-amount">
                            <div className="amount-info">
                              <Euro size={16} className="amount-icon" />
                              <span className="amount-value">{formatCurrency(contract.grossSalary)}</span>
                            </div>
                          </td>
                          <td className="amount-cell inps-amount">
                            <span className="amount-value">{formatCurrency(contract.inpsContributions)}</span>
                          </td>
                          <td className="amount-cell inail-amount">
                            <span className="amount-value">{formatCurrency(contract.inailContributions)}</span>
                          </td>
                          <td className="amount-cell ffc-amount">
                            <span className="amount-value">{formatCurrency(contract.ffcContributions)}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(contract.contractPremiums)}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(contract.exitIncentive)}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(contract.allowances)}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(contract.imageRights)}</span>
                          </td>
                          <td className="amount-cell">
                            <span className="amount-value">{formatCurrency(contract.accommodation)}</span>
                          </td>
                          <td className="agent-cell">
                            <span className="agent-name">{contract.agentName || '-'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

            {/* Statistiche */}
            {filteredContracts.length > 0 && (
              <div className="summary-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Contratti Totali</div>
                    <div className="stat-value">{filteredContracts.length}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Valore Netto</div>
                    <div className="stat-value">
                      {formatCurrency(filteredContracts.reduce((sum, c) => sum + (c.netTotal || 0), 0))}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Tasse Totali</div>
                    <div className="stat-value">
                      {formatCurrency(filteredContracts.reduce((sum, c) => 
                        sum + (c.inpsContributions || 0) + (c.inailContributions || 0) + (c.ffcContributions || 0), 0
                      ))}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Valore Lordo</div>
                    <div className="stat-value">
                      {formatCurrency(filteredContracts.reduce((sum, c) => sum + (c.grossSalary || 0), 0))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
