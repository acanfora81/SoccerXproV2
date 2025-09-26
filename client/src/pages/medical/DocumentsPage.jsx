import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '../../services/medical/documentService';
import EncryptedUpload from '../../components/medical/EncryptedUpload';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';

export default function DocumentsPage() {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedCase, setSelectedCase] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', selectedPlayer, selectedCase],
    queryFn: () => listDocuments({ 
      playerId: selectedPlayer || undefined,
      caseId: selectedCase || undefined 
    }),
  });

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    // Refresh the documents list
    // This will be handled by React Query invalidation in the upload component
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
  };

  const documents = data?.items || [];

  return (
    <div className="medical-page">
      <PageHeader 
        title="Documenti Medici" 
        subtitle="Upload cifrato lato client e gestione documenti" 
        actions={<>
          <select 
            className="select" 
            value={selectedPlayer} 
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">Tutti i giocatori</option>
            <option value="1">Giocatore 1</option>
            <option value="2">Giocatore 2</option>
          </select>
          <select 
            className="select" 
            value={selectedCase} 
            onChange={(e) => setSelectedCase(e.target.value)}
          >
            <option value="">Tutti i casi</option>
            <option value="case1">Caso 1</option>
            <option value="case2">Caso 2</option>
          </select>
        </>}
      />

      {/* Upload Section */}
      <div className="card">
        <h3>Upload Nuovo Documento</h3>
        <EncryptedUpload 
          playerId={selectedPlayer || 1} 
          caseId={selectedCase || null}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      </div>

      {/* Documents List */}
      <div className="card">
        <h3>Documenti Esistenti</h3>
        
        {isLoading && <div>Caricamento documenti...</div>}
        {error && <div style={{ color:'salmon' }}>Errore: {String(error.message)}</div>}
        
        {documents.length === 0 && !isLoading ? (
          <EmptyState
            title="Nessun documento trovato"
            subtitle="Carica il primo documento medico"
            icon="📄"
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Tipo</th>
                <th>Giocatore</th>
                <th>Data Upload</th>
                <th>Classificazione</th>
                <th>Visibilità</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title || 'Documento senza titolo'}</td>
                  <td>{doc.documentType}</td>
                  <td>Giocatore {doc.playerId}</td>
                  <td>{new Date(doc.uploadedAt).toLocaleDateString('it-IT')}</td>
                  <td>
                    <span className={`badge ${
                      doc.classification === 'PUBLIC' ? 'success' :
                      doc.classification === 'SENSITIVE' ? 'warning' :
                      doc.classification === 'HIGHLY_SENSITIVE' ? 'orange' : 'danger'
                    }`}>
                      {doc.classification}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      doc.visibility === 'MEDICAL_ONLY' ? 'danger' :
                      doc.visibility === 'COACHING_STAFF' ? 'orange' :
                      doc.visibility === 'PLAYER_ACCESS' ? 'warning' : 'success'
                    }`}>
                      {doc.visibility}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn" 
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        onClick={() => console.log('View document:', doc.id)}
                      >
                        Visualizza
                      </button>
                      <button 
                        className="btn" 
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        onClick={() => console.log('Download document:', doc.id)}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
