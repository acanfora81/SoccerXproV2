import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAudit, getAuditStats, getAuditSummary, exportAudit } from '../../services/medical/auditService';
import AuditRow from '../../components/medical/AuditRow';
import ExportButton from '../../components/medical/ExportButton';
import PageHeader from '../../components/medical/PageHeader';
import KPIChip from '../../components/medical/KPIChip';

export default function AuditPage() {
  const [filters, setFilters] = useState({
    userId: '',
    from: '',
    to: '',
    action: '',
    successful: ''
  });

  const { data: auditData, isLoading, error } = useQuery({ 
    queryKey: ['audit', filters], 
    queryFn: () => listAudit(filters) 
  });

  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats', filters],
    queryFn: () => getAuditStats(filters),
  });

  const { data: auditSummary } = useQuery({
    queryKey: ['audit-summary', filters],
    queryFn: () => getAuditSummary(filters),
  });

  const handleExport = async (format) => {
    try {
      const response = await exportAudit(format, filters);
      console.log(`Exporting audit as ${format}:`, response);
      alert(`Export ${format.toUpperCase()} avviato!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Errore durante l\'export');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      from: '',
      to: '',
      action: '',
      successful: ''
    });
  };

  const items = auditData?.items || [];

  return (
    <div className="medical-page">
      <PageHeader 
        title="Audit Explorer" 
        subtitle="Log accessi e tracciamento GDPR" 
        actions={<>
          <ExportButton onExport={handleExport} />
        </>}
      />

      {/* Audit Stats */}
      {auditStats && (
        <div className="medical-kpi" style={{ marginBottom: '24px' }}>
          <KPIChip 
            label="Accessi Totali" 
            value={auditStats.totalAccesses || 0}
            hint="Nel periodo selezionato"
          />
          <KPIChip 
            label="Accessi Riusciti" 
            value={auditStats.successfulAccesses || 0}
            hint={`${((auditStats.successfulAccesses / auditStats.totalAccesses) * 100 || 0).toFixed(1)}%`}
          />
          <KPIChip 
            label="Utenti Attivi" 
            value={auditStats.activeUsers || 0}
            hint="Utenti unici"
          />
          <KPIChip 
            label="Azioni Bloccate" 
            value={auditStats.blockedActions || 0}
            hint="Accessi negati"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Filtri</h3>
        <div className="row" style={{ marginBottom: '12px' }}>
          <input 
            className="input" 
            placeholder="User ID" 
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="Da"
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="A"
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
          />
        </div>
        <div className="row">
          <select 
            className="select" 
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Tutte le azioni</option>
            <option value="view">Visualizzazione</option>
            <option value="create">Creazione</option>
            <option value="update">Modifica</option>
            <option value="delete">Eliminazione</option>
            <option value="export">Export</option>
            <option value="download">Download</option>
          </select>
          <select 
            className="select" 
            value={filters.successful}
            onChange={(e) => handleFilterChange('successful', e.target.value)}
          >
            <option value="">Tutti gli esiti</option>
            <option value="true">Riusciti</option>
            <option value="false">Falliti</option>
          </select>
          <button className="btn" onClick={clearFilters}>
            Pulisci Filtri
          </button>
        </div>
      </div>

      {/* Audit Summary */}
      {auditSummary && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Riepilogo Periodo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <strong>Accessi più frequenti:</strong>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {auditSummary.topActions?.map((action, i) => (
                  <div key={i}>{action.action}: {action.count}</div>
                ))}
              </div>
            </div>
            <div>
              <strong>Utenti più attivi:</strong>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {auditSummary.topUsers?.map((user, i) => (
                  <div key={i}>{user.userId}: {user.count}</div>
                ))}
              </div>
            </div>
            <div>
              <strong>Basi legali:</strong>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {auditSummary.lawfulBasis?.map((basis, i) => (
                  <div key={i}>{basis.basis}: {basis.count}</div>
                ))}
              </div>
            </div>
            <div>
              <strong>Orari di accesso:</strong>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {auditSummary.accessHours?.map((hour, i) => (
                  <div key={i}>{hour.hour}:00 - {hour.count} accessi</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Table */}
      <div className="card">
        <h3>
          Log Accessi
          {items.length > 0 && (
            <span style={{ fontSize: '14px', opacity: 0.7, marginLeft: '8px' }}>
              ({items.length} record)
            </span>
          )}
        </h3>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Caricamento log accessi...
          </div>
        ) : error ? (
          <div style={{ color: 'salmon', textAlign: 'center', padding: '40px' }}>
            Errore: {String(error.message)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.7, padding: '40px' }}>
            Nessun record di audit trovato
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Data/Ora</th>
                  <th>Utente</th>
                  <th>Azione</th>
                  <th>Base Legale</th>
                  <th>Motivo Accesso</th>
                  <th>Esito</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((audit) => (
                  <AuditRow key={audit.id} audit={audit} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
