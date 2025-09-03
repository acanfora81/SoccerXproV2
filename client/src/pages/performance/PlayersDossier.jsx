import React from 'react';
import PlayerDossier from '../../components/analytics/PlayerDossier';

const PerformancePlayersDossier = ({ playerId, filters, isStandalone, onClose }) => {
  return (
    <div className="performance-players-dossier">
      <div className="page-header">
        <h1>Dossier Giocatori - Performance</h1>
        <p>Analisi dettagliata delle performance individuali dei giocatori</p>
        {isStandalone && onClose && (
          <button className="btn-secondary" onClick={onClose}>
            ← Torna alla Lista
          </button>
        )}
      </div>
      
      <PlayerDossier 
        playerId={playerId}
        filters={filters}
        isStandalone={isStandalone}
        onBack={onClose}
      />
    </div>
  );
};

export default PerformancePlayersDossier;
