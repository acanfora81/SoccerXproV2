export default function EmptyState({ title, subtitle, cta, icon }) {
  return (
    <div className="card" style={{ textAlign:'center', padding: 40 }}>
      {icon && <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>}
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      {subtitle && <p style={{ opacity: 0.7, marginBottom: 16 }}>{subtitle}</p>}
      {cta}
    </div>
  );
}
