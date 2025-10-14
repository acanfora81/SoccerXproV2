// =============================================
// 🧭 SECTION NAMES MAP — SOCCER X PRO SUITE
// =============================================
// Mappa tra pathname e nome leggibile per i loader
// ORDINE IMPORTANTE: percorsi più specifici PRIMA di quelli generici
// =============================================

export const SECTION_NAMES = [
  // Performance - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/performance/analytics", name: "Analytics Avanzate" },
  { path: "/app/dashboard/performance/dossier", name: "Dati Giocatore" },
  { path: "/app/dashboard/performance/compare", name: "Confronto Giocatori" },
  { path: "/app/dashboard/performance/import", name: "Import Dati" },
  { path: "/app/dashboard/performance/reports", name: "Reports" },
  { path: "/app/dashboard/performance/players", name: "Vista Giocatori" },
  { path: "/app/dashboard/performance/team", name: "Dashboard Squadra" },
  { path: "/app/dashboard/performance", name: "Performance" },
  
  // Players - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/players/module", name: "Dati Giocatore" },
  { path: "/app/dashboard/players/upload", name: "Importa da File" },
  { path: "/app/dashboard/players/stats", name: "Statistiche" },
  { path: "/app/dashboard/players", name: "Gestione Giocatori" },
  
  // Contracts - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/contracts/summary", name: "Riepilogo Contratti" },
  { path: "/app/dashboard/contracts/expiring", name: "In Scadenza" },
  { path: "/app/dashboard/contracts/dashboard", name: "Dashboard" },
  { path: "/app/dashboard/contracts", name: "Lista Contratti" },
  
  // Tax/Fiscal - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/tax/calculator", name: "Calcolatore Fiscale" },
  { path: "/app/dashboard/taxrates/list", name: "Aliquote Stipendi" },
  { path: "/app/dashboard/bonustaxrates/list", name: "Aliquote Bonus" },
  { path: "/app/dashboard/tax/irpef-brackets", name: "Scaglioni IRPEF" },
  { path: "/app/dashboard/tax/municipal-additionals", name: "Addizionali Comunali" },
  { path: "/app/dashboard/tax/regional-additionals", name: "Addizionali Regionali" },
  
  // Medical - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/medical/dashboard", name: "Dashboard" },
  { path: "/app/dashboard/medical/injuries", name: "Infortuni" },
  { path: "/app/dashboard/medical/visits", name: "Visite Mediche" },
  { path: "/app/dashboard/medical/calendar", name: "Calendario" },
  { path: "/app/dashboard/medical/cases", name: "Casi GDPR" },
  { path: "/app/dashboard/medical/documents", name: "Documenti" },
  { path: "/app/dashboard/medical/consents", name: "Consensi" },
  { path: "/app/dashboard/medical/analytics", name: "Analytics" },
  { path: "/app/dashboard/medical/audit", name: "Audit" },
  { path: "/app/dashboard/medical/settings", name: "Impostazioni" },
  { path: "/app/dashboard/medical", name: "Area Medica" },
  
  // Market/Scouting - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/market/trattative", name: "Trattative" },
  { path: "/app/dashboard/market/offerte", name: "Offerte" },
  { path: "/app/dashboard/market/obiettivi", name: "Obiettivi" },
  { path: "/app/dashboard/market/scouting", name: "Scouting" },
  { path: "/app/dashboard/market/agenti", name: "Agenti" },
  { path: "/app/dashboard/market/trattative-nuove", name: "Gestione Trattative" },
  { path: "/app/dashboard/market/budget", name: "Budget" },
  { path: "/app/dashboard/market", name: "Panoramica" },
  
  // Administration - percorsi specifici prima (nomi esatti dalla sidebar)
  { path: "/app/dashboard/administration/budget", name: "Budget" },
  { path: "/app/dashboard/administration/expenses", name: "Spese" },
  { path: "/app/dashboard/administration/users", name: "Utenti" },
  { path: "/app/dashboard/administration", name: "Amministrazione" },
  
  // Security
  { path: "/app/dashboard/security/2fa", name: "Sicurezza 2FA" },
  
  // Utilities
  { path: "/app/dashboard/utilities", name: "Utilità di Sistema" },
  
  // Dashboard principale (generico per ultimo)
  { path: "/app/dashboard", name: "Dashboard" },
];

// Default fallback
export const DEFAULT_SECTION_NAME = "dati";
