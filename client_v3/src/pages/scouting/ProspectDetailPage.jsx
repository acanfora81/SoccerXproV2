import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Target, FileText, Activity, User, Clock } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import GlobalLoader from '@/components/ui/GlobalLoader';
import { apiFetch } from '@/utils/apiClient';

export default function ProspectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prospect, setProspect] = useState(null);
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[ProspectDetailPage] Loading prospect data for ID:', id);
      console.log('[ProspectDetailPage] Full URL:', `/scouting/prospects/${id}`);
      
      // Carica solo i dati del prospect per ora
      const prospectRes = await apiFetch(`/scouting/prospects/${id}`);
      console.log('[ProspectDetailPage] Prospect data loaded successfully:', prospectRes);
      
      setProspect(prospectRes.data || prospectRes);
      setEvents([]); // Temporaneamente vuoto
      setReports([]); // Temporaneamente vuoto  
      setSessions([]); // Temporaneamente vuoto
    } catch (e) {
      console.error('[ProspectDetailPage] Error loading prospect:', e);
      setError(e?.message || 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <GlobalLoader />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!prospect) return <div className="p-4 text-gray-600">Prospect non trovato</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={prospect.fullName || `${prospect.firstName} ${prospect.lastName}`}
        subtitle={
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(prospect.status)}`}>
              {prospect.status}
            </span>
            {prospect.mainPosition && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {prospect.mainPosition}
              </span>
            )}
            {prospect.currentClub && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {prospect.currentClub}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/dashboard/scouting/prospects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Button>
            {prospect.status === 'TARGETED' && (
              <Button variant="success" onClick={async () => {
                try {
                  await apiFetch(`/scouting/prospects/${id}/promote`, {
                    method: 'POST',
                    body: JSON.stringify({ force: true, targetPriority: 3 })
                  });
                  alert('Prospect promosso a Target');
                  await loadData();
                } catch (e) {
                  alert(e?.message || 'Errore promozione');
                }
              }}>
                <Target className="h-4 w-4 mr-2" />
                Promuovi a Target
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informazioni Principali */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dati Anagrafici */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informazioni Personali
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                    <div className="text-gray-900 dark:text-white font-medium">{prospect.firstName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cognome</label>
                    <div className="text-gray-900 dark:text-white font-medium">{prospect.lastName}</div>
                  </div>
                  {prospect.birthDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data nascita</label>
                      <div className="text-gray-900 dark:text-white font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(prospect.birthDate).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {prospect.birthPlace && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Luogo nascita</label>
                      <div className="text-gray-900 dark:text-white font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {prospect.birthPlace}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {prospect.nationalityPrimary && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nazionalità</label>
                      <div className="text-gray-900 dark:text-white font-medium">{prospect.nationalityPrimary}</div>
                    </div>
                  )}
                  {prospect.mainPosition && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ruolo principale</label>
                      <div className="text-gray-900 dark:text-white font-medium">{prospect.mainPosition}</div>
                    </div>
                  )}
                  {prospect.currentClub && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Club attuale</label>
                      <div className="text-gray-900 dark:text-white font-medium">{prospect.currentClub}</div>
                    </div>
                  )}
                  {prospect.marketValue && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valore mercato</label>
                      <div className="text-gray-900 dark:text-white font-medium">€{prospect.marketValue.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
              {prospect.notes && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Note</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    {prospect.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report ({reports.length})
              </h2>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.opponent && `vs ${report.opponent}`}
                            {report.competition && ` - ${report.competition}`}
                          </div>
                          {report.matchDate && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(report.matchDate).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          {report.totalScore && (
                            <div className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                              Punteggio: {report.totalScore}/100
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(report.createdAt)}
                        </div>
                      </div>
                      {report.summary && (
                        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 p-3 rounded">
                          {report.summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nessun report disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessioni */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Sessioni ({sessions.length})
              </h2>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {session.observationType || 'LIVE'}
                            {session.location && ` - ${session.location}`}
                          </div>
                          {session.dateObserved && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(session.dateObserved).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          <div className="text-sm mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${session.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(session.createdAt)}
                        </div>
                      </div>
                      {session.notes && (
                        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 p-3 rounded">
                          {session.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nessuna sessione disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Azioni Rapide */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Azioni Rapide</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/scouting/sessions?prospectId=${id}`)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Nuova Sessione
                </Button>
                <Button
                  variant="info"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/scouting/reports?prospectId=${id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nuovo Report
                </Button>
                {prospect.status === 'TARGETED' && (
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await apiFetch(`/scouting/prospects/${id}/promote`, {
                          method: 'POST',
                          body: JSON.stringify({ force: true, targetPriority: 3 })
                        });
                        alert('Prospect promosso a Target');
                        await loadData();
                      } catch (e) {
                        alert(e?.message || 'Errore promozione');
                      }
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Promuovi a Target
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cronologia Eventi */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cronologia Eventi</h3>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {event.action}
                          </div>
                          {event.description && (
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </div>
                          )}
                          {event.fromStatus && event.toStatus && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {event.fromStatus} → {event.toStatus}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nessun evento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
