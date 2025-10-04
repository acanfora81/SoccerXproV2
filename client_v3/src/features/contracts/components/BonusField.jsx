import React, { memo } from 'react';
import Button from "@/design-system/ds/Button";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={bonusField} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} ({bonusMode === 'gross' ? 'Lordo' : 'Netto'})
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={bonusMode === 'gross' ? 'primary' : 'ghost'}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMode(bonusField);
              }}
              disabled={loading}
              className="h-6 w-6 p-0 text-xs"
              title="Lordo"
            >
              L
            </Button>
            <Button
              type="button"
              variant={bonusMode === 'net' ? 'primary' : 'ghost'}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMode(bonusField);
              }}
              disabled={loading}
              className="h-6 w-6 p-0 text-xs"
              title="Netto"
            >
              N
            </Button>
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={customTaxField} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Aliquota (%)
        </label>
        <input
          type="text"
          id={customTaxField}
          name={customTaxField}
          value={customTaxValue}
          onChange={onChange}
          onBlur={(e) => onBlur(e, customTaxField)}
          disabled={loading}
          placeholder={taxPlaceholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Lascia vuoto per usare l'aliquota predefinita"
        />
      </div>
    </div>
  );
});

BonusField.displayName = 'BonusField';

export default BonusField;
