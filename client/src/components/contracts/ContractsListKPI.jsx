// client/src/components/contracts/ContractsListKPI.jsx
import ContractKPICards from './dashboard/ContractKPICards';

export default function ContractsListKPI({ stats }) {
  // Adapts stats from ContractsList to the dashboard KPI structure
  const data = {
    totalValue: stats.totalValue || 0,
    totalValueTrend: 0,
    activeContracts: stats.active || 0,
    activeContractsTrend: 0,
    expiringContracts: stats.expiring || 0,
    expiringContractsTrend: 0,
    averageSalary: stats.total ? (stats.totalValue || 0) / (stats.total || 1) : 0,
    renewalsThisMonth: 0,
    renewalsThisMonthTrend: 0,
    pendingRenewals: 0,
    pendingRenewalsTrend: 0,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <ContractKPICards data={data} />
    </div>
  );
}
