import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllConsents, getExpiringConsents, grantConsent, withdrawConsent } from '../../services/medical/consentService';
import ConsentStatusPill from '../../components/medical/ConsentStatusPill';
import PageHeader from '../../components/medical/PageHeader';
import EmptyState from '../../components/medical/EmptyState';
import { formatDate, formatDateTime, getDaysUntil } from '../../utils/dates';

export default function ConsentsPage() {
  const qc = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showExpiring, setShowExpiring] = useState(false);

  const { data, isLoading, error } = useQuery({ 
    queryKey: ['consents', selectedPlayer, showExpiring], 
    queryFn: () => showExpiring ? getExpiringConsents(30) : getAllConsents({ playerId: selectedPlayer || undefined })
  });

  const grantMut = useMutation({
    mutationFn: ({ id, meta }) => grantConsent(id, meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consents'] }),
  });

  const withdrawMut = useMutation({
    mutationFn: ({ id, meta }) => withdrawConsent(id, meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consents'] }),
  });

  const handleGrantConsent = (consentId) => {
    const meta = {
      grantedAt: new Date().toISOString(),
      grantedBy: 'current-user', // In real app, get from auth context
      ipAddress: '127.0.0.1', // In real app, get from request
    };
    grantMut.mutate({ id: consentId, meta });
  };

  const handleWithdrawConsent = (consentId) => {
    const meta = {
      withdrawnAt: new Date().toISOString(),
      withdrawnBy: 'current-user',
      reason: 'User request',
    };
    withdrawMut.mutate({ id: consentId, meta });
  };

  const items = data?.items || [];

  return (
    <div className="medical-page">
      <PageHeader 
        title="Consensi GDPR" 
        subtitle="Gestione consensi e privacy giocatori" 
        actions={<>
          <button className="btn" onClick={() => setShowExpiring(!showExpiring)}>
            {showExpiring ? 'Tutti i Consensi' : 'In Scadenza'}
          </button>
          <select 
            className="select" 
            value={selectedPlayer} 
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">Tutti i giocatori</option>
            <option value="1">Giocatore 1</option>
            <option value="2">Giocatore 2</option>
            <option value="3">Giocatore 3</option>
          </select>
          <button className="btn primary">
            + Nuovo Consenso
          </button>
        </>}
      />
      
      {isLoading && <div className="card">Caricamento consensi...</div>}
      {error && <div className="card" style={{ color: 'salmon' }}>Errore: {String(error.message)}</div>}
      
      {items.length === 0 && !isLoading ? (
        <EmptyState
          title="Nessun consenso trovato"
          subtitle="Inizia creando un nuovo consenso GDPR"
          icon="📋"
          cta={<button className="btn primary">+ Nuovo Consenso</button>}
        />
      ) : (
        <div className="card">
          <h3>
            {showExpiring ? 'Consensi in Scadenza (30 giorni)' : 'Tutti i Consensi'}
            {items.length > 0 && <span style={{ fontSize: '14px', opacity: 0.7, marginLeft: '8px' }}>({items.length})</span>}
          </h3>
          
          <table className="table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Tipo Consenso</th>
                <th>Stato</th>
                <th>Base Legale</th>
                <th>Data Concessione</th>
                <th>Scadenza</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map(consent => {
                const daysUntilExpiry = consent.expiresAt ? getDaysUntil(consent.expiresAt) : null;
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                
                return (
                  <tr key={consent.id} style={{ 
                    backgroundColor: isExpiringSoon ? 'rgba(245, 158, 11, 0.1)' : 'transparent' 
                  }}>
                    <td>
                      {consent.playerName || `Giocatore ${consent.playerId}`}
                      {isExpiringSoon && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px', 
                          color: '#f59e0b',
                          fontWeight: 'bold'
                        }}>
                          ⚠️ Scade tra {daysUntilExpiry} giorni
                        </span>
                      )}
                    </td>
                    <td>{consent.consentType}</td>
                    <td><ConsentStatusPill status={consent.status} /></td>
                    <td>{consent.lawfulBasis}</td>
                    <td>{consent.grantedAt ? formatDateTime(consent.grantedAt) : '-'}</td>
                    <td>
                      {consent.expiresAt ? (
                        <span style={{ 
                          color: isExpiringSoon ? '#f59e0b' : 'inherit',
                          fontWeight: isExpiringSoon ? 'bold' : 'normal'
                        }}>
                          {formatDate(consent.expiresAt)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {consent.status === 'PENDING' && (
                          <button 
                            className="btn" 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => handleGrantConsent(consent.id)}
                            disabled={grantMut.isPending}
                          >
                            Concedi
                          </button>
                        )}
                        {consent.status === 'GRANTED' && (
                          <button 
                            className="btn" 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => handleWithdrawConsent(consent.id)}
                            disabled={withdrawMut.isPending}
                          >
                            Revoca
                          </button>
                        )}
                        <button 
                          className="btn" 
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={() => console.log('View consent details:', consent.id)}
                        >
                          Dettagli
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
