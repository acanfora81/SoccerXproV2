// client/src/components/contracts/ContractSummaryKPI.jsx
// Wrapper KPI per Riepilogo Contratti: calcola metriche e riusa layout KPI standard

import { ICONS, ICON_SIZES } from '../../config/icons-map';
import { formatItalianCurrency } from '../../utils/italianNumbers';

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
    <div className="kpi-cards-grid summary-kpi-grid" style={{ marginBottom: 16 }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`kpi-card kpi-card--${card.color}`}>
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <Icon size={ICON_SIZES.md} />
              </div>
              <span className="kpi-card__title">{card.title}</span>
            </div>
            <div className="kpi-card__content">
              <div className="kpi-card__value">{card.value}</div>
              <div className="kpi-card__subtitle">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
