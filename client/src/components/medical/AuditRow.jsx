import React from 'react';
import { formatDateTime } from '../../utils/dates';

export default function AuditRow({ audit }) {
  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'view':
      case 'read':
        return '👁️';
      case 'create':
      case 'insert':
        return '➕';
      case 'update':
      case 'modify':
        return '✏️';
      case 'delete':
      case 'remove':
        return '🗑️';
      case 'export':
        return '📤';
      case 'download':
        return '⬇️';
      case 'upload':
        return '⬆️';
      case 'login':
        return '🔑';
      case 'logout':
        return '🚪';
      default:
        return '📝';
    }
  };

  const getStatusColor = (successful) => {
    return successful ? '#10b981' : '#ef4444';
  };

  const getLawfulBasisColor = (basis) => {
    switch (basis?.toLowerCase()) {
      case 'consent':
        return '#4f46e5';
      case 'contract':
        return '#f59e0b';
      case 'legal_obligation':
        return '#ef4444';
      case 'vital_interests':
        return '#10b981';
      case 'legitimate_interest':
        return '#8b5cf6';
      case 'medical_purpose':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  return (
    <tr style={{ 
      borderBottom: '1px solid var(--border-color, #2a2a2a)',
      transition: 'background-color 0.2s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, rgba(255,255,255,0.05))'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
        {formatDateTime(audit.timestamp)}
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
        <span style={{ 
          padding: '2px 6px', 
          borderRadius: '4px',
          backgroundColor: 'var(--btn-bg, #181818)',
          fontSize: '11px'
        }}>
          {audit.userId}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{getActionIcon(audit.action)}</span>
          <span>{audit.action}</span>
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
        <span style={{ 
          padding: '2px 6px', 
          borderRadius: '4px',
          backgroundColor: getLawfulBasisColor(audit.lawfulBasis),
          color: 'white',
          fontSize: '11px'
        }}>
          {audit.lawfulBasis}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px', maxWidth: '200px' }}>
        <span style={{ 
          opacity: 0.8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block'
        }}>
          {audit.accessReason || '-'}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'center' }}>
        <span style={{ 
          color: getStatusColor(audit.wasSuccessful),
          fontSize: '16px'
        }}>
          {audit.wasSuccessful ? '✅' : '❌'}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
        {audit.ipAddress && (
          <span style={{ 
            fontSize: '11px', 
            opacity: 0.6,
            fontFamily: 'monospace'
          }}>
            {audit.ipAddress}
          </span>
        )}
      </td>
    </tr>
  );
}
