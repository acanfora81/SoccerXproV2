// client/src/modules/filters/index.js
// Export centralizzato del modulo filtri - CORRETTO

console.log('🔵 Caricamento modulo filtri centralizzato...'); // INFO DEV - rimuovere in produzione

// ✅ CORREZIONE: Usa estensioni .jsx per i componenti React
export { FiltersProvider, useFilters } from './FiltersProvider.jsx';
export { FiltersBar } from './FiltersBar.jsx';
export { buildPerformanceQuery } from './filtersUtils.js';
export { FILTERS_PRESETS, DEFAULT_FILTERS, FILTER_OPTIONS } from './filtersConfig.js';

console.log('🟢 Modulo filtri caricato con successo'); // INFO - rimuovere in produzione