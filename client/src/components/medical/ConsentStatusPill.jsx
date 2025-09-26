import React from 'react';

const map = {
  NOT_REQUESTED: { cls: 'warning', label: 'Non richiesto', icon: '⏳' },
  PENDING: { cls: 'warning', label: 'In attesa', icon: '⏳' },
  GRANTED: { cls: 'success', label: 'Concesso', icon: '✅' },
  REFUSED: { cls: 'danger', label: 'Rifiutato', icon: '❌' },
  WITHDRAWN: { cls: 'orange', label: 'Revocato', icon: '🔄' },
  EXPIRED: { cls: 'danger', label: 'Scaduto', icon: '⏰' },
};

export default function ConsentStatusPill({ status, showIcon = true }) {
  const m = map[status] || { cls: 'warning', label: status, icon: '❓' };
  
  return (
    <span className={`badge ${m.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {showIcon && <span>{m.icon}</span>}
      <span>{m.label}</span>
    </span>
  );
}
