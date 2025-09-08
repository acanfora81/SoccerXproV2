// client/src/modules/filters/filtersUtils.js
// Utilità per serializzazione, parsing e validazione dei filtri

import { DEFAULT_FILTERS } from './filtersConfig.js';

/**
 * Serializza i filtri in query string
 */
export function serializeFilters(filters) {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.period) params.set('period', filters.period);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.sessionType) params.set('sessionType', filters.sessionType);
  if (filters.roles && filters.roles.length > 0) params.set('roles', filters.roles.join(','));
  if (filters.status) params.set('status', filters.status);
  if (filters.normalize) params.set('normalize', filters.normalize);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.density) params.set('density', filters.density);
  
  return params.toString();
}

/**
 * Parsa i filtri da query string
 */
export function parseFilters(searchParams) {
  const filters = { ...DEFAULT_FILTERS };
  
  // Parse singoli valori
  if (searchParams.get('search')) filters.search = searchParams.get('search');
  if (searchParams.get('period')) filters.period = searchParams.get('period');
  if (searchParams.get('startDate')) filters.startDate = searchParams.get('startDate');
  if (searchParams.get('endDate')) filters.endDate = searchParams.get('endDate');
  if (searchParams.get('sessionType')) filters.sessionType = searchParams.get('sessionType');
  if (searchParams.get('sessionTypeSimple')) filters.sessionTypeSimple = searchParams.get('sessionTypeSimple');
  if (searchParams.get('status')) filters.status = searchParams.get('status');
  if (searchParams.get('normalize')) filters.normalize = searchParams.get('normalize');
  if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy');
  if (searchParams.get('density')) filters.density = searchParams.get('density');
  
  // Parse roles (CSV maiuscolo)
  if (searchParams.get('roles')) {
    const rolesParam = searchParams.get('roles');
    filters.roles = rolesParam.split(',').map(r => r.trim().toUpperCase());
  }
  
  return filters;
}

/**
 * Valida i filtri
 */
export function validateFilters(filters) {
  const validated = { ...filters };
  
  // 🔧 FIX: Validazione tollerante per period custom
  if (validated.period === 'custom') {
    // Non forzare fallback automatico, lascia custom anche senza date
    // La UI gestirà il guard per evitare chiamate API incomplete
    if (validated.startDate) validated.startDate = validated.startDate.slice(0, 10);
    if (validated.endDate) validated.endDate = validated.endDate.slice(0, 10);
  }
  
  // Validazione roles (sempre maiuscolo)
  if (Array.isArray(validated.roles)) {
    validated.roles = validated.roles.map(r => r.toUpperCase());
  } else {
    validated.roles = DEFAULT_FILTERS.roles;
  }
  
  // Validazione valori enum
  const validPeriods = ['week', 'month', 'quarter', 'custom'];
  // 🔧 FIX: Validazione sessionType dinamica - accetta valori dal database
  const validSessionTypes = ['all', 'allenamento', 'partita', 'test', 'training', 'match', 'aerobico', 'intermittente', 'campionatoamichevole', 'palestracampo', 'situazionale', 'pregara', 'rigenerante'];
  const validSessionTypeSimple = ['all', 'allenamento', 'partita'];
  const validStatuses = ['all', 'active', 'return', 'injured'];
  const validNormalize = ['absolute', 'per90', 'perMin'];
  const validSortBy = ['acwr', 'plMin', 'hsr', 'sprintPer90', 'topSpeed', 'name'];
  const validDensity = ['compact', 'medium', 'wide'];
  
  if (!validPeriods.includes(validated.period)) validated.period = 'week';
  // 🔧 FIX: Validazione più permissiva per sessionType
  if (!validSessionTypes.includes(validated.sessionType)) validated.sessionType = 'all';
  // 🆕 NUOVO: Validazione per sessionTypeSimple
  if (!validSessionTypeSimple.includes(validated.sessionTypeSimple)) validated.sessionTypeSimple = 'all';
  if (!validStatuses.includes(validated.status)) validated.status = 'all';
  if (!validNormalize.includes(validated.normalize)) validated.normalize = 'per90';
  if (!validSortBy.includes(validated.sortBy)) validated.sortBy = 'acwr';
  if (!validDensity.includes(validated.density)) validated.density = 'medium';
  
  return validated;
}

/**
 * 🔧 FIX CRITCO: Funzione per costruire query performance con mapping corretto
 * Risolve discordanze frontend ↔ database per sistema multi-tenant
 */
