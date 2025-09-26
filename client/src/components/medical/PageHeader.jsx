import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="toolbar">
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ opacity: .7, marginTop: 4 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}
