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
      <div className="bonus-calculation-display waiting">
        <div className="calculation-info">
          <span className="calculation-label">
            {bonusMode === 'gross' ? 'Lordo' : 'Netto'}: €{inputValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="calculation-arrow">→</span>
          <span className="calculation-result">
            Calcolo in corso...
          </span>
        </div>
        <div className="calculation-details">
          <span className="tax-info">
            Caricamento aliquote...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bonus-calculation-display">
      <div className="calculation-info">
        <span className="calculation-label">
          {bonusMode === 'gross' ? 'Lordo' : 'Netto'}: €{bonusMode === 'gross' ? 
            calc.grossAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
            calc.netAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </span>
        <span className="calculation-arrow">→</span>
        <span className="calculation-result">
          {bonusMode === 'gross' ? 'Netto' : 'Lordo'}: €{bonusMode === 'gross' ? 
            calc.netAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
            calc.grossAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </span>
      </div>
      <div className="calculation-details">
        <span className="tax-info">
          Aliquota: {calc.taxRate.toFixed(2).replace('.', ',')}%
          {calc.isCustomRate && <span className="custom-rate-indicator" title="Aliquota personalizzata"> *</span>}
        </span>
        <span className="tax-amount">
          Tasse: €{calc.taxAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
});

BonusCalculationDisplay.displayName = 'BonusCalculationDisplay';

export default BonusCalculationDisplay;
