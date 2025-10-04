// client_v3/src/features/contracts/components/dashboard/ContractKPICards.jsx
// Componente per le metriche principali (KPI) della dashboard contratti

import { ICONS, ICON_SIZES } from '@/config/icons-map';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import KPICard from "@/design-system/ds/KPICard";

const ContractKPICards = ({ data }) => {
  // Protezione per dati non ancora caricati
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiCards.map((card) => (
        <KPICard
          key={card.id}
          icon={card.icon}
          value={card.value}
          label={card.title}
        />
      ))}
    </div>
  );
};

export default ContractKPICards;