export function buildPerformanceQuery(filters) {
  console.log('🔵 buildPerformanceQuery: input filtri:', filters); // INFO DEV - rimuovere in produzione
  
  const params = new URLSearchParams();
  
  // 📅 Periodo (sempre incluso)
  if (filters.period) params.set('period', filters.period);

  // PRIORITÀ CUSTOM: se presenti entrambe le date, forza period=custom
  if (filters.startDate && filters.endDate) {
    params.set('period', 'custom');
    params.set('startDate', filters.startDate);
    params.set('endDate', filters.endDate);
  } else if (filters.period === 'month' || filters.period === 'quarter') {
    const today = new Date();
    
    console.log('🔍 DEBUG buildPerformanceQuery - Calcolo periodo:', {
      period: filters.period,
      today: today.toISOString(),
      todayDay: today.getDate(),
      todayMonth: today.getMonth() + 1,
      todayYear: today.getFullYear()
    });
    
    if (filters.period === 'week') {
      // 🔧 FIX: Settimana corrente (lunedì - domenica che contiene oggi)
      const day = today.getDay(); // 0=Sunday, 1=Monday...
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      params.set('startDate', weekStart.toISOString().split('T')[0]);
      params.set('endDate', weekEnd.toISOString().split('T')[0]);
      
      console.log('🟢 Forzato periodo week:', {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        weekInfo: `${weekStart.toLocaleDateString('it-IT')} - ${weekEnd.toLocaleDateString('it-IT')}`
      });
    } else if (filters.period === 'month') {
      // 🔧 FIX: Mese corrente (1° - ultimo giorno del mese che contiene oggi)
      const year = today.getFullYear();
      const month = today.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      params.set('startDate', monthStart.toISOString().split('T')[0]);
      params.set('endDate', monthEnd.toISOString().split('T')[0]);
      
      console.log('🟢 Forzato periodo month:', {
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        monthName: monthStart.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      });
    } else if (filters.period === 'quarter') {
      // 🔧 FIX: Trimestre corrente (1° giorno - ultimo giorno del trimestre che contiene oggi)
      const year = today.getFullYear();
      const month = today.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      
      const quarterStart = new Date(year, quarterStartMonth, 1);
      const quarterEnd = new Date(year, quarterStartMonth + 3, 0);
      
      params.set('startDate', quarterStart.toISOString().split('T')[0]);
      params.set('endDate', quarterEnd.toISOString().split('T')[0]);
      
      console.log('🟢 Forzato periodo quarter:', {
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        quarter: Math.floor(month / 3) + 1,
        year: year
      });
    }
  } else {
    // Per week o singole date, usa quelle esistenti
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }
  
  // 🏃‍♂️ Tipo Sessione - MAPPING CORRETTO per backend
  if (filters.sessionType && filters.sessionType !== 'all') {
    // Frontend: 'training'|'match' → Backend: 'allenamento'|'partita'
    const sessionTypeMap = {
      'training': 'allenamento',
      'match': 'partita',
      'allenamento': 'allenamento', // già corretto
      'partita': 'partita' // già corretto
    };
    const mappedSessionType = sessionTypeMap[filters.sessionType] || filters.sessionType;
    params.set('sessionType', mappedSessionType);
    console.log('🟢 Mapping sessionType:', filters.sessionType, '→', mappedSessionType); // INFO - rimuovere in produzione
  }
  
  // 🎯 Dettaglio Sessione (session_name nel DB)
  if (filters.sessionName && filters.sessionName !== 'all') {
    params.set('sessionName', filters.sessionName);
  }
  
  // 👥 Ruoli - MAPPING CORRETTO per posizioni database
  if (filters.roles && filters.roles.length > 0 && filters.roles.length < 4) {
    // Frontend: ['POR','DIF','CEN','ATT'] → Backend: ['GOALKEEPER','DEFENDER','MIDFIELDER','FORWARD']
    const mappedRoles = filters.roles.join(',');
    params.set('roles', mappedRoles);
    console.log('🟢 Ruoli inviati al backend:', mappedRoles); // INFO - rimuovere in produzione
  }
  
  // 👤 Giocatori specifici - RIMOSSO: non più necessario con toggle Team/Player
  
  // ⚡ Status giocatori
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  
  // 🔍 Ricerca (se disponibile)
  if (filters.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  
  // 📊 Normalizzazione e ordinamento
  if (filters.normalize) params.set('normalize', filters.normalize);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.density) params.set('density', filters.density);
  
  // 🔧 FIX: Forza aggregazione per Analytics Advanced
  params.set('aggregate', 'true');
  
  const queryString = params.toString();
  console.log('🟢 Query finale per backend:', queryString); // INFO - rimuovere in produzione
  
  return queryString;
}

/**
 * Confronta due oggetti filtri
 */
export function areFiltersEqual(filters1, filters2) {
  const keys = Object.keys(DEFAULT_FILTERS);
  return keys.every(key => {
    if (key === 'roles') {
      return JSON.stringify(filters1[key]) === JSON.stringify(filters2[key]);
    }
    return filters1[key] === filters2[key];
  });
}
