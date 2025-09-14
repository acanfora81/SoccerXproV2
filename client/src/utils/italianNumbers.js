// Utilità per gestire i numeri italiani in tutto il progetto

/**
 * Converte un numero in formato italiano (es. "56.565,00") in formato numerico (es. 56565.00)
 * @param {string|number} value - Il valore da convertire
 * @returns {string} - Il valore convertito in formato numerico
 */
export const parseItalianNumber = (value) => {
  if (!value || value === '') return '';
  
  // Se è già un numero, restituiscilo come stringa
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // Rimuovi i punti (separatori migliaia) e sostituisci virgola con punto
  const result = value.toString().replace(/\./g, '').replace(',', '.');
  console.log('🔵 parseItalianNumber:', value, '->', result);
  return result;
};

/**
 * Converte un numero in formato italiano per l'invio al server
 * @param {string|number} value - Il valore da convertire
 * @returns {number} - Il valore convertito in numero
 */
export const parseItalianNumberToFloat = (value) => {
  const parsed = parseItalianNumber(value);
  const result = parseFloat(parsed) || 0;
  console.log('🔵 parseItalianNumberToFloat:', { input: value, parsed, result });
  return result;
};

/**
 * Formatta un numero in formato italiano per la visualizzazione
 * @param {number} value - Il valore da formattare
 * @param {number} decimals - Numero di decimali (default: 2)
 * @returns {string} - Il valore formattato in italiano
 */
export const formatItalianNumber = (value, decimals = 2) => {
  if (!value || isNaN(value)) return '0,00';
  
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatta una valuta in formato italiano
 * @param {number} value - Il valore da formattare
 * @param {string} currency - La valuta (default: 'EUR')
 * @returns {string} - Il valore formattato come valuta italiana
 */
export const formatItalianCurrency = (value, currency = 'EUR') => {
  if (!value || isNaN(value)) return '€0,00';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

