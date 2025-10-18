// client_v3/src/pages/scouting/ReportsPage.jsx
import React, { useEffect, useState } from 'react';
import { FileText, Plus, Eye, Calendar, Target, Search, Pencil, Trash2, Activity, Download } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import GlobalLoader from '@/components/ui/GlobalLoader';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import ReportCreateModal from './ReportCreateModal';
import ReportDetailsModal from './ReportDetailsModal';
import { apiFetch } from '@/utils/apiClient';
import { generateScoutingReportPDF } from '@/utils/pdfGenerator';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, report: null });
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    prospectId: '',
    competition: '',
    matchDateFrom: '',
    matchDateTo: '',
    minTotalScore: '',
    maxTotalScore: ''
  });

  // Helper functions
  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500 dark:text-gray-400';
    
    if (score >= 0 && score < 6) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    } else if (score >= 6 && score < 8) {
      return 'text-orange-600 dark:text-orange-400 font-semibold';
    } else if (score >= 8 && score <= 10) {
      return 'text-green-600 dark:text-green-400 font-semibold';
    }
    
    return 'text-gray-500 dark:text-gray-400';
  };

  const getRoleLabel = (role) => {
    const roles = {
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'FB': 'Terzino',
      'DM': 'Mediano',
      'CM': 'Centrocampista',
      'AM': 'Trequartista',
      'W': 'Ala',
      'CF': 'Attaccante'
    };
    return roles[role] || role;
  };

  const loadReports = async () => {
      try {
        setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('q', filters.search);
      if (filters.prospectId) queryParams.append('prospectId', filters.prospectId);
      if (filters.competition) queryParams.append('competition', filters.competition);
      if (filters.matchDateFrom) queryParams.append('matchDateFrom', filters.matchDateFrom);
      if (filters.matchDateTo) queryParams.append('matchDateTo', filters.matchDateTo);
      if (filters.minTotalScore) queryParams.append('minTotalScore', filters.minTotalScore);
      if (filters.maxTotalScore) queryParams.append('maxTotalScore', filters.maxTotalScore);
      
      const url = `/scouting/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const json = await apiFetch(url);
        const data = Array.isArray(json?.data) ? json.data : json;
        setRows(data || []);
      } catch (e) {
        setError(e?.message || 'Errore caricamento');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadReports();
  }, [filters]);

  // Action handlers
  const handleCreateReport = () => {
    setEditingReport(null);
    setModalOpen(true);
  };

  const handleViewReport = (report) => {
    setViewingReport(report);
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setModalOpen(true);
  };

  const handleDeleteReport = async (report) => {
    try {
      setDeleting(true);
      await apiFetch(`/scouting/reports/${report.id}`, {
        method: 'DELETE'
      });
      await loadReports();
      setDeleteConfirm({ isOpen: false, report: null });
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, report: null });
  };

  const handleModalSuccess = () => {
    loadReports();
  };

  const exportReportToPDF = async (report) => {
    try {
      await generateScoutingReportPDF(report.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Errore nella generazione del PDF. Riprova più tardi.');
    }
  };

  if (loading) return <GlobalLoader />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Scouting"
        subtitle="Valutazioni tecniche e analisi dei giocatori"
        actions={
          <Button variant="primary" onClick={handleCreateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Report
          </Button>
        }
      />

      {/* Filtri */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ricerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="prospect, avversario, competizione..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Competizione</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Serie A, Champions..."
                value={filters.competition}
                onChange={(e) => setFilters({...filters, competition: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Punteggio Min</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                value={filters.minTotalScore}
                onChange={(e) => setFilters({...filters, minTotalScore: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Punteggio Max</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10.0"
                value={filters.maxTotalScore}
                onChange={(e) => setFilters({...filters, maxTotalScore: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Da</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.matchDateFrom}
                onChange={(e) => setFilters({...filters, matchDateFrom: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data A</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.matchDateTo}
                onChange={(e) => setFilters({...filters, matchDateTo: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Reports */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report ({rows.length})</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prospect</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Partita</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avversario</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Competizione</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tecnica</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tattica</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fisico</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentale</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Totale</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {r.prospect?.fullName || `${r.prospect?.firstName || ''} ${r.prospect?.lastName || ''}`.trim() || 'N/A'}
                        </div>
                        {r.prospect?.mainPosition && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getRoleLabel(r.prospect.mainPosition)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {r.matchDate ? (
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(r.matchDate).toLocaleDateString('it-IT')}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {r.opponent || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">
                      {r.competition || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.techniqueScore ? (
                        <span className={getScoreColor(r.techniqueScore)}>
                          {r.techniqueScore}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.tacticsScore ? (
                        <span className={getScoreColor(r.tacticsScore)}>
                          {r.tacticsScore}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.physicalScore ? (
                        <span className={getScoreColor(r.physicalScore)}>
                          {r.physicalScore}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.mentalityScore ? (
                        <span className={getScoreColor(r.mentalityScore)}>
                          {r.mentalityScore}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {r.totalScore ? (
                        <div className="flex items-center justify-center">
                          <Target className="h-4 w-4 mr-1 text-gray-400" />
                          <span className={getScoreColor(r.totalScore)}>
                            {r.totalScore}/10
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewReport(r)}
                          className="btn-action btn-view"
                          title="Visualizza"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportReportToPDF(r)}
                          className="btn-action btn-success"
                          title="Esporta PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditReport(r)}
                          className="btn-action btn-edit"
                          title="Modifica"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, report: r })}
                          className="btn-action btn-delete"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                    <td className="px-6 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={10}>
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg font-medium">Nessun report trovato</p>
                        <p className="text-sm">Crea il tuo primo report per iniziare</p>
                      </div>
                    </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </CardContent>
      </Card>

      {/* Modali */}
      <ReportCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingReport={editingReport}
      />

      <ReportDetailsModal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        report={viewingReport}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={() => handleDeleteReport(deleteConfirm.report)}
        title="Conferma Eliminazione"
        message={`Sei sicuro di voler eliminare il report per ${deleteConfirm.report?.prospect?.fullName || 'questo prospect'}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}




