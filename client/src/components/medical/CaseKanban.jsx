import React from 'react';
import CaseCard from './CaseCard';

const columns = [
  { key: 'OPEN', label: 'Aperti', color: '#3b82f6' },
  { key: 'IN_TREATMENT', label: 'In Trattamento', color: '#f59e0b' },
  { key: 'CLOSED', label: 'Chiusi', color: '#10b981' },
];

export default function CaseKanban({ cases, onSelect, onStatusChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {columns.map(column => (
        <div key={column.key} className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-color, #2a2a2a)'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: column.color 
            }} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>{column.label}</h3>
            <span style={{ 
              fontSize: '12px', 
              opacity: 0.7,
              marginLeft: 'auto'
            }}>
              {cases.filter(cs => cs.status === column.key).length}
            </span>
          </div>
          <div style={{ minHeight: '200px' }}>
            {cases.filter(cs => cs.status === column.key).map(cs => (
              <CaseCard 
                key={cs.id} 
                case={cs} 
                onClick={() => onSelect(cs)} 
                onStatusChange={onStatusChange}
              />
            ))}
            {cases.filter(cs => cs.status === column.key).length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                opacity: 0.5, 
                padding: '20px',
                fontSize: '14px'
              }}>
                Nessun caso
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
