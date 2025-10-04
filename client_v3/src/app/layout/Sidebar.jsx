import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home, Users, BarChart3, FileText, Stethoscope, TrendingUp, 
  Shield, ShieldCheck, Settings, ChevronDown, ChevronRight, Calculator
} from "lucide-react";

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
        label: 'Visualizza Aliquote',
        requiredPermission: 'contracts:read',
        submenu: [
          {
            id: 'taxrates-list',
            label: 'Aliquote Stipendi',
            path: '/dashboard/taxrates/list',
            requiredPermission: 'contracts:read'
          },
          {
            id: 'bonustaxrates-list',
            label: 'Aliquote Bonus',
            path: '/dashboard/bonustaxrates/list',
            requiredPermission: 'contracts:read'
          },
          {
            id: 'irpef-brackets',
            label: 'Scaglioni IRPEF',
            path: '/dashboard/tax/irpef-brackets',
            requiredPermission: 'contracts:read'
          },
          {
            id: 'regional-additionals',
            label: 'Addizionali Regionali',
            path: '/dashboard/tax/regional-additionals',
            requiredPermission: 'contracts:read'
          },
          {
            id: 'municipal-additionals',
            label: 'Addizionali Comunali',
            path: '/dashboard/tax/municipal-additionals',
            requiredPermission: 'contracts:read'
          }
        ]
      },
      {
        id: 'sistema-fiscale',
        label: 'Sistema Fiscale Parametrico',
        icon: Calculator,
        requiredPermission: 'contracts:write',
        submenu: [
          {
            id: 'tax-calculator',
            label: 'Calcolatore Fiscale',
            path: '/dashboard/tax/calculator',
            requiredPermission: 'contracts:read'
          }
        ]
      }
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
    id: 'market',
    label: 'Mercato',
    icon: TrendingUp,
    path: '/dashboard/market',
    requiredPermission: 'market:read',
    submenu: [
      { 
        id: 'market-transfers', 
        label: 'Trasferimenti', 
        path: '/dashboard/market/transfers',
        requiredPermission: 'market:read'
      },
      { 
        id: 'market-scouting', 
        label: 'Scouting', 
        path: '/dashboard/market/scouting',
        requiredPermission: 'scout:reports'
      },
      { 
        id: 'market-targets', 
        label: 'Obiettivi', 
        path: '/dashboard/market/targets',
        requiredPermission: 'market:write'
      }
    ]
  },
  {
    id: 'administration',
    label: 'Amministrazione',
    icon: Shield,
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
      {
        id: 'setup-aliquote',
        label: 'Setup Aliquote',
        requiredPermission: 'contracts:write',
        submenu: [
          { id: 'taxrates-upload', label: 'Aliquote Stipendi', path: '/dashboard/taxrates/upload', requiredPermission: 'contracts:write' },
          { id: 'bonustaxrates-upload', label: 'Aliquote Bonus', path: '/dashboard/bonustaxrates/upload', requiredPermission: 'contracts:write' },
          { id: 'irpef-upload', label: 'Scaglioni IRPEF', path: '/dashboard/tax/irpef-upload', requiredPermission: 'contracts:write' },
          { id: 'regional-additionals-upload', label: 'Addizionali Regionali', path: '/dashboard/regional-additionals/upload', requiredPermission: 'contracts:write' },
          { id: 'municipal-additionals-upload', label: 'Addizionali Comunali', path: '/dashboard/municipal-additionals/upload', requiredPermission: 'contracts:write' },
          { id: 'tax-config', label: 'Configurazioni Fiscali', path: '/dashboard/tax-config', requiredPermission: 'contracts:write' }
        ]
      }
    ]
  }
];

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState(new Set());

  // Per ora mostriamo tutti i menu (senza controllo permessi)
  const menuItems = ALL_MENU_ITEMS;

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
            <Icon size={20} />
            <span className="nav-label">{item.label}</span>
            <div className="menu-toggle-icon">
              {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>
        ) : (
          // Menu senza submenu
          <NavLink 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <Icon size={20} />
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
          Athlos Suite Pro
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Soccer Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </aside>
  );
}