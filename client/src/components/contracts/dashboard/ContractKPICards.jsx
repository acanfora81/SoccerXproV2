// client/src/components/contracts/dashboard/ContractKPICards.jsx
// Componente per le metriche principali (KPI) della dashboard contratti

import { ICONS, ICON_SIZES } from '../../../config/icons-map';
import { formatItalianCurrency } from '../../../utils/italianNumbers';

const ContractKPICards = ({ data }) => {
  // Formatta valuta
  const formatCurrency = (amount, currency = 'EUR') => {
    return formatItalianCurrency(amount || 0, currency);
  };

  // Formatta numero
  const formatNumber = (num) => {
    return new Intl.NumberFormat('it-IT').format(num || 0);
  };

  // Calcola trend (positivo/negativo)
  const getTrendIcon = (trend) => {
    if (trend > 0) return (
      <ICONS.trendUp size={ICON_SIZES.sm} className="trend-up" />
    );
    if (trend < 0) return (
      <ICONS.trendDown size={ICON_SIZES.sm} className="trend-down" />
    );
    return (
      <ICONS.target size={ICON_SIZES.sm} className="trend-neutral" />
    );
  };

  const getTrendClass = (trend) => {
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  };

  // KPI Cards - Prime 6 per layout 3x2
  const kpiCards = [
    {
      id: 'totalValue',
      title: 'Valore Totale',
      value: formatCurrency(data.totalValue),
      subtitle: 'Contratti attivi',
      icon: ICONS.export,
      trend: data.totalValueTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'primary'
    },
    {
      id: 'activeContracts',
      title: 'Contratti Attivi',
      value: formatNumber(data.activeContracts),
      subtitle: 'Giocatori sotto contratto',
      icon: ICONS.players,
      trend: data.activeContractsTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'success'
    },
    {
      id: 'expiringContracts',
      title: 'In Scadenza',
      value: formatNumber(data.expiringContracts),
      subtitle: 'Prossimi 90 giorni',
      icon: ICONS.warning,
      trend: data.expiringContractsTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'warning'
    },
    {
      id: 'averageSalary',
      title: 'Stipendio Medio',
      value: formatCurrency(data.averageSalary),
      subtitle: 'Per giocatore attivo',
      icon: ICONS.trendUp,
      trend: data.averageSalaryTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'info'
    },
    {
      id: 'renewalsThisMonth',
      title: 'Rinnovi Mese',
      value: formatNumber(data.renewalsThisMonth),
      subtitle: 'Contratti rinnovati',
      icon: ICONS.target,
      trend: data.renewalsThisMonthTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'success'
    },
    {
      id: 'pendingRenewals',
      title: 'Rinnovi Sospesi',
      value: formatNumber(data.pendingRenewals),
      subtitle: 'Da gestire',
      icon: ICONS.time,
      trend: data.pendingRenewalsTrend || 0,
      trendLabel: 'vs mese scorso',
      color: 'warning'
    }
  ];

  return (
    <div className="kpi-cards-grid">
      {kpiCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.id} className={`kpi-card kpi-card--${card.color}`}>
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <IconComponent size={ICON_SIZES.md} />
              </div>
              <span className="kpi-card__title">{card.title}</span>
              <div className="kpi-card__trend">
                {getTrendIcon(card.trend)}
                <span className={`trend-value ${getTrendClass(card.trend)}`}>
                  {Math.abs(card.trend)}%
                </span>
              </div>
            </div>
            
            <div className="kpi-card__content">
              <div className="kpi-card__value">{card.value}</div>
              <div className="kpi-card__subtitle">{card.subtitle}</div>
            </div>
            
            <div className="kpi-card__footer">
              <span className="trend-label">{card.trendLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContractKPICards;
