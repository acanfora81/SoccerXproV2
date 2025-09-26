import React from 'react';
import MedicalSeverityBadge from './MedicalSeverityBadge';
import { formatDate } from '../../utils/dates';

export default function CaseCard({ case: caseData, onClick, onStatusChange }) {
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(caseData);
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(caseData.id, e.target.value);
    }
  };

  return (
    <div 
      className="card" 
      onClick={handleCardClick} 
      style={{ 
        cursor: 'pointer', 
        marginBottom: 8,
        transition: 'all 0.2s ease',
        border: '1px solid var(--border-color, #2a2a2a)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          {caseData.caseNumber || `Caso #${caseData.id}`}
        </h4>
        <MedicalSeverityBadge severity={caseData.severityCategory || caseData.severity} />
      </div>
      
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
        Giocatore: {caseData.playerName || `ID ${caseData.playerId}`}
      </div>
      
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
        Tipo: {caseData.caseType || 'N/A'}
      </div>
      
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
        Creato: {formatDate(caseData.createdAt || caseData.created_at)}
      </div>
      
      {caseData.description && (
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7, 
          marginBottom: '8px',
          maxHeight: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {caseData.description}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '11px', 
          padding: '2px 6px', 
          borderRadius: '4px',
          backgroundColor: 'var(--btn-bg, #181818)',
          color: 'var(--text-color, #fff)'
        }}>
          {caseData.status}
        </span>
        
        {onStatusChange && (
          <select 
            value={caseData.status} 
            onChange={handleStatusChange}
            style={{ 
              fontSize: '10px', 
              padding: '2px 4px',
              border: '1px solid var(--border-color, #2a2a2a)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: 'inherit'
            }}
          >
            <option value="OPEN">Aperto</option>
            <option value="IN_TREATMENT">In Trattamento</option>
            <option value="CLOSED">Chiuso</option>
          </select>
        )}
      </div>
    </div>
  );
}
