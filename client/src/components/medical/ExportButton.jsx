import React, { useState } from 'react';

export default function ExportButton({ onExport, formats = ['csv', 'pdf', 'excel'], loading = false }) {
  const [showFormats, setShowFormats] = useState(false);

  const handleExport = (format) => {
    if (onExport) {
      onExport(format);
    }
    setShowFormats(false);
  };

  const getFormatIcon = (format) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return '📊';
      case 'pdf':
        return '📄';
      case 'excel':
        return '📈';
      case 'json':
        return '🔧';
      default:
        return '📁';
    }
  };

  const getFormatLabel = (format) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'CSV';
      case 'pdf':
        return 'PDF';
      case 'excel':
        return 'Excel';
      case 'json':
        return 'JSON';
      default:
        return format.toUpperCase();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className="btn" 
        onClick={() => setShowFormats(!showFormats)}
        disabled={loading}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          position: 'relative'
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            <span>Esportazione...</span>
          </>
        ) : (
          <>
            <span>⬇️</span>
            <span>Esporta</span>
            <span style={{ fontSize: '12px' }}>▼</span>
          </>
        )}
      </button>

      {showFormats && !loading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '4px',
          backgroundColor: 'var(--card-bg, #111)',
          border: '1px solid var(--border-color, #2a2a2a)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '120px'
        }}>
          {formats.map((format) => (
            <button
              key={format}
              className="btn"
              onClick={() => handleExport(format)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '0',
                backgroundColor: 'transparent',
                color: 'inherit',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, rgba(255,255,255,0.05))'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>{getFormatIcon(format)}</span>
              <span>{getFormatLabel(format)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showFormats && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowFormats(false)}
        />
      )}
    </div>
  );
}
