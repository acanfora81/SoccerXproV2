import React from 'react';

export default function TabNav({ tabs, active, onChange, style = {} }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 8, 
      borderBottom: '1px solid var(--border-color, #2a2a2a)',
      marginBottom: '16px',
      ...style
    }}>
      {tabs.map(tab => (
        <button 
          key={tab.key} 
          onClick={() => onChange(tab.key)} 
          className={`btn ${active === tab.key ? 'primary' : ''}`}
          style={{
            borderBottom: active === tab.key ? '2px solid var(--accent, #4f46e5)' : '2px solid transparent',
            borderRadius: '8px 8px 0 0',
            marginBottom: '-1px',
            fontSize: '14px',
            padding: '8px 16px',
            transition: 'all 0.2s ease'
          }}
        >
          {tab.icon && <span style={{ marginRight: '6px' }}>{tab.icon}</span>}
          {tab.label}
          {tab.badge && (
            <span style={{ 
              marginLeft: '6px', 
              fontSize: '11px', 
              padding: '2px 6px', 
              borderRadius: '10px',
              backgroundColor: active === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--accent, #4f46e5)',
              color: 'white'
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
