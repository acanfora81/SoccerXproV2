import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, BarChart3, FileText, Stethoscope,
  TrendingUp, ShieldCheck, Settings,
  ChevronDown, ChevronRight, Calculator, LogOut, Target
} from "lucide-react";
import useAuthStore from "@/store/authStore";

// Struttura completa del menu come nel client originale
const ALL_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    requiredPermission: null
  },
  {
    id: 'players',
    label: 'Giocatori',
    icon: Users,
    path: '/dashboard/players',
    requiredPermission: 'players:read',
    submenu: [
      { 
        id: 'players-stats', 
        label: 'Statistiche', 
        path: '/dashboard/players/stats',
        requiredPermission: 'players:read'
      },
      { 
        id: 'players', 
        label: 'Gestione Giocatori', 
        path: '/dashboard/players', 
        requiredPermission: 'players:read' 
      },
      { 
        id: 'players-upload', 
        label: 'Importa da File', 
        path: '/dashboard/players/upload',
        requiredPermission: 'players:write'
      }
    ]
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: BarChart3,
    path: '/dashboard/performance',
    requiredPermission: 'performance:read',
    submenu: [
      {
        id: 'performance-dashboard',
        label: 'Dashboard Squadra',
        path: '/dashboard/performance/team',
        requiredPermission: 'performance:analytics'
      },
      {
        id: 'performance-players',
        label: 'Vista Giocatori',
        path: '/dashboard/performance/players',
        requiredPermission: 'performance:analytics'
      },
      {
        id: 'performance-analytics-advanced',
        label: 'Analytics Avanzate',
        path: '/dashboard/performance/analytics',
        requiredPermission: 'performance:analytics'
      },
      {
        id: 'performance-import', 
        label: 'Import Dati',
        path: '/dashboard/performance/import',
        requiredPermission: 'performance:import'
      },
      {
        id: 'performance-reports',
        label: 'Reports',
        path: '/dashboard/performance/reports', 
        requiredPermission: 'performance:export'
      }
    ]
  },
  {
    id: 'contracts',
    label: 'Contratti',
    icon: FileText,
    path: '/dashboard/contracts',
    requiredPermission: 'contracts:read',
    submenu: [
      {
        id: 'contracts-dashboard',
        label: 'Dashboard',
        path: '/dashboard/contracts/dashboard',
        requiredPermission: 'contracts:read'
      },
      {
        id: 'contracts-list',
        label: 'Lista Contratti',
        path: '/dashboard/contracts',
        requiredPermission: 'contracts:read'
      },
      {
        id: 'contracts-expiring',
        label: 'In Scadenza',
        path: '/dashboard/contracts/expiring',
        requiredPermission: 'contracts:read'
      },
      {
        id: 'contracts-summary',
        label: 'Riepilogo Contratti',
        path: '/dashboard/contracts/summary',
        requiredPermission: 'contracts:read'
      },
      {
        id: 'aliquote',
        label: 'Configurazione Fiscale',
        requiredPermission: 'contracts:write',
        submenu: [
          {
            id: 'fiscal-setup',
            label: 'Configuratore Fiscale',
            path: '/dashboard/tax/fiscal-setup',
            requiredPermission: 'contracts:write'
          }
        ]
      },
    ]
  },
  {
    id: 'medical',
    label: 'Area Medica',
    icon: Stethoscope,
    path: '/dashboard/medical',
    requiredPermission: 'medical:read',
    submenu: [
      { 
        id: 'medical-dashboard', 
        label: 'Dashboard', 
        path: '/dashboard/medical/dashboard',
        requiredPermission: 'medical:read'
      },
      { 
        id: 'medical-injuries', 
        label: 'Infortuni', 
        path: '/dashboard/medical/injuries',
        requiredPermission: 'medical:read'
      },
      { 
        id: 'medical-visits', 
        label: 'Visite Mediche', 
        path: '/dashboard/medical/visits',
        requiredPermission: 'medical:write'
      },
      { 
        id: 'medical-calendar', 
        label: 'Calendario', 
        path: '/dashboard/medical/calendar',
        requiredPermission: 'medical:read'
      },
      { 
        id: 'medical-cases', 
        label: 'Casi GDPR', 
        path: '/dashboard/medical/cases',
        requiredPermission: 'medical:confidential'
      },
      { 
        id: 'medical-documents', 
        label: 'Documenti', 
        path: '/dashboard/medical/documents',
        requiredPermission: 'medical:confidential'
      },
      { 
        id: 'medical-consents', 
        label: 'Consensi', 
        path: '/dashboard/medical/consents',
        requiredPermission: 'medical:confidential'
      },
      { 
        id: 'medical-analytics', 
        label: 'Analytics', 
        path: '/dashboard/medical/analytics',
        requiredPermission: 'medical:read'
      },
      { 
        id: 'medical-audit', 
        label: 'Audit', 
        path: '/dashboard/medical/audit',
        requiredPermission: 'medical:audit'
      },
      { 
        id: 'medical-settings', 
        label: 'Impostazioni', 
        path: '/dashboard/medical/settings',
        requiredPermission: 'medical:admin'
      }
    ]
  },
  {
    id: 'scouting',
    label: 'Scouting',
    icon: Target,
    path: '/dashboard/scouting',
    requiredPermission: null, // Temporaneamente senza permessi per test
    submenu: [
      {
        id: 'scouting-prospects',
        label: 'Prospect',
        path: '/dashboard/scouting/prospects',
        requiredPermission: null
      },
      {
        id: 'scouting-sessions',
        label: 'Sessioni',
        path: '/dashboard/scouting/sessions',
        requiredPermission: null
      },
      {
        id: 'scouting-reports',
        label: 'Report',
        path: '/dashboard/scouting/reports',
        requiredPermission: null
      }
    ]
  },
  {
    id: 'market',
    label: 'Mercato / Trasferimenti',
    icon: TrendingUp,
    path: '/dashboard/market',
    requiredPermission: 'market:read',
    submenu: [
      {
        id: 'market-overview',
        label: 'Panoramica',
        path: '/dashboard/market',
        requiredPermission: 'market:read'
      },
      { 
        id: 'market-budget', 
        label: 'Budget',
        path: '/dashboard/market/budget',
        requiredPermission: 'market:write'
      },
      { 
        id: 'market-targets', 
        label: 'Obiettivi',
        path: '/dashboard/market/obiettivi',
        requiredPermission: 'market:write'
      },
      {
        id: 'market-agents',
        label: 'Agenti',
        path: '/dashboard/market/agenti',
        requiredPermission: 'market:write'
      },
      {
        id: 'market-negotiations-new',
        label: 'Gestione Trattative',
        path: '/dashboard/market/trattative-nuove',
        requiredPermission: 'market:write'
      },
      {
        id: 'market-offers',
        label: 'Offerte',
        path: '/dashboard/market/offerte',
        requiredPermission: 'market:read'
      }
    ]
  },
  {
    id: 'administration',
    label: 'Amministrazione',
    icon: ShieldCheck,
    path: '/dashboard/administration',
    requiredPermission: 'admin:read',
    submenu: [
      { 
        id: 'admin-budget', 
        label: 'Budget', 
        path: '/dashboard/administration/budget',
        requiredPermission: 'admin:budget'
      },
      { 
        id: 'admin-expenses', 
        label: 'Spese', 
        path: '/dashboard/administration/expenses',
        requiredPermission: 'admin:write'
      },
      { 
        id: 'admin-users', 
        label: 'Utenti', 
        path: '/dashboard/administration/users',
        requiredPermission: 'user:management'
      }
    ]
  },
  {
    id: 'security',
    label: 'Sicurezza 2FA',
    icon: ShieldCheck,
    path: '/dashboard/security/2fa',
    requiredPermission: null
  },
  {
    id: 'utilities',
    label: 'Utilità di Sistema',
    icon: Settings,
    path: '/dashboard/utilities',
    requiredPermission: 'contracts:write',
    submenu: [
    ]
  }
];

