// client_v3/src/pages/scouting/ReportDetailsModal.jsx
import React from 'react';
import { FileText, Calendar, Target, User, MapPin, Clock, Trophy, Star, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ui/dialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import { generateScoutingReportPDF } from '@/utils/pdfGenerator';

const ReportDetailsModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificato';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data non valida';
    }
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

  const exportToPDF = async () => {
    try {
      await generateScoutingReportPDF(report.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Errore nella generazione del PDF. Riprova più tardi.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={24} />
            Dettagli Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informazioni Prospect */}
          {report?.prospect && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Prospect Osservato</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nome:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {report.prospect.fullName || `${report.prospect.firstName || ''} ${report.prospect.lastName || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{getRoleLabel(report.prospect.mainPosition) || 'Non specificato'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dettagli Partita */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Dettagli Partita</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data partita:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(report?.matchDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avversario:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{report?.opponent || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Competizione:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{report?.competition || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo giocato:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getRoleLabel(report?.rolePlayed) || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Minuti giocati:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{report?.minutesPlayed ? `${report.minutesPlayed}'` : 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valutazioni Tecniche */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold">Valutazioni Tecniche</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Tecnica</label>
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 mr-1 text-yellow-500" />
                    <span className={`text-2xl font-bold ${getScoreColor(report?.techniqueScore)}`}>
                      {report?.techniqueScore ? `${report.techniqueScore}/10` : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Tattica</label>
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 mr-1 text-yellow-500" />
                    <span className={`text-2xl font-bold ${getScoreColor(report?.tacticsScore)}`}>
                      {report?.tacticsScore ? `${report.tacticsScore}/10` : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Fisico</label>
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 mr-1 text-yellow-500" />
                    <span className={`text-2xl font-bold ${getScoreColor(report?.physicalScore)}`}>
                      {report?.physicalScore ? `${report.physicalScore}/10` : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Mentalità</label>
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 mr-1 text-yellow-500" />
                    <span className={`text-2xl font-bold ${getScoreColor(report?.mentalityScore)}`}>
                      {report?.mentalityScore ? `${report.mentalityScore}/10` : '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Punteggio Totale */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Punteggio Totale</label>
                  <div className="flex items-center justify-center">
                    <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                    <span className={`text-3xl font-bold ${getScoreColor(report?.totalScore)}`}>
                      {report?.totalScore ? `${report.totalScore}/10` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Riassunto e Allegati */}
          {(report?.summary || report?.videoLink || report?.attachmentUrl) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-orange-600 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold">Note e Allegati</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report?.summary && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Riassunto Performance</label>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        {report.summary}
                      </p>
                    </div>
                  )}
                  
                  {(report?.videoLink || report?.attachmentUrl) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report?.videoLink && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Link Video</label>
                          <a 
                            href={report.videoLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {report.videoLink}
                          </a>
                        </div>
                      )}
                      {report?.attachmentUrl && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Allegato</label>
                          <a 
                            href={report.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {report.attachmentUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Esporta PDF
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailsModal;
