import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInjuryStats } from '../../services/medical/injuryService';
import { getVisitsToday, getVisitStats } from '../../services/medical/visitService';
import { getDocumentStats } from '../../services/medical/documentService';
import '../../styles/medical.css';
import PageHeader from '../../components/medical/PageHeader';
import KPIChip from '../../components/medical/KPIChip';

export default function Dashboard() {
  // Fetch KPI data
  const { data: injuryStats, isLoading: injuryLoading } = useQuery({
    queryKey: ['injury-stats'],
    queryFn: getInjuryStats,
  });

  const { data: visitStats, isLoading: visitLoading } = useQuery({
    queryKey: ['visit-stats'],
    queryFn: getVisitStats,
  });

  const { data: docStats, isLoading: docLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn: getDocumentStats,
  });

  const { data: todayVisits, isLoading: todayLoading } = useQuery({
    queryKey: ['visits-today'],
    queryFn: getVisitsToday,
  });

  // Calculate KPI values
  const kpi = {
    activeInjuries: injuryStats?.activeInjuries || 0,
    visitsToday: todayVisits?.items?.length || 0,
    consentsExpiring: docStats?.consentsExpiring || 0,
    docsRetentionSoon: docStats?.retentionSoon || 0,
  };

  const isLoading = injuryLoading || visitLoading || docLoading || todayLoading;

  return (
    <div className="medical-page">
      <PageHeader 
        title="Area Medica — Dashboard" 
        subtitle="Sintesi operativa e avvisi" 
      />
      
      {isLoading ? (
        <div className="card">Caricamento dati...</div>
      ) : (
        <div className="medical-kpi">
          <KPIChip 
            label="Infortuni Attivi" 
            value={kpi.activeInjuries} 
            hint="Giocatori fuori per infortunio"
          />
          <KPIChip 
            label="Visite Oggi" 
            value={kpi.visitsToday} 
            hint="Visite mediche programmate"
          />
          <KPIChip 
            label="Consensi in Scadenza" 
            value={kpi.consentsExpiring} 
            hint="Necessaria rinnovazione"
          />
          <KPIChip 
            label="Documenti in Retention" 
            value={kpi.docsRetentionSoon} 
            hint="Scadenza conservazione"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Azioni Rapide</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn primary">+ Nuovo Infortunio</button>
          <button className="btn primary">+ Nuova Visita</button>
          <button className="btn">📅 Calendario</button>
          <button className="btn">📄 Documenti</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Attività Recente</h3>
        <div style={{ opacity: 0.7 }}>
          <p>• Nessuna attività recente</p>
          <p>• Sistema pronto per l'uso</p>
        </div>
      </div>
    </div>
  );
}
