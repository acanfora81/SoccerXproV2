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
    <div className="compare-bar flex items-center justify-between p-4 bg-gray-200 dark:bg-gray-800 border-t-2 border-blue-500 dark:border-white/10">
      <div className="compare-info">
        <span className="text-sm text-gray-700 dark:text-gray-300">Selezionati: {count} giocatori</span>
        {count === 1 && (
          <span className="hint text-xs text-gray-500 dark:text-gray-400 ml-2">(seleziona almeno 2 giocatori per confrontare)</span>
        )}
      </div>
      
      <div className="compare-actions flex items-center gap-4">
        <button className="btn btn-secondary px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2" onClick={onClear}>
          <X size={16} /> Pulisci
        </button>
        
        {!isDisabled && (
          <button 
            type="button"
            className="btn btn-primary px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
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
      </div>
    </div>
  );
};

export default CompareBar;
