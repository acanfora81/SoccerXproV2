// client/src/components/medical/VisitsKPICards.jsx
// KPI Cards per la pagina Visite Mediche

import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  User,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const VisitsKPICards = ({ data = [] }) => {
  // Calcola le statistiche
  const stats = {
    totalVisits: data.length,
    todayVisits: data.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      const today = new Date();
      return visitDate.toDateString() === today.toDateString();
    }).length,
    pendingVisits: data.filter(visit => visit.status === 'SCHEDULED' || visit.status === 'PENDING').length,
    completedVisits: data.filter(visit => visit.status === 'COMPLETED').length,
    thisMonthVisits: data.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      const now = new Date();
      return visitDate.getMonth() === now.getMonth() && 
             visitDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Calcola trend mensile (confronto con mese precedente)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastMonthVisits = data.filter(visit => {
    const visitDate = new Date(visit.visitDate);
    return visitDate.getMonth() === lastMonth.getMonth() && 
           visitDate.getFullYear() === lastMonth.getFullYear();
  }).length;

  const monthlyTrend = lastMonthVisits > 0 
    ? ((stats.thisMonthVisits - lastMonthVisits) / lastMonthVisits * 100)
    : 0;

  const kpiCards = [
    {
      title: 'Visite Totali',
      value: stats.totalVisits,
      subtitle: 'Tutte le visite registrate',
      icon: Stethoscope,
      trend: null
    },
    {
      title: 'Visite di Oggi',
      value: stats.todayVisits,
      subtitle: 'Visite programmate oggi',
      icon: Calendar,
      trend: null
    },
    {
      title: 'In Attesa',
      value: stats.pendingVisits,
      subtitle: 'Visite da completare',
      icon: Clock,
      trend: null
    },
    {
      title: 'Completate',
      value: stats.completedVisits,
      subtitle: 'Visite eseguite',
      icon: CheckCircle,
      trend: null
    },
    {
      title: 'Questo Mese',
      value: stats.thisMonthVisits,
      subtitle: 'Visite del mese corrente',
      icon: User,
      trend: monthlyTrend
    }
  ];

  return (
    <div className="kpi-cards-grid">
      {kpiCards.map((card, index) => {
        const IconComponent = card.icon;

        return (
          <div key={index} className="kpi-card">
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <IconComponent size={24} />
              </div>
            </div>
            
            <div className="kpi-card__content">
              <div className="kpi-card__value">{card.value}</div>
              <div className="kpi-card__title">{card.title}</div>
              <div className="kpi-card__subtitle">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VisitsKPICards;
