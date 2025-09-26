import React from 'react';
import { formatDateTime } from '../../utils/dates';

export default function VisitCard({ v, onClick }) {
  return (
    <div className="card visit-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <h3>{v.visitType}</h3>
      <div>{formatDateTime(v.visitDate)}</div>
      <div style={{ opacity: .8 }}>Medico: {v.doctor || 'N/D'}</div>
      {v.followUp && <div>Follow-up: {formatDateTime(v.followUp)}</div>}
      {v.diagnosis && <div style={{ opacity: .7, fontSize: '14px' }}>Diagnosi: {v.diagnosis}</div>}
    </div>
  );
}
