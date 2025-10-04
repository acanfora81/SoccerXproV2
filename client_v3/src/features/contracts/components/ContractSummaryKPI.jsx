// client_v3/src/features/contracts/components/ContractSummaryKPI.jsx
// Wrapper KPI per Riepilogo Contratti: calcola metriche e riusa layout KPI standard

import { ICONS, ICON_SIZES } from '@/config/icons-map';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import KPICard from "@/design-system/ds/KPICard";

export default function ContractSummaryKPI({ contracts }) {
  // Calcola statistiche basate sui dati effettivi dei contratti
  const activeContracts = contracts.filter(c => ['ACTIVE', 'RENEWED'].includes(c.status));
  
  const totalSalary = activeContracts.reduce((sum, c) => sum + parseFloat(c.salary || 0), 0);
  const averageSalary = activeContracts.length > 0 ? totalSalary / activeContracts.length : 0;
  const maxSalary = activeContracts.length > 0 ? Math.max(...activeContracts.map(c => parseFloat(c.salary || 0))) : 0;
  const minSalary = activeContracts.length > 0 ? Math.min(...activeContracts.map(c => parseFloat(c.salary || 0))) : 0;
  
  // Calcola il totale mensile degli stipendi (assumendo che salary sia annuale)
  const totalMonthlySalary = totalSalary / 12;

  const cards = [
    { id: 'total', title: 'Stipendio Totale', value: formatItalianCurrency(totalSalary), icon: ICONS.euro, subtitle: 'Somma stipendi attivi' },
    { id: 'monthly', title: 'Stipendio Mensile Totale', value: formatItalianCurrency(totalMonthlySalary), icon: ICONS.euro, subtitle: 'Totale mensile stipendi' },
    { id: 'average', title: 'Stipendio Medio', value: formatItalianCurrency(averageSalary), icon: ICONS.euro, subtitle: 'Media stipendi attivi' },
    { id: 'max', title: 'Stipendio Massimo', value: formatItalianCurrency(maxSalary), icon: ICONS.trendUp, subtitle: 'Stipendio più alto' },
    { id: 'min', title: 'Stipendio Minimo', value: formatItalianCurrency(minSalary), icon: ICONS.euro, subtitle: 'Stipendio più basso' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      {cards.map((card) => (
        <KPICard
          key={card.id}
          label={card.title}
          value={card.value}
          icon={card.icon}
        />
      ))}
    </div>
  );
}
