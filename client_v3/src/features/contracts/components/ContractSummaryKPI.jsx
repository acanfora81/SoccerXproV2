// client_v3/src/features/contracts/components/ContractSummaryKPI.jsx
// Wrapper KPI per Riepilogo Contratti: calcola metriche e riusa layout KPI standard

import { ICONS, ICON_SIZES } from '@/config/icons-map';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import KPICard from "@/design-system/ds/KPICard";

export default function ContractSummaryKPI({ contracts }) {
  const totalGross = contracts.reduce((sum, c) => sum + (c.grossSalary || 0), 0);
  const totalNet = contracts.reduce((sum, c) => sum + (c.netTotal || 0), 0);
  const totalBonuses = contracts.reduce((sum, c) => (
    sum + (c.contractPremiums || 0) + (c.exitIncentive || 0) + (c.allowances || 0) + (c.imageRights || 0) + (c.accommodation || 0)
  ), 0);
  const totalCompanyCost = contracts.reduce((sum, c) => (
    sum + (c.grossSalary || 0) + (c.inpsContributions || 0) + (c.inailContributions || 0) + (c.ffcContributions || 0)
  ), 0);

  const cards = [
    { id: 'gross', title: 'Stipendio Lordo', value: formatItalianCurrency(totalGross), icon: ICONS.euro, color: 'primary', subtitle: 'Totale lordo' },
    { id: 'net', title: 'Stipendio Netto', value: formatItalianCurrency(totalNet), icon: ICONS.euro, color: 'success', subtitle: 'Totale netto' },
    { id: 'bonus', title: 'Bonus Totali', value: formatItalianCurrency(totalBonuses), icon: ICONS.warning, color: 'warning', subtitle: 'Premi e incentivi' },
    { id: 'company', title: 'Costo Azienda', value: formatItalianCurrency(totalCompanyCost), icon: ICONS.trendUp, color: 'info', subtitle: 'Costo complessivo' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {cards.map((card) => (
        <KPICard
          key={card.id}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
}
