import React from 'react';
import { BarChart3, X } from 'lucide-react';

const CompareBar = ({ 
  count, 
  onClear, 
  onOpenQuick, 
  onOpenExtended 
}) => {
  const isDisabled = count < 2;
  const isExtended = count > 8;

  return (
    <div className="compare-bar">
      <div className="compare-info">
        <span>Selezionati: {count} giocatori</span>
        {count > 8 && (
          <span className="warning">(confronto esteso per {count} giocatori)</span>
        )}
        {count === 1 && (
          <span className="hint">(seleziona almeno 2 giocatori per confrontare)</span>
        )}
      </div>
      
      <div className="compare-actions">
        {!isDisabled && !isExtended && (
          <button 
            className="btn-primary"
            onClick={onOpenQuick}
          >
            <BarChart3 size={16} /> Confronto Rapido ({count})
          </button>
        )}
        
        {!isDisabled && isExtended && (
          <button 
            className="btn-primary"
            onClick={onOpenExtended}
          >
            <BarChart3 size={16} /> Confronto Esteso ({count})
          </button>
        )}
        
        <button className="btn-secondary" onClick={onClear}>
          <X size={16} /> Pulisci
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
