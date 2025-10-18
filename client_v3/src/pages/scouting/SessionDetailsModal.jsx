import React from 'react';
import { Activity, Calendar, MapPin, Target, FileText, Clock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ui/dialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import FormationView from '@/modules/scouting/components/FormationView';

const SessionDetailsModal = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null;

  // Debug log per vedere cosa riceve la modale
  console.log('SessionDetailsModal received session:', session);

  // Helper per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificato';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data non valida';
    }
  };

  // Helper per tradurre il tipo di osservazione
  const getObservationTypeLabel = (type) => {
    const types = {
      'LIVE': 'Partita Live',
      'VIDEO': 'Video',
      'TRAINING': 'Allenamento',
      'TOURNAMENT': 'Torneo'
    };
    return types[type] || type;
  };

  // Helper per tradurre i ruoli
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

  const getRatingColor = (rating) => {
    if (!rating) return 'text-gray-500 dark:text-gray-400';
    
    if (rating >= 0 && rating < 6) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    } else if (rating >= 6 && rating < 8) {
      return 'text-orange-600 dark:text-orange-400 font-semibold';
    } else if (rating >= 8 && rating <= 10) {
      return 'text-green-600 dark:text-green-400 font-semibold';
    }
    
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity size={24} />
            Dettagli Sessione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informazioni Prospect */}
          {session?.prospect && (
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
                      {session.prospect.fullName || `${session.prospect.firstName || ''} ${session.prospect.lastName || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo:</label>
                    <p className="text-gray-900 dark:text-white font-semibold">{getRoleLabel(session.prospect.mainPosition) || 'Non specificato'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informazioni Generali */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Informazioni Generali</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo osservazione:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getObservationTypeLabel(session?.observationType) || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data osservazione:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(session?.dateObserved)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Luogo:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{session?.location || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avversario:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{session?.opponent || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Competizione:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{session?.competition || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dettagli Partita */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Dettagli Partita</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Minuti giocati:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{session?.minutesPlayed || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo giocato:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getRoleLabel(session?.rolePlayed) || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valutazione:</label>
                  <p className={`text-lg ${getRatingColor(session?.rating)}`}>
                    {session?.rating ? `${session.rating}/10` : 'Non specificato'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          {session?.notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Note</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{session.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Formazioni */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Formazioni</h3>
              </div>
            </CardHeader>
            <CardContent>
              <FormationView 
                sessionId={session.id} 
                prospectTeamSide={session.prospectTeamSide || 'HOME'} 
              />
            </CardContent>
          </Card>

          {/* Footer con bottone Chiudi */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 pr-4">
            <Button variant="secondary" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
