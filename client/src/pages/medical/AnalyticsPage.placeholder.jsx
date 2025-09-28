import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics, getInjuryAnalytics, getVisitAnalytics, getCaseAnalytics, exportAnalytics } from '../../services/medical/analyticsService';
import { LineAnalytics, PieAnalytics, BarAnalytics } from '../../components/medical/AnalyticsChart';
import ExportButton from '../../components/medical/ExportButton';
import PageHeader from '../../components/medical/PageHeader';
import KPICard from '../../components/medical/KPICard';
import SkeletonBox, { SkeletonCard } from '../../components/medical/SkeletonBox';
import EmptyState from '../../components/medical/EmptyState';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('injuries');

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => getAnalytics({ timeRange }),
  });

  const { data: injuryData, isLoading: injuryLoading } = useQuery({
    queryKey: ['injury-analytics', timeRange],
    queryFn: () => getInjuryAnalytics({ timeRange }),
  });

  const { data: visitData, isLoading: visitLoading } = useQuery({
    queryKey: ['visit-analytics', timeRange],
    queryFn: () => getVisitAnalytics({ timeRange }),
  });

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case-analytics', timeRange],
    queryFn: () => getCaseAnalytics({ timeRange }),
  });

  const handleExport = async (format) => {
    try {
      const response = await exportAnalytics(format, { timeRange });
      // In a real app, this would trigger a download
      console.log(`Exporting analytics as ${format}:`, response);
      alert(`Export ${format.toUpperCase()} avviato!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Errore durante l\'export');
    }
  };

  const isLoading = analyticsLoading || injuryLoading || visitLoading || caseLoading;

  if (analyticsError) {
    return (
      <div className="medical-page">
        <div className="card" style={{ color: 'salmon' }}>
          Errore nel caricamento analytics: {String(analyticsError.message)}
        </div>
      </div>
    );
  }

  return (
    <div className="medical-page">
      <PageHeader 
        title="Analytics Mediche" 
        subtitle="Statistiche avanzate e reportistica" 
        actions={<>
          <select 
            className="select" 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="90d">Ultimi 90 giorni</option>
            <option value="1y">Ultimo anno</option>
          </select>
          <select 
            className="select" 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="injuries">Infortuni</option>
            <option value="visits">Visite</option>
            <option value="cases">Casi</option>
            <option value="consents">Consensi</option>
          </select>
          <ExportButton onExport={handleExport} />
        </>}
      />

      {isLoading ? (
        <div className="stats-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* KPI Overview */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <KPICard 
              value={analytics?.totalInjuries || 0}
              label="Infortuni Totali" 
              icon="🩹"
              hint={`${timeRange} periodo`}
              trend={analytics?.totalInjuries > 0 ? 1 : 0}
            />
            <KPICard 
              value={analytics?.totalVisits || 0}
              label="Visite Mediche" 
              icon="🩺"
              hint={`${timeRange} periodo`}
              trend={analytics?.totalVisits > 0 ? 1 : 0}
            />
            <KPICard 
              value={analytics?.openCases || 0}
              label="Casi Aperti" 
              icon="📂"
              hint="Attualmente attivi"
              trend={analytics?.openCases > 0 ? 1 : 0}
            />
            <KPICard 
              value={analytics?.activeConsents || 0}
              label="Consensi Attivi" 
              icon="✅"
              hint="Non scaduti"
              trend={analytics?.activeConsents > 0 ? 1 : 0}
            />
          </div>

          {/* Charts Grid */}
          <div className="medical-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {/* Injury Trends */}
            <div className="card">
              <h3>Trend Infortuni</h3>
              <LineAnalytics 
                data={injuryData?.trends || []} 
                xKey="week" 
                yKey="count" 
                color="#ef4444"
                title="Infortuni per settimana"
              />
            </div>

            {/* Body Parts Distribution */}
            <div className="card">
              <h3>Distribuzione Parti del Corpo</h3>
              <PieAnalytics 
                data={injuryData?.bodyParts || []} 
                dataKey="count" 
                nameKey="part"
                title="Infortuni per parte del corpo"
              />
            </div>

            {/* Severity Distribution */}
            <div className="card">
              <h3>Distribuzione Severità</h3>
              <BarAnalytics 
                data={injuryData?.severity || []} 
                xKey="level" 
                yKey="count"
                color="#f59e0b"
                title="Infortuni per severità"
              />
            </div>

            {/* Recovery Times */}
            <div className="card">
              <h3>Tempi di Recupero</h3>
              <LineAnalytics 
                data={injuryData?.recoveryTimes || []} 
                xKey="severity" 
                yKey="days"
                color="#10b981"
                title="Giorni medi di recupero"
              />
            </div>

            {/* Visit Types */}
            <div className="card">
              <h3>Tipi di Visite</h3>
              <PieAnalytics 
                data={visitData?.types || []} 
                dataKey="count" 
                nameKey="type"
                title="Distribuzione tipi visite"
              />
            </div>

            {/* Case Status */}
            <div className="card">
              <h3>Stati Casi Medici</h3>
              <BarAnalytics 
                data={caseData?.status || []} 
                xKey="status" 
                yKey="count"
                color="#4f46e5"
                title="Casi per stato"
              />
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="medical-grid" style={{ gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
            {/* Top Injured Players */}
            <div className="card">
              <h3>Giocatori Più Infortunati</h3>
              {injuryData?.topPlayers?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th>Infortuni</th>
                      <th>Giorni Out</th>
                      <th>Severità Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuryData.topPlayers.map((player, i) => (
                      <tr key={i}>
                        <td>{player.name}</td>
                        <td>{player.injuryCount}</td>
                        <td>{player.totalDaysOut}</td>
                        <td>{player.avgSeverity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                  Nessun dato disponibile
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="card">
              <h3>Riepilogo Mensile</h3>
              {analytics?.monthlySummary?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mese</th>
                      <th>Infortuni</th>
                      <th>Visite</th>
                      <th>Nuovi Casi</th>
                      <th>Costi Stimati</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthlySummary.map((month, i) => (
                      <tr key={i}>
                        <td>{month.month}</td>
                        <td>{month.injuries}</td>
                        <td>{month.visits}</td>
                        <td>{month.newCases}</td>
                        <td>€{month.estimatedCosts?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                  Nessun dato disponibile
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
