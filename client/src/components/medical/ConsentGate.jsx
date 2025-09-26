import React from 'react';

export default function ConsentGate({ error, onRequestConsent }) {
  if (!error?.consentRequired) return null;

  return (
    <div className="card" style={{ 
      textAlign: 'center', 
      padding: '40px',
      border: '2px solid #ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
      <h3 style={{ color: '#ef4444', marginBottom: '12px' }}>
        Accesso Bloccato
      </h3>
      <p style={{ marginBottom: '20px', opacity: 0.8 }}>
        {error.message || 'È richiesto un consenso GDPR per accedere a questi dati medici.'}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          className="btn primary" 
          onClick={() => window.location.href = '/medical/consents'}
        >
          Gestisci Consensi
        </button>
        {onRequestConsent && (
          <button 
            className="btn" 
            onClick={onRequestConsent}
          >
            Richiedi Consenso
          </button>
        )}
      </div>
    </div>
  );
}
