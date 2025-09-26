export default function KPIChip({ label, value, hint, trend, trendValue }) {
  return (
    <div className="card kpi-chip">
      <div className="value">{value}</div>
      <div style={{ opacity: .8 }}>{label}</div>
      {hint && <small style={{ opacity:.6 }}>{hint}</small>}
      {trend && trendValue && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.7,
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : 'inherit'
        }}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
        </div>
      )}
    </div>
  );
}
