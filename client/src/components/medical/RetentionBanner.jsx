import React from 'react';

export default function RetentionBanner({ daysLeft, documentName, onExtend, onDelete }) {
  if (daysLeft > 30) return null;

  const getSeverity = (days) => {
    if (days <= 7) return { color: '#ef4444', bg: '#5b1412', icon: '🚨' };
    if (days <= 14) return { color: '#f59e0b', bg: '#5b3412', icon: '⚠️' };
    return { color: '#f59e0b', bg: '#5a4b10', icon: '⏰' };
  };

  const severity = getSeverity(daysLeft);

  return (
    <div 
      className="card" 
      style={{ 
        background: severity.bg, 
        color: severity.color,
        border: `1px solid ${severity.color}`,
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{severity.icon}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
            Documento in Scadenza
          </h4>
          <p style={{ margin: '0', opacity: 0.9 }}>
            {documentName && `${documentName} - `}
            {daysLeft === 0 ? 'Scaduto oggi' : 
             daysLeft === 1 ? 'Scade domani' : 
             `Scade tra ${daysLeft} giorni`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onExtend && (
            <button 
              className="btn" 
              style={{ 
                fontSize: '12px', 
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${severity.color}`,
                color: severity.color
              }}
              onClick={onExtend}
            >
              Estendi
            </button>
          )}
          {onDelete && (
            <button 
              className="btn" 
              style={{ 
                fontSize: '12px', 
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${severity.color}`,
                color: severity.color
              }}
              onClick={onDelete}
            >
              Elimina
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
