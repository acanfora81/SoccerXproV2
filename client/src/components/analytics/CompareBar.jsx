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
        {count === 1 && (
          <span className="hint">(seleziona almeno 2 giocatori per confrontare)</span>
        )}
      </div>
      
      <div className="compare-actions">
        {!isDisabled && (
          <button 
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 CompareBar: cliccato Confronta, chiamando onOpenQuick');
              onOpenQuick();
            }}
          >
            <BarChart3 size={16} /> Confronta ({count})
          </button>
        )}
        
        <button className="btn btn-secondary" onClick={onClear}>
          <X size={16} /> Pulisci
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
