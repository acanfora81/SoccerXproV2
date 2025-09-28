/**
 * Mappa ufficiale icone SoccerXPro
 * Libreria usata:
 *  - lucide-react (tutte le icone per coerenza e controllo CSS)
 */

import {
  FileText,
  Copy,
  FileSpreadsheet,
  Upload,
  CheckSquare,
  Activity,
  BarChart,
  Zap,
  ChevronsUpDown,
  Heart,
  ClipboardCheck,
  CalendarCheck,
  Users,
  Settings,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search,
  X,
  Plus,
  Edit3,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  Square,
  AlertTriangle,
  Clock,
  Calendar,
  Dumbbell,
  Gauge,
  CircleDot
} from "lucide-react";

// Tutte le icone sono da lucide-react per coerenza e controllo CSS completo

export const ICONS = {
  // =========================
  // Azioni generiche
  // =========================
  add: FileText,             // es: Aggiungi, Dossier
  compare: Copy,             // es: Confronta
  export: FileSpreadsheet,   // es: Esporta Excel
  import: Upload,            // es: Importa dati
  selectAll: CheckSquare,    // es: Seleziona tutti
  edit: Edit3,              // es: Modifica
  delete: Trash2,           // es: Elimina
  save: Save,               // es: Salva
  close: X,                 // es: Chiudi
  addNew: Plus,             // es: Aggiungi nuovo
  refresh: RefreshCw,       // es: Aggiorna
  download: Download,       // es: Download
  view: Eye,                // es: Visualizza
  hide: EyeOff,             // es: Nascondi
  filter: Filter,           // es: Filtri
  search: Search,           // es: Cerca
  settings: Settings,       // es: Impostazioni
  back: ArrowLeft,          // es: Indietro
  next: ArrowRight,         // es: Avanti
  expand: ChevronDown,      // es: Espandi
  collapse: ChevronUp,      // es: Comprimi
  more: MoreHorizontal,     // es: Altro
  maximize: Maximize2,      // es: Massimizza
  minimize: Minimize2,      // es: Minimizza
  select: CheckSquare,      // es: Seleziona
  unselect: Square,         // es: Deseleziona
  warning: AlertTriangle,   // es: Avviso
  time: Clock,              // es: Tempo
  date: Calendar,           // es: Data

  // =========================
  // KPI Performance
  // =========================
  sessions: Activity,        // es: Sessioni totali
  load: Activity,            // es: Player load
  training: Dumbbell,        // es: Allenamenti totali
  matches: CircleDot,        // es: Partite giocate (sostituisce SoccerBall)
  speed: Gauge,              // es: Velocità media/max
  sessionsTotal: CalendarCheck, // es: Sessioni totali (alternativa)
  players: Users,            // es: Giocatori

  // =========================
  // Analytics Avanzate
  // =========================
  volumes: BarChart,         // es: Carico & Volumi
  intensity: Activity,       // es: Intensità
  sprints: Zap,              // es: Alta velocità & Sprint
  accelDecel: ChevronsUpDown,// es: Accel/Decel
  cardio: Heart,             // es: Cardio
  readiness: ClipboardCheck, // es: Readiness
  target: Target,            // es: Obiettivi
  trendUp: TrendingUp,       // es: Trend positivo
  trendDown: TrendingDown,   // es: Trend negativo
  neutral: Minus,            // es: Trend neutro
  premium: Crown,            // es: Premium/Pro
  arrowUp: ArrowUpRight,     // es: Freccia su
  arrowDown: ArrowDownRight, // es: Freccia giù
  layers: Layers,            // es: Livelli
  compare: ArrowLeftRight,   // es: Confronto

  // =========================
  // Navigazione e UI
  // =========================
  dashboard: BarChart,       // es: Dashboard
  analytics: Activity,       // es: Analytics
  reports: FileText,         // es: Reports
  team: Users,               // es: Squadra
  performance: Zap,          // es: Performance
  medical: Heart,            // es: Area Medica
  contracts: FileText,       // es: Contratti
  market: Target,            // es: Mercato
  admin: Settings,           // es: Amministrazione
  utilities: Settings,       // es: Utilità
};

// =========================
// Helper per dimensioni standard
// =========================
export const ICON_SIZES = {
  xs: 12,    // Icone molto piccole
  sm: 14,    // Icone piccole (pulsanti compatti)
  md: 16,    // Icone medie (pulsanti standard)
  lg: 18,    // Icone grandi (KPI cards)
  xl: 20,    // Icone extra grandi (header)
  xxl: 24,   // Icone molto grandi (featured)
};

// =========================
// Helper per colori standard
// =========================
export const ICON_COLORS = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-text-secondary)',
  muted: 'var(--color-text-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  white: 'var(--text-on-accent)',
};
