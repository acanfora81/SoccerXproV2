// client/src/modules/filters/FiltersProvider.jsx
// Provider per stato globale dei filtri con sincronizzazione URL

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_FILTERS } from './filtersConfig.js';
import { parseFilters, validateFilters } from './filtersUtils.js';

// Context
const FiltersContext = createContext();

// 🔧 FIX: Serializzazione deterministica con ordine stabile
function buildSearchFromFilters(f) {
  // Ordine stabile dei parametri
  const order = [
    'period','startDate','endDate',
    'sessionType','sessionName','roles',
    'normalize','viewMode','all'
  ];
  const qp = new URLSearchParams();
  for (const k of order) {
    const v = f?.[k];
    if (v !== undefined && v !== null && String(v) !== '') {
      qp.set(k, String(v));
    }
  }
  return `?${qp.toString()}`; // es: "?period=custom&startDate=2025-08-01&..."
}

// Reducer per i filtri
function filtersReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTERS':
      console.log('🔄 FiltersProvider: SET_FILTERS', action.payload);
      return { ...state, ...action.payload };
    
    case 'UPDATE_FILTER':
      console.log('🔄 FiltersProvider: UPDATE_FILTER', action.field, '=', action.value);
      return { ...state, [action.field]: action.value };
    
    case 'RESET_FILTERS':
      console.log('🔄 FiltersProvider: RESET_FILTERS');
      return { ...DEFAULT_FILTERS };
    
    case 'SYNC_FROM_URL':
      console.log('🔄 FiltersProvider: SYNC_FROM_URL', action.payload);
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

// Hook per usare i filtri
export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters deve essere usato dentro FiltersProvider');
  }
  return context;
}

// Provider principale
export function FiltersProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, dispatch] = useReducer(filtersReducer, DEFAULT_FILTERS);

  // 🔧 FIX: Ref anti-loop per evitare rimbalzi URL ↔ State
  const syncingRef = useRef(false);
  const hydratedRef = useRef(false);

  // 🔧 FIX: 1) HYDRATE una sola volta all'avvio (o quando l'utente usa back/forward)
  useEffect(() => {
    if (syncingRef.current) return; // è una nostra scrittura → ignora
    
    const urlFilters = parseFilters(new URLSearchParams(location.search));
    const validatedFilters = validateFilters(urlFilters);
    
    // Aggiorna stato solo se diverso
    if (!areFiltersEqual(filters, validatedFilters)) {
      dispatch({ type: 'SYNC_FROM_URL', payload: validatedFilters });
    }
    
    hydratedRef.current = true;
  }, [location.search]);

  // 🔧 FIX: 2) SCRITTURA URL da filters (chiamata quando cambiano i filtri)
  const writeUrl = (filters) => {
    const next = buildSearchFromFilters(filters);
    if (next !== location.search) {
      syncingRef.current = true;
      navigate({ search: next }, { replace: true });
      // rilascio il flag dopo il microtask, così l'useEffect di sopra non re-entra
      queueMicrotask(() => { syncingRef.current = false; });
    }
  };

  // 🔧 FIX: 3) Sincronizza stato → URL solo dopo l'hydrate
  useEffect(() => {
    if (!hydratedRef.current) return; // aspetta l'hydrate iniziale
    if (syncingRef.current) return; // evita loop
    
    const customIncomplete = filters.period === 'custom' && (!filters.startDate || !filters.endDate);
    if (!customIncomplete) {
      writeUrl(filters);
    }
  }, [filters]);

  // 🔧 FIX: Funzioni per aggiornare i filtri con protezione anti-loop
  const updateFilter = (field, value) => {
    console.log('🔄 FiltersProvider: updateFilter', field, '=', value);
    dispatch({ type: 'UPDATE_FILTER', field, value });
  };

  const setFilters = (newFilters) => {
    const validated = validateFilters(newFilters);
    dispatch({ type: 'SET_FILTERS', payload: validated });
  };

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  // 🔧 FIX: updateFilters che fa: setFilters(f) + writeUrl(f) con protezione
  const updateFilters = (patch) => {
    dispatch((prev) => {
      const f = { ...prev, ...patch };
      const customIncomplete = f.period === 'custom' && (!f.startDate || !f.endDate);
      if (!customIncomplete) writeUrl(f);
      return f;
    });
  };

  // Funzione helper per confronto filtri
  function areFiltersEqual(filters1, filters2) {
    const keys = Object.keys(DEFAULT_FILTERS);
    return keys.every(key => {
      if (key === 'roles') {
        return JSON.stringify(filters1[key]) === JSON.stringify(filters2[key]);
      }
      return filters1[key] === filters2[key];
    });
  }

  const value = {
    filters,
    updateFilter,
    setFilters,
    resetFilters,
    updateFilters // 🔧 FIX: Espone updateFilters per update atomici
  };

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}
