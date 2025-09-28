import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInjuryStats } from '../../services/medical/injuryService';
import { getVisitsToday, getVisitStats } from '../../services/medical/visitService';
import { getDocumentStats } from '../../services/medical/documentService';
import '../../styles/medical.css';
import PageHeader from '../../components/medical/PageHeader';
import KPICard from '../../components/medical/KPICard';
import SkeletonBox, { SkeletonCard } from '../../components/medical/SkeletonBox';
import EmptyState from '../../components/medical/EmptyState';

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
        <div className="stats-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="stats-grid">
          <KPICard 
            value={kpi.activeInjuries} 
            label="Infortuni Attivi" 
            icon="🩹"
            hint="Giocatori fuori per infortunio"
            trend={kpi.activeInjuries > 0 ? 1 : 0}
            delay={0}
          />
          <KPICard 
            value={kpi.visitsToday} 
            label="Visite Oggi" 
            icon="🩺"
            hint="Visite mediche programmate"
            trend={kpi.visitsToday > 0 ? 1 : 0}
            delay={0.1}
          />
          <KPICard 
            value={kpi.consentsExpiring} 
            label="Consensi in Scadenza" 
            icon="⚠️"
            hint="Necessaria rinnovazione"
            trend={kpi.consentsExpiring > 0 ? -1 : 0}
            delay={0.2}
          />
          <KPICard 
            value={kpi.docsRetentionSoon} 
            label="Documenti in Retention" 
            icon="📄"
            hint="Scadenza conservazione"
            trend={kpi.docsRetentionSoon > 0 ? -1 : 0}
            delay={0.3}
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
