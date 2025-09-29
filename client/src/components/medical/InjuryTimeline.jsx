// client/src/components/medical/InjuryTimeline.jsx
// Componente per la timeline degli infortuni per mese

import { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Activity
} from 'lucide-react';

const InjuryTimeline = ({ data }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Formatta data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcola durata infortunio in giorni
  const getInjuryDurationDays = (injuryDate, expectedReturn) => {
    const start = new Date(injuryDate);
    const end = expectedReturn ? new Date(expectedReturn) : new Date(); // Se non c'è data fine, usa oggi
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 per includere entrambi i giorni
    return diffDays;
  };


  // Ottieni classe CSS per gravità
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'SEVERE': return 'severe';
      case 'MODERATE': return 'moderate';
      case 'MINOR': return 'minor';
      default: return 'minor';
    }
  };

  // Traduce gravità in italiano
  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'SEVERE': return 'Grave';
      case 'MODERATE': return 'Moderata';
      case 'MINOR': return 'Lieve';
      default: return severity;
    }
  };

  // Traduce tipo infortunio in italiano
  const getInjuryTypeLabel = (type) => {
    switch (type) {
      case 'MUSCLE_STRAIN': return 'Stiramento Muscolare';
      case 'LIGAMENT_TEAR': return 'Lesione Legamentosa';
      case 'BONE_FRACTURE': return 'Frattura Ossea';
      case 'CONCUSSION': return 'Commozione Cerebrale';
      case 'BRUISE': return 'Contusione';
      case 'CUT': return 'Taglio';
      case 'SPRAIN': return 'Distorsione';
      case 'OVERUSE': return 'Sovraccarico';
      case 'OTHER': return 'Altro';
      default: return type;
    }
  };

  // Traduce parte del corpo in italiano
  const getBodyPartLabel = (bodyPart) => {
    switch (bodyPart) {
      case 'HEAD': return 'Testa';
      case 'NECK': return 'Collo';
      case 'SHOULDER': return 'Spalla';
      case 'ARM': return 'Braccio';
      case 'ELBOW': return 'Gomito';
      case 'WRIST': return 'Polso';
      case 'HAND': return 'Mano';
      case 'CHEST': return 'Torace';
      case 'BACK': return 'Schiena';
      case 'HIP': return 'Anca';
      case 'THIGH': return 'Coscia';
      case 'KNEE': return 'Ginocchio';
      case 'CALF': return 'Polpaccio';
      case 'ANKLE': return 'Caviglia';
      case 'FOOT': return 'Piede';
      case 'OTHER': return 'Altro';
      default: return bodyPart;
    }
  };

  // Traduce status in italiano
  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Attivo';
      case 'RECOVERING': return 'In Recupero';
      case 'HEALED': return 'Guarito';
      case 'CHRONIC': return 'Cronico';
      default: return status;
    }
  };

  // Raggruppa infortuni per mese
  const groupInjuriesByMonth = (injuries) => {
    const grouped = {};
    
    injuries?.forEach(injury => {
      const injuryDate = new Date(injury.injuryDate);
      const monthKey = `${injuryDate.getFullYear()}-${String(injuryDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: injuryDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
          injuries: []
        };
      }
      
      grouped[monthKey].injuries.push(injury);
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

  // Filtra infortuni per il mese corrente
  const getCurrentMonthInjuries = () => {
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const grouped = groupInjuriesByMonth(data);
    
    return grouped.find(group => {
      const groupMonthKey = `${new Date(group.injuries[0]?.injuryDate).getFullYear()}-${String(new Date(group.injuries[0]?.injuryDate).getMonth() + 1).padStart(2, '0')}`;
      return groupMonthKey === currentMonthKey;
    });
  };

  const currentMonthData = getCurrentMonthInjuries();
  const groupedData = groupInjuriesByMonth(data);

  return (
    <div className="timeline-container">
      {/* Header con navigazione */}
      <div className="timeline-header">
        <div className="timeline-title">
          <Calendar size={24} />
          <h3>Timeline Infortuni per Mese</h3>
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
          Infortuni - {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </h4>
        
        {currentMonthData ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Data Inizio</th>
                  <th>Giocatore</th>
                  <th>Tipo Infortunio</th>
                  <th>Parte del Corpo</th>
                  <th>Gravità</th>
                  <th>Status</th>
                  <th>Durata</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthData.injuries
                  .sort((a, b) => new Date(b.injuryDate) - new Date(a.injuryDate))
                  .map((injury) => {
                    const durationDays = getInjuryDurationDays(injury.injuryDate, injury.expectedReturn);
                    
                    return (
                      <tr key={injury.id}>
                        <td>
                          <div className="date-content">
                            <Calendar size={16} />
                            <span>{formatDate(injury.injuryDate)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="player-info">
                            <User size={16} />
                            <span>{injury.players?.firstName} {injury.players?.lastName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="injury-type">
                            {getInjuryTypeLabel(injury.injuryType)}
                          </span>
                        </td>
                        <td>
                          <span className="body-part">
                            {getBodyPartLabel(injury.bodyPart)}
                          </span>
                        </td>
                        <td>
                          <span className={`severity-badge ${getSeverityClass(injury.severity)}`}>
                            <AlertTriangle size={14} />
                            {getSeverityLabel(injury.severity)}
                          </span>
                        </td>
                        <td>
                          <div className="status-cell">
                            <span className={`status-badge ${injury.status.toLowerCase()}`}>
                              {getStatusLabel(injury.status)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="duration-days">
                            {durationDays} {durationDays === 1 ? 'giorno' : 'giorni'}
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
            <Activity size={48} className="empty-icon" />
            <p>Nessun infortunio registrato questo mese</p>
          </div>
        )}
      </div>

      {/* Statistiche mese corrente */}
      {currentMonthData && (
        <div className="timeline-stats">
          <div className="stat-card">
            <div className="stat-value">{currentMonthData.injuries.length}</div>
            <div className="stat-label">Infortuni Totali</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {currentMonthData.injuries.filter(i => i.severity === 'SEVERE').length}
            </div>
            <div className="stat-label">Infortuni Gravi</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {currentMonthData.injuries.filter(i => i.status === 'ACTIVE').length}
            </div>
            <div className="stat-label">Infortuni Attivi</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InjuryTimeline;
