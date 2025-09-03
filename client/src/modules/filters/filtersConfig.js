// client/src/modules/filters/filtersConfig.js
// Configurazione preset per i filtri

export const FILTERS_PRESETS = {
  ALL: { 
    search: true, 
    period: true, 
    sessionType: true, 
    roles: true, 
    status: true, 
    normalize: true, 
    sortBy: true, 
    density: true 
  }
};

// Valori di default per i filtri
export const DEFAULT_FILTERS = {
  search: "",
  period: "week",
  startDate: null,
  endDate: null,
  sessionType: "all",
  sessionName: "all", // 🆕 NUOVO: Filtro per session_name (dettaglio sessione)
  roles: ["POR", "DIF", "CEN", "ATT"],
  status: "all",

  sortBy: "acwr",
  density: "medium"
};

// Opzioni per i controlli
export const FILTER_OPTIONS = {
  period: [
    { value: "week", label: "Ultima Settimana" },
    { value: "month", label: "Ultimo Mese" },
    { value: "quarter", label: "Ultimo Trimestre" },
    { value: "custom", label: "Personalizzato" }
  ],
  sessionType: [
    { value: "all", label: "Tutte" },
    { value: "training", label: "Allenamento" },
    { value: "match", label: "Partita" }
  ],
  sessionName: [
    { value: "all", label: "Tutte" },
    { value: "Aerobico", label: "Aerobico" },
    { value: "Intermittente", label: "Intermittente" },
    { value: "Campionato/Amichevole", label: "Partita" },
    { value: "Palestra+Campo", label: "Palestra+Campo" },
    { value: "Situazionale", label: "Situazionale" },
    { value: "Pre-gara", label: "Pre-gara" },
    { value: "Rigenerante", label: "Rigenerante" }
  ],
  status: [
    { value: "all", label: "Tutti gli stati" },
    { value: "active", label: "Attivo" },
    { value: "return", label: "Rientro" },
    { value: "injured", label: "OUT" }
  ],
  roles: [
    { value: "POR", label: "Portieri" },
    { value: "DIF", label: "Difensori" },
    { value: "CEN", label: "Centrocampisti" },
    { value: "ATT", label: "Attaccanti" }
  ],

  sortBy: [
    { value: "acwr", label: "ACWR" },
    { value: "plMin", label: "PL/min" },
    { value: "hsr", label: "HSR" },
    { value: "sprintPer90", label: "Sprint/90" },
    { value: "topSpeed", label: "Vel. max" },
    { value: "name", label: "Nome" }
  ],
  density: [
    { value: "compact", label: "Compatta" },
    { value: "medium", label: "Media" },
    { value: "wide", label: "Ampia" }
  ]
};
