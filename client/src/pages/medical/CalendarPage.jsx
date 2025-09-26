import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listVisits } from '../../services/medical/visitService';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';
import { formatDate } from '../../utils/dates';

function groupByDay(items) {
  return items.reduce((acc, v) => {
    const key = (new Date(v.visitDate)).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(v);
    return acc;
  }, {});
}

export default function CalendarPage() {
  const [range, setRange] = useState({});
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['visits', range], 
    queryFn: () => listVisits(range) 
  });
  const items = data?.items || [];
  const grouped = useMemo(() => groupByDay(items), [items]);

  return (
    <div className="medical-page">
      <PageHeader 
        title="Calendario Visite" 
        subtitle="Vista semplificata Day/Week/Month" 
        actions={<>
          <input 
            className="input" 
            type="date" 
            placeholder="Da"
            onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} 
          />
          <input 
            className="input" 
            type="date" 
            placeholder="A"
            onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} 
          />
        </>} 
      />

      {isLoading && <div className="card">Caricamento…</div>}
      {error && <div className="card" style={{ color:'salmon' }}>Errore: {String(error.message)}</div>}

      {Object.keys(grouped).length === 0 && !isLoading && (
        <EmptyState
          title="Nessuna visita nel periodo"
          subtitle="Seleziona un range di date per visualizzare le visite"
          icon="📅"
        />
      )}

      <div className="medical-grid">
        {Object.entries(grouped).map(([key, vs]) => (
          <div className="card calendar-day" key={key}>
            <h3 style={{ marginBottom: 8 }}>{formatDate(key)}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {vs.map(v => (
                <li key={v.id} className="calendar-visit-item">
                  <div className="calendar-visit-time">
                    {new Date(v.visitDate).toLocaleTimeString('it-IT',{ hour:'2-digit', minute:'2-digit' })}
                  </div>
                  <div>
                    <strong>{v.visitType}</strong> — {v.doctor || 'N/D'}
                  </div>
                  {v.notes && (
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                      {v.notes}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
