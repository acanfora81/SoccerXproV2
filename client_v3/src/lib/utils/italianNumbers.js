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
  
  const str = value.toString();
  
  // Se contiene virgola, è formato italiano: rimuovi punti (migliaia) e sostituisci virgola con punto
  if (str.includes(',')) {
    const result = str.replace(/\./g, '').replace(',', '.');
    console.log('🔵 parseItalianNumber (formato italiano):', value, '->', result);
    return result;
  }
  
  // Se contiene solo punti, potrebbe essere formato americano o italiano
  // Conta i punti per determinare il formato
  const dotCount = (str.match(/\./g) || []).length;
  
  if (dotCount === 1) {
    // Un solo punto = formato americano (es. "5360327.00")
    console.log('🔵 parseItalianNumber (formato americano):', value, '->', str);
    return str;
  } else if (dotCount > 1) {
    // Più punti = formato italiano (es. "5.360.327")
    const result = str.replace(/\./g, '');
    console.log('🔵 parseItalianNumber (formato italiano senza virgola):', value, '->', result);
    return result;
  }
  
  // Nessun punto = numero intero
  console.log('🔵 parseItalianNumber (numero intero):', value, '->', str);
  return str;
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

