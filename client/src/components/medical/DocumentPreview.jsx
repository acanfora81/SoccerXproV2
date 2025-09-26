import React, { useEffect, useRef, useState } from 'react';

export default function DocumentPreview({ fileUrl, fileName, onError }) {
  const iframeRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (iframeRef.current && fileUrl) {
      setLoading(true);
      setError(null);
      
      // Reset iframe src
      iframeRef.current.src = '';
      
      // Set new src after a brief delay
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = fileUrl;
        }
      }, 100);
    }
  }, [fileUrl]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Errore nel caricamento del documento');
    if (onError) onError();
  };

  if (!fileUrl) {
    return (
      <div className="card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', opacity: 0.7 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div>Nessun documento selezionato</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: 400, position: 'relative' }}>
      {fileName && (
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid var(--border-color, #2a2a2a)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          📄 {fileName}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <div>Caricamento documento...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div>{error}</div>
          <button 
            className="btn" 
            style={{ marginTop: '12px', fontSize: '12px' }}
            onClick={() => {
              setError(null);
              setLoading(true);
              if (iframeRef.current) {
                iframeRef.current.src = fileUrl;
              }
            }}
          >
            Riprova
          </button>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        title="Document Preview" 
        style={{ 
          width: '100%', 
          height: error || loading ? '0' : '100%', 
          border: 'none',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }} 
        sandbox="allow-same-origin allow-scripts allow-forms"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
