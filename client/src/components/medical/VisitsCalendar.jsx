// client/src/components/medical/VisitsCalendar.jsx
// Componente calendario per visualizzare le visite mediche

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';

const VisitsCalendar = ({ data = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Formatta data
  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', {
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
      case 'ROUTINE_CHECKUP': return 'Controllo';
      case 'INJURY_ASSESSMENT': return 'Infortunio';
      case 'SPECIALIST_VISIT': return 'Specialista';
      case 'FITNESS_ASSESSMENT': return 'Idoneità';
      case 'EMERGENCY': return 'Emergenza';
      case 'FOLLOW_UP': return 'Follow-up';
      default: return type;
    }
  };

  // Genera i giorni del mese
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calcola il primo giorno della griglia (lunedì della prima settimana)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Inizia da lunedì
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    const days = [];
    const current = new Date(startDate);
    
    // Genera 42 giorni (6 settimane)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Raggruppa visite per data
  const visitsByDate = useMemo(() => {
    const grouped = {};
    data.forEach(visit => {
      const date = new Date(visit.visitDate);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(visit);
    });
    return grouped;
  }, [data]);

  // Naviga tra i mesi
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Verifica se una data ha visite
  const hasVisits = (date) => {
    return visitsByDate[date.toDateString()]?.length > 0;
  };

  // Ottieni visite per una data
  const getVisitsForDate = (date) => {
    return visitsByDate[date.toDateString()] || [];
  };

  // Verifica se una data è oggi
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Verifica se una data è del mese corrente
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="visits-calendar">
      {/* Header del calendario */}
      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar size={24} />
          <h3>Calendario Visite Mediche</h3>
        </div>
        
        <div className="calendar-navigation">
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <button 
            className="nav-btn"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Griglia del calendario */}
      <div className="calendar-grid">
        {/* Header dei giorni della settimana */}
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        {/* Giorni del calendario */}
        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const visits = getVisitsForDate(day);
            const hasVisitsToday = hasVisits(day);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day);

            return (
              <div 
                key={index} 
                className={`calendar-day ${!isCurrentMonthDate ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${hasVisitsToday ? 'has-visits' : ''}`}
              >
                <div className="day-number">{day.getDate()}</div>
                
                {hasVisitsToday && (
                  <div className="visits-indicators">
                    {visits.slice(0, 3).map((visit, visitIndex) => (
                      <div 
                        key={visitIndex} 
                        className={`visit-indicator ${getStatusClass(visit.status)}`}
                        title={`${getVisitTypeLabel(visit.visitType)} - ${visit.player?.firstName} ${visit.player?.lastName} - ${formatTime(visit.visitDate)}`}
                      >
                        <div className="visit-time">{formatTime(visit.visitDate)}</div>
                        <div className="visit-player">{visit.player?.firstName}</div>
                      </div>
                    ))}
                    {visits.length > 3 && (
                      <div className="more-visits">+{visits.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color scheduled"></div>
          <span>Programmata</span>
        </div>
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span>In Attesa</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completata</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cancelled"></div>
          <span>Annullata</span>
        </div>
      </div>
    </div>
  );
};

export default VisitsCalendar;