// Funzione per tradurre i ruoli utente
const translateUserRole = (role) => {
  const roleMap = {
    'ADMIN': 'Amministratore',
    'MANAGER': 'Manager',
    'COACH': 'Allenatore',
    'PLAYER': 'Giocatore',
    'USER': 'Utente',
    'SUPER_ADMIN': 'Super Amministratore',
    'TECHNICAL': 'Tecnico',
    'MEDICAL': 'Medico',
    'SCOUT': 'Osservatore'
  };
  return roleMap[role] || role || 'Utente';
};

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState(new Set());
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  // Per ora mostriamo tutti i menu (senza controllo permessi)
  const menuItems = ALL_MENU_ITEMS;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMenuToggle = (menuId) => {
    setOpenMenus(prev => {
      const newOpenMenus = new Set(prev);
      if (newOpenMenus.has(menuId)) {
        newOpenMenus.delete(menuId);
      } else {
        newOpenMenus.add(menuId);
      }
      return newOpenMenus;
    });
  };

  const buildPath = (p) => {
    if (!p) return '';
    if (p.startsWith('/app/')) return p;
    if (p.startsWith('/')) return `/app${p}`;
    return `/app/${p}`;
  };

  const renderMenuItem = (item, level = 0) => {
    const Icon = item.icon;
    const isMenuOpen = openMenus.has(item.id);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const paddingLeft = level * 16;

    return (
      <div key={item.id} className="nav-item-group">
        {hasSubmenu ? (
          // Menu con submenu
          <div 
            className="nav-item cursor-pointer"
            onClick={() => handleMenuToggle(item.id)}
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {Icon && <Icon size={20} />}
            <span className="nav-label">{item.label}</span>
            <div className="menu-toggle-icon">
              {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>
        ) : (
          // Menu senza submenu
          <NavLink 
            to={buildPath(item.path)}
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {Icon && <Icon size={20} />}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        )}
        
        {hasSubmenu && isMenuOpen && (
          <div className="submenu">
            {item.submenu.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col py-6 px-3 transition-colors duration-300">
      {/* Logo / Title */}
      <div className="px-4 mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Soccer X Pro
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Soccer Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* User info e logout */}
      <div className="mt-auto px-4 py-4 border-t border-gray-200 dark:border-white/10">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            {user.role && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {translateUserRole(user.role)}
              </p>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors font-medium"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}