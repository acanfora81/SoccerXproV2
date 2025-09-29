// client/src/components/medical/InjuryKPICards.jsx
// KPI Cards per la pagina Infortuni

import { 
  Activity, 
  AlertTriangle, 
  User, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const InjuryKPICards = ({ data = [] }) => {
  // Calcola le statistiche
  const stats = {
    totalInjuries: data.length,
    activeInjuries: data.filter(injury => injury.status === 'ACTIVE').length,
    severeInjuries: data.filter(injury => injury.severity === 'SEVERE').length,
    moderateInjuries: data.filter(injury => injury.severity === 'MODERATE').length,
    minorInjuries: data.filter(injury => injury.severity === 'MINOR').length,
    thisMonthInjuries: data.filter(injury => {
      const injuryDate = new Date(injury.injuryDate);
      const now = new Date();
      return injuryDate.getMonth() === now.getMonth() && 
             injuryDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Calcola trend mensile (confronto con mese precedente)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastMonthInjuries = data.filter(injury => {
    const injuryDate = new Date(injury.injuryDate);
    return injuryDate.getMonth() === lastMonth.getMonth() && 
           injuryDate.getFullYear() === lastMonth.getFullYear();
  }).length;

  const monthlyTrend = lastMonthInjuries > 0 
    ? ((stats.thisMonthInjuries - lastMonthInjuries) / lastMonthInjuries * 100)
    : 0;

  // Ordine: prima riga (3): Totali, Attivi, Questo Mese
  // seconda riga (3): Gravi, Media, Lievi
  const kpiCards = [
    {
      title: 'Infortuni Totali',
      value: stats.totalInjuries,
      subtitle: 'Tutti gli infortuni registrati',
      icon: Activity,
      trend: null
    },
    {
      title: 'Infortuni Attivi',
      value: stats.activeInjuries,
      subtitle: 'Infortuni in corso',
      icon: AlertTriangle,
      trend: null
    },
    {
      title: 'Questo Mese',
      value: stats.thisMonthInjuries,
      subtitle: 'Infortuni del mese corrente',
      icon: Calendar,
      trend: monthlyTrend
    },
    {
      title: 'Infortuni Lievi',
      value: stats.minorInjuries,
      subtitle: 'Gravità lieve',
      icon: User,
      trend: null
    },
    {
      title: 'Infortuni di Media entità',
      value: stats.moderateInjuries,
      subtitle: 'Gravità moderata',
      icon: Activity,
      trend: null
    },
    {
      title: 'Infortuni Gravi',
      value: stats.severeInjuries,
      subtitle: 'Gravità elevata',
      icon: AlertTriangle,
      trend: null
    }
  ];

  return (
    <div className="kpi-cards-grid">
      {kpiCards.map((card, index) => {
        const IconComponent = card.icon;
        const TrendIcon = card.trend !== null 
          ? (card.trend >= 0 ? TrendingUp : TrendingDown)
          : null;

        return (
          <div key={index} className="kpi-card">
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <IconComponent size={24} />
              </div>
              {TrendIcon && card.trend !== null && (
                <div className="trend-value">
                  <TrendIcon size={16} />
                  <span>{Math.abs(card.trend).toFixed(1)}%</span>
                </div>
              )}
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

export default InjuryKPICards;
