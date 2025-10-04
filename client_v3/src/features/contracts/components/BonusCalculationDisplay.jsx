import React, { memo } from 'react';

// Componente memoizzato per mostrare il calcolo di un singolo bonus
const BonusCalculationDisplay = memo(({ 
  bonusField, 
  label, 
  fieldValue, 
  calc, 
  bonusMode 
}) => {
  // Early return se il campo non ha valore - evita re-render inutili
  if (!fieldValue || fieldValue === '' || fieldValue === '0' || fieldValue === '0,00') {
    return null;
  }
  
  // Mostra il display se abbiamo dei calcoli e c'è un valore di input
  const inputValue = parseFloat(fieldValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  
  if (inputValue <= 0) return null;

  // Se non abbiamo calcoli ma abbiamo un valore di input, mostra messaggio di attesa
  if (!calc) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {bonusMode === 'gross' ? 'Lordo' : 'Netto'}: €{inputValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-blue-600 dark:text-blue-400">→</span>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Calcolo in corso...
          </span>
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <span>Caricamento aliquote...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-green-900 dark:text-green-100">
          {bonusMode === 'gross' ? 'Lordo' : 'Netto'}: €{bonusMode === 'gross' ? 
            calc.grossAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
            calc.netAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </span>
        <span className="text-green-600 dark:text-green-400">→</span>
        <span className="text-sm font-medium text-green-900 dark:text-green-100">
          {bonusMode === 'gross' ? 'Netto' : 'Lordo'}: €{bonusMode === 'gross' ? 
            calc.netAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
            calc.grossAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
        <span>
          Aliquota: {calc.taxRate.toFixed(2).replace('.', ',')}%
          {calc.isCustomRate && <span className="text-orange-600 dark:text-orange-400 ml-1" title="Aliquota personalizzata">*</span>}
        </span>
        <span>
          Tasse: €{calc.taxAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
});

BonusCalculationDisplay.displayName = 'BonusCalculationDisplay';

export default BonusCalculationDisplay;
