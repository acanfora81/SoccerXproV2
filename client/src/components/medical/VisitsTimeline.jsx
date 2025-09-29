// client/src/components/medical/VisitsTimeline.jsx
// Componente per la timeline delle visite mediche per mese

import { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  Clock,
  CheckCircle
} from 'lucide-react';

const VisitsTimeline = ({ data }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Formatta data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatta ora
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ottieni classe CSS per status
  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'SCHEDULED': return 'scheduled';
      case 'PENDING': return 'pending';
      case 'CANCELLED': return 'cancelled';
      default: return 'scheduled';
    }
  };

  // Traduce status in italiano
  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completata';
      case 'SCHEDULED': return 'Programmata';
      case 'PENDING': return 'In Attesa';
      case 'CANCELLED': return 'Annullata';
      default: return status;
    }
  };

  // Traduce tipo visita in italiano
  const getVisitTypeLabel = (type) => {
    switch (type) {
      case 'ROUTINE_CHECKUP': return 'Controllo di Routine';
      case 'INJURY_ASSESSMENT': return 'Valutazione Infortunio';
      case 'SPECIALIST_VISIT': return 'Visita Specialistica';
      case 'FITNESS_ASSESSMENT': return 'Valutazione Idoneità';
      case 'EMERGENCY': return 'Emergenza';
      case 'FOLLOW_UP': return 'Controllo Follow-up';
      default: return type;
    }
  };

  // Raggruppa visite per mese
  const groupVisitsByMonth = (visits) => {
    const grouped = {};
    
    visits?.forEach(visit => {
      const visitDate = new Date(visit.visitDate);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: visitDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
          visits: []
        };
      }
      
      grouped[monthKey].visits.push(visit);
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

  // Filtra visite per il mese corrente
  const getCurrentMonthVisits = () => {
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const grouped = groupVisitsByMonth(data);
    
    return grouped.find(group => {
      const groupMonthKey = `${new Date(group.visits[0]?.visitDate).getFullYear()}-${String(new Date(group.visits[0]?.visitDate).getMonth() + 1).padStart(2, '0')}`;
      return groupMonthKey === currentMonthKey;
    });
  };

  const currentMonthData = getCurrentMonthVisits();
  const groupedData = groupVisitsByMonth(data);

  return (
    <div className="timeline-container">
      {/* Header con navigazione */}
      <div className="timeline-header">
        <div className="timeline-title">
          <Calendar size={24} />
          <h3>Timeline Visite Mediche per Mese</h3>
        </div>
        
        <div className="timeline-navigation">
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="current-month">
            {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
          
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Dettagli mese corrente */}
      <div className="timeline-details">
        <h4>
          Visite Mediche - {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </h4>
        
        {currentMonthData ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Data e Ora</th>
                  <th>Giocatore</th>
                  <th>Tipo Visita</th>
                  <th>Medico</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthData.visits
                  .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))
                  .map((visit) => {
                    return (
                      <tr key={visit.id}>
                        <td>
                          <div className="date-content">
                            <Calendar size={16} />
                            <span>{formatDate(visit.visitDate)}</span>
                            <span className="time-info">{formatTime(visit.visitDate)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="player-info">
                            <User size={16} />
                            <span>{visit.player?.firstName} {visit.player?.lastName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="visit-type">
                            {getVisitTypeLabel(visit.visitType)}
                          </span>
                        </td>
                        <td>
                          <div className="doctor-info">
                            <Stethoscope size={16} />
                            <span>{visit.doctor || 'Non specificato'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="status-cell">
                            <span className={`status-badge ${getStatusClass(visit.status)}`}>
                              {getStatusClass(visit.status) === 'completed' && <CheckCircle size={14} />}
                              {getStatusClass(visit.status) === 'scheduled' && <Clock size={14} />}
                              {getStatusClass(visit.status) === 'pending' && <Clock size={14} />}
                              {getStatusClass(visit.status) === 'cancelled' && <Clock size={14} />}
                              {getStatusLabel(visit.status)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="visit-notes">
                            {visit.notes ? (visit.notes.length > 50 ? visit.notes.substring(0, 50) + '...' : visit.notes) : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Stethoscope size={48} className="empty-icon" />
            <p>Nessuna visita medica programmata questo mese</p>
          </div>
        )}
      </div>

      {/* Statistiche mese corrente */}
      {currentMonthData && (
        <div className="timeline-stats">
          <div className="stat-card">
            <div className="stat-value">{currentMonthData.visits.length}</div>
            <div className="stat-label">Visite Totali</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {currentMonthData.visits.filter(v => v.status === 'COMPLETED').length}
            </div>
            <div className="stat-label">Visite Completate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {currentMonthData.visits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').length}
            </div>
            <div className="stat-label">Visite in Attesa</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsTimeline;
