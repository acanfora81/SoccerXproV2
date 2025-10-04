import React from "react";
import {
  LayoutDashboard, Users, BarChart3, FileText, Stethoscope,
  TrendingUp, ShieldCheck, Lock, Settings
} from "lucide-react";

const items = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "players", label: "Giocatori", icon: Users },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "contracts", label: "Contratti", icon: FileText },
  { key: "medical", label: "Area Medica", icon: Stethoscope },
  { key: "market", label: "Mercato", icon: TrendingUp },
  { key: "admin", label: "Amministrazione", icon: ShieldCheck },
  { key: "security", label: "Sicurezza 2FA", icon: Lock },
  { key: "system", label: "Utilità di Sistema", icon: Settings },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-64 bg-white/80 dark:bg-[#0f1424]/80 backdrop-blur-md border-r border-gray-200 dark:border-white/10 flex flex-col p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Athlos Suite Pro</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Soccer Management</p>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${active===key
                ? "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-wow"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
