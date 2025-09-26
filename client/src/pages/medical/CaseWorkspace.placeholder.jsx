import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCase, getCaseDocuments, getCaseAuditLog } from '../../services/medical/casesService';
import TabNav from '../../components/medical/TabNav';
import PageHeader from '../../components/medical/PageHeader';
import DocumentPreview from '../../components/medical/DocumentPreview';
import MedicalSeverityBadge from '../../components/medical/MedicalSeverityBadge';
import ConsentGate from '../../components/medical/ConsentGate';
import { formatDate, formatDateTime } from '../../utils/dates';

const tabs = [
  { key: 'summary', label: 'Riepilogo', icon: '📋' },
  { key: 'diagnoses', label: 'Diagnosi', icon: '🔍' },
  { key: 'exams', label: 'Esami', icon: '🧪' },
  { key: 'treatments', label: 'Trattamenti', icon: '💊' },
  { key: 'documents', label: 'Documenti', icon: '📄' },
  { key: 'audit', label: 'Accessi', icon: '📊' },
];

export default function CaseWorkspace() {
  const { id } = useParams();
  const [tab, setTab] = useState('summary');
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery({
    queryKey: ['case', id],
    queryFn: () => getCase(id),
    enabled: !!id,
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['case-documents', id],
    queryFn: () => getCaseDocuments(id),
    enabled: !!id && tab === 'documents',
  });

  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ['case-audit', id],
    queryFn: () => getCaseAuditLog(id),
    enabled: !!id && tab === 'audit',
  });

  if (caseLoading) return <div className="medical-page"><div className="card">Caricamento caso...</div></div>;
  if (caseError) {
    // Handle consent gating (451)
    if (caseError.consentRequired) {
      return (
        <div className="medical-page">
          <PageHeader title="Caso Medico" subtitle="Accesso richiesto" />
          <ConsentGate error={caseError} />
        </div>
      );
    }
    return <div className="medical-page"><div className="card" style={{ color: 'salmon' }}>Errore: {String(caseError.message)}</div></div>;
  }
  if (!caseData) return <div className="medical-page"><div className="card">Caso non trovato</div></div>;

  const renderTabContent = () => {
    switch (tab) {
      case 'summary':
        return (
          <div className="medical-grid">
            <div className="card">
              <h3>Informazioni Caso</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div><strong>Numero Caso:</strong> {caseData.caseNumber || `#${caseData.id}`}</div>
                <div><strong>Giocatore:</strong> {caseData.playerName || `ID ${caseData.playerId}`}</div>
                <div><strong>Tipo:</strong> {caseData.caseType}</div>
                <div><strong>Severità:</strong> <MedicalSeverityBadge severity={caseData.severityCategory} /></div>
                <div><strong>Stato:</strong> {caseData.status}</div>
                <div><strong>Creato:</strong> {formatDateTime(caseData.createdAt)}</div>
                {caseData.description && <div><strong>Descrizione:</strong> {caseData.description}</div>}
              </div>
            </div>
            
            <div className="card">
              <h3>Statistiche</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>Diagnosi: {caseData.diagnoses?.length || 0}</div>
                <div>Esami: {caseData.exams?.length || 0}</div>
                <div>Trattamenti: {caseData.treatments?.length || 0}</div>
                <div>Documenti: {caseData.documents?.length || 0}</div>
              </div>
            </div>
          </div>
        );

      case 'diagnoses':
        return (
          <div className="card">
            <h3>Diagnosi</h3>
            {caseData.diagnoses?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Diagnosi</th><th>Medico</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {caseData.diagnoses.map((d, i) => (
                    <tr key={i}>
                      <td>{formatDate(d.date)}</td>
                      <td>{d.diagnosis}</td>
                      <td>{d.doctor}</td>
                      <td>{d.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                Nessuna diagnosi registrata
              </div>
            )}
          </div>
        );

      case 'exams':
        return (
          <div className="card">
            <h3>Esami</h3>
            {caseData.exams?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Tipo</th><th>Risultato</th><th>Medico</th></tr>
                </thead>
                <tbody>
                  {caseData.exams.map((e, i) => (
                    <tr key={i}>
                      <td>{formatDate(e.date)}</td>
                      <td>{e.examType}</td>
                      <td>{e.result}</td>
                      <td>{e.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                Nessun esame registrato
              </div>
            )}
          </div>
        );

      case 'treatments':
        return (
          <div className="card">
            <h3>Trattamenti</h3>
            {caseData.treatments?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Tipo</th><th>Descrizione</th><th>Medico</th></tr>
                </thead>
                <tbody>
                  {caseData.treatments.map((t, i) => (
                    <tr key={i}>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.treatmentType}</td>
                      <td>{t.description}</td>
                      <td>{t.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                Nessun trattamento registrato
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="medical-grid">
            <div className="card">
              <h3>Documenti</h3>
              {docsLoading ? (
                <div>Caricamento documenti...</div>
              ) : documents?.items?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr><th>Nome</th><th>Tipo</th><th>Data</th><th>Azioni</th></tr>
                  </thead>
                  <tbody>
                    {documents.items.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.title}</td>
                        <td>{doc.documentType}</td>
                        <td>{formatDate(doc.uploadedAt)}</td>
                        <td>
                          <button 
                            className="btn" 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => setSelectedDocument(doc)}
                          >
                            Visualizza
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                  Nessun documento caricato
                </div>
              )}
            </div>
            
            {selectedDocument && (
              <DocumentPreview 
                fileUrl={selectedDocument.fileUrl}
                fileName={selectedDocument.title}
                onError={() => setSelectedDocument(null)}
              />
            )}
          </div>
        );

      case 'audit':
        return (
          <div className="card">
            <h3>Log Accessi</h3>
            {auditLoading ? (
              <div>Caricamento log...</div>
            ) : auditLog?.items?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Utente</th><th>Azione</th><th>Dettagli</th></tr>
                </thead>
                <tbody>
                  {auditLog.items.map((log, i) => (
                    <tr key={i}>
                      <td>{formatDateTime(log.timestamp)}</td>
                      <td>{log.userId}</td>
                      <td>{log.action}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                Nessun log di accesso
              </div>
            )}
          </div>
        );

      default:
        return <div className="card">Sezione non trovata</div>;
    }
  };

  return (
    <div className="medical-page">
      <PageHeader 
        title={`Caso ${caseData.caseNumber || `#${caseData.id}`}`} 
        subtitle={`Giocatore: ${caseData.playerName || `ID ${caseData.playerId}`}`}
        actions={<>
          <button className="btn" onClick={() => window.history.back()}>
            ← Indietro
          </button>
          <button className="btn primary">
            Modifica Caso
          </button>
        </>}
      />
      
      <TabNav tabs={tabs} active={tab} onChange={setTab} />
      
      {renderTabContent()}
    </div>
  );
}
