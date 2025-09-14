import React, { memo } from 'react';

// Componente memoizzato per campo bonus - EVITA RICREAZIONE
const BonusField = memo(({ 
  bonusField, 
  label, 
  placeholder = "0,00", 
  taxPlaceholder = "es. 23,00",
  bonusMode,
  fieldValue,
  customTaxValue,
  loading,
  onToggleMode,
  onChange,
  onBlur
}) => {
  const customTaxField = `custom${bonusField.charAt(0).toUpperCase() + bonusField.slice(1)}Tax`;
  
  return (
    <>
      <div className="form-row bonus-row-with-tax">
        <div className="form-group">
          <div className="bonus-field-header">
            <label htmlFor={bonusField} className="form-label">
              {label} ({bonusMode === 'gross' ? 'Lordo' : 'Netto'})
            </label>
            <div className="bonus-toggle-buttons">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleMode(bonusField);
                }}
                className={`bonus-toggle-btn ${bonusMode === 'gross' ? 'active' : ''}`}
                disabled={loading}
                title="Lordo"
              >
                L
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleMode(bonusField);
                }}
                className={`bonus-toggle-btn ${bonusMode === 'net' ? 'active' : ''}`}
                disabled={loading}
                title="Netto"
              >
                N
              </button>
            </div>
          </div>
          <input
            type="text"
            id={bonusField}
            name={bonusField}
            value={fieldValue}
            onChange={onChange}
            onBlur={(e) => onBlur(e, bonusField)}
            disabled={loading}
            placeholder={placeholder}
            className="form-input"
          />
        </div>
        <div className="form-group form-group-tax">
          <label htmlFor={customTaxField} className="form-label">Aliquota (%)</label>
          <input
            type="text"
            id={customTaxField}
            name={customTaxField}
            value={customTaxValue}
            onChange={onChange}
            onBlur={(e) => onBlur(e, customTaxField)}
            disabled={loading}
            placeholder={taxPlaceholder}
            className="form-input"
            title="Lascia vuoto per usare l'aliquota predefinita"
          />
        </div>
      </div>
    </>
  );
});

BonusField.displayName = 'BonusField';

export default BonusField;
