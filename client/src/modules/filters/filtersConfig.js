// client/src/modules/filters/filtersConfig.js
// Configurazione preset per i filtri

export const FILTERS_PRESETS = {
  ALL: { 
    search: true, 
    period: true, 
    sessionType: true, 
    roles: true, 
    normalize: true
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
  roles: ["POR", "DIF", "CEN", "ATT"]
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
  roles: [
    { value: "POR", label: "Portieri" },
    { value: "DIF", label: "Difensori" },
    { value: "CEN", label: "Centrocampisti" },
    { value: "ATT", label: "Attaccanti" }
  ],

};
