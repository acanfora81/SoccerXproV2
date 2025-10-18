import React from 'react';
import { User, Calendar, MapPin, Target, FileText, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/design-system/ds/ConfirmDialog";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";

const ProspectDetailsModal = ({ isOpen, onClose, prospect }) => {
  if (!isOpen || !prospect) return null;

  // Helper per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificato';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  // Helper per tradurre gli stati
  const getStatusLabel = (status) => {
    const labels = {
      DISCOVERY: 'Scoperta',
      MONITORING: 'Monitoraggio',
      ANALYZED: 'Analizzato',
      EVALUATED: 'Valutato',
      TARGETED: 'Obiettivo',
      SIGNED: 'Firmato',
      REJECTED: 'Rifiutato',
      ARCHIVED: 'Archiviato'
    };
    return labels[status] || status;
  };

  // Helper per i colori degli stati
  const getStatusColor = (status) => {
    const colors = {
      DISCOVERY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      MONITORING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      ANALYZED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      EVALUATED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      TARGETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      SIGNED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper per tradurre i ruoli
  const getPositionLabel = (position) => {
    const positions = {
      'GK': 'Portiere',
      'CB': 'Difensore Centrale',
      'FB': 'Terzino',
      'DM': 'Mediano',
      'CM': 'Centrocampista',
      'AM': 'Trequartista',
      'W': 'Ala',
      'CF': 'Attaccante'
    };
    return positions[position] || position;
  };

  // Helper per tradurre il piede preferito
  const getFootLabel = (foot) => {
    const feet = {
      'RIGHT': 'Destro',
      'LEFT': 'Sinistro',
      'BOTH': 'Ambidestro'
    };
    return feet[foot] || foot;
  };

  // Helper per tradurre il tipo di contratto
  const getContractTypeLabel = (type) => {
    const types = {
      'PRO': 'Professionale',
      'YOUTH': 'Giovanile',
      'AMATEUR': 'Dilettante',
      'FREE_AGENT': 'Svincolato'
    };
    return types[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={24} />
            Dettagli Prospect
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Informazioni Personali */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Informazioni Personali</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nome:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.firstName || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cognome:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.lastName || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data di nascita:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(prospect.birthDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Luogo di nascita:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.birthPlace || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nazionalità principale:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.nationalityPrimary || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Piede preferito:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getFootLabel(prospect.preferredFoot) || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profilo Calcistico */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Profilo Calcistico</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruolo principale:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getPositionLabel(prospect.mainPosition) || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ruoli secondari:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {prospect.secondaryPositions ? 
                      JSON.parse(prospect.secondaryPositions).map(pos => getPositionLabel(pos)).join(', ') 
                      : 'Non specificato'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Altezza (cm):</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.heightCm || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Peso (kg):</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.weightKg || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Apertura alare (cm):</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.wingspanCm || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Club e Contratto */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Club e Contratto</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Club attuale:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.currentClub || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lega:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.currentLeague || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paese del club:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.countryClub || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo contratto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getContractTypeLabel(prospect.contractType) || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Scadenza contratto:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(prospect.contractUntil)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valore di mercato:</label>
                  <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                    {prospect.marketValue ? `€${prospect.marketValue.toLocaleString('it-IT')}` : 'Non specificato'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valutazioni */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Valutazioni</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Punteggio generale:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.overallScore || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Punteggio potenziale:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.potentialScore || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Indice di rischio:</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{prospect.riskIndex || 'Non specificato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          {prospect.notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold">Note</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{prospect.notes}</p>
              </CardContent>
            </Card>
          )}

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

export default ProspectDetailsModal;
