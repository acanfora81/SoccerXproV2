// client/src/components/layout/MainLayout.jsx
// Layout principale con sidebar RBAC-aware per Soccer X Pro Suite

import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';
import useAuthStore from '../../store/authStore';
import '../../styles/logo.css';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Activity, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  Stethoscope,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Calculator
} from 'lucide-react';

// Mappa completa di tutti i menu possibili con permessi richiesti
const ALL_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    requiredPermission: null // Tutti possono vedere la dashboard
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
      { id: 'players', label: 'Gestione Giocatori', path: '/dashboard/players', requiredPermission: 'players:read' },
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
        id: 'medical-reports', 
        label: 'Rapporti', 
        path: '/dashboard/medical/reports',
        requiredPermission: 'medical:confidential'
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
  }
  ,
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

// Funzione per verificare se un utente ha un permesso
const hasPermission = (userRole, requiredPermission) => {
  if (!requiredPermission) return true; // Menu pubblico
  
  // Mappa semplificata ruoli -> permessi (sincronizza con backend)
  const rolePermissions = {
    'ADMIN': ['players:read', 'players:write', 'performance:read', 'performance:write', 'performance:import', 'performance:export', 'performance:analytics', 'contracts:read', 'contracts:write', 'contracts:approve', 'medical:read', 'medical:write', 'medical:confidential', 'market:read', 'market:write', 'scout:reports', 'admin:read', 'admin:write', 'admin:budget', 'user:management', 'audit:read'],
    
    'DIRECTOR_SPORT': ['players:read', 'players:write', 'performance:read', 'performance:analytics', 'contracts:read', 'contracts:write', 'contracts:approve', 'medical:read', 'admin:read', 'market:read', 'market:write', 'scout:reports', 'audit:read'],
    
    'MEDICAL_STAFF': ['players:read', 'medical:read', 'medical:write', 'medical:confidential', 'performance:read'],
    
    'SECRETARY': ['players:read', 'contracts:read', 'contracts:write', 'admin:read', 'admin:write', 'market:read'],
    
    'SCOUT': ['players:read', 'market:read', 'market:write', 'scout:reports'],
    
    'PREPARATORE_ATLETICO': ['players:read', 'performance:read', 'performance:write', 'performance:import', 'performance:export', 'performance:analytics', 'medical:read', 'audit:read']
  };
  
  const userPermissions = rolePermissions[userRole] || [];
  return userPermissions.includes(requiredPermission);
};

// Funzione per filtrare menu items in base ai permessi
const filterMenuItems = (menuItems, userRole) => {
  return menuItems.filter(item => {
    // Controlla permesso menu principale
    if (!hasPermission(userRole, item.requiredPermission)) {
      return false;
    }
    
    // Filtra submenu se presenti
    if (item.submenu) {
      item.submenu = item.submenu.filter(subItem => 
        hasPermission(userRole, subItem.requiredPermission)
      );
    }
    
    return true;
  });
};

const MainLayout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState(new Set());
  const location = useLocation();
  
  // 🪝 Ottieni dati utente reali dallo store
  const { user } = useAuthStore();

  console.log('🔵 MainLayout: dati utente', user); // INFO DEV - rimuovere in produzione

  // Filtra menu in base al ruolo utente
  const userRole = user?.role || 'GUEST';
  const menuItems = filterMenuItems(ALL_MENU_ITEMS, userRole);
  
  console.log('🔵 Menu filtrati per ruolo:', userRole, '- Visibili:', menuItems.length); // INFO DEV - rimuovere in produzione

  // 🚪 Handler logout - usa la funzione passata da App.jsx
  const handleLogout = () => {
    console.log('🔵 MainLayout: logout richiesto'); // INFO DEV - rimuovere in produzione
    if (onLogout) {
      onLogout();
    }
  };

  // 📱 Handler toggle menu (apre/chiude sottomenu)
  const handleMenuToggle = (menuId) => {
    console.log('🔵 MainLayout: toggle menu', menuId); // INFO DEV - rimuovere in produzione
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 👤 Calcola nome e iniziali dell'utente reale
  const getUserDisplayName = () => {
    if (!user) return 'Utente';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    } else {
      return 'Utente';
    }
  };

  // 🔤 Calcola iniziali dell'utente
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    } else {
      return 'U';
    }
  };

  // 🎭 Traduzione ruolo per display
  const getRoleDisplay = (role) => {
    const roleMap = {
      'ADMIN': 'Amministratore',
      'DIRECTOR_SPORT': 'Direttore Sportivo',
      'MEDICAL_STAFF': 'Staff Medico',
      'SECRETARY': 'Segreteria',
      'SCOUT': 'Scout',
      'PREPARATORE_ATLETICO': 'Preparatore Atletico'
    };
    
    return roleMap[role] || role || 'Utente';
  };

  // 🔎 Ricava il titolo pagina dal pathname corrente
  const getPageTitle = () => {
    const pathname = location.pathname;
    
    // Cerca il menu item che corrisponde al pathname corrente
    for (const item of menuItems) {
      if (item.path === pathname) return item.label;
      
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.path === pathname) return subItem.label;
          
          if (subItem.submenu) {
            for (const nestedItem of subItem.submenu) {
              if (nestedItem.path === pathname) return nestedItem.label;
            }
          }
        }
      }
    }
    
    // Fallback per route speciali
    if (pathname.startsWith('/dashboard/performance/dossier/')) return 'Dossier Giocatore';
    if (pathname === '/dashboard/performance/compare') return 'Confronto Giocatori';
    if (pathname === '/dashboard/tax/calculator') return 'Calcolatore Fiscale';
    
    return 'Soccer X Pro Suite';
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Logo size="large" showText={false} className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isMenuOpen = openMenus.has(item.id);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            
            return (
              <div key={item.id} className="nav-item-group">
                {hasSubmenu ? (
                  // Menu con submenu - usa div per toggle
                  <div 
                    className="nav-item"
                    onClick={() => handleMenuToggle(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon size={20} />
                    <span className="nav-label">{item.label}</span>
                    <div className="menu-toggle-icon">
                      {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                ) : (
                  // Menu senza submenu - usa NavLink
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                )}
                
                {hasSubmenu && isMenuOpen && (
                  <div className="submenu">
                    {item.submenu.map(subItem => {
                      const hasNestedSubmenu = subItem.submenu && subItem.submenu.length > 0;
                      const isNestedMenuOpen = openMenus.has(subItem.id);
                      
                      return (
                        <div key={subItem.id}>
                          {hasNestedSubmenu ? (
                            // Submenu con nested submenu - usa div per toggle
                            <div 
                              className="submenu-item"
                              onClick={() => handleMenuToggle(subItem.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="submenu-label">{subItem.label}</span>
                              <div className="menu-toggle-icon">
                                {isNestedMenuOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </div>
                            </div>
                          ) : (
                            // Submenu senza nested - usa NavLink
                            <NavLink 
                              to={subItem.path}
                              className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                            >
                              <span className="submenu-label">{subItem.label}</span>
                            </NavLink>
                          )}
                          
                          {hasNestedSubmenu && isNestedMenuOpen && (
                            <div className="nested-submenu">
                              {subItem.submenu.map(nestedItem => (
                                <NavLink 
                                  key={nestedItem.id}
                                  to={nestedItem.path}
                                  className={({ isActive }) => `nested-submenu-item ${isActive ? 'active' : ''}`}
                                >
                                  <span className="nested-submenu-label">{nestedItem.label}</span>
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Toggle tema posizionato sopra le informazioni utente */}
        <div 
          className="theme-toggle-container"
          style={{
            padding: '15px 20px',
            borderTop: '1px solid var(--border-color)',
            display: sidebarOpen ? 'flex' : 'none',
            justifyContent: 'center',
            width: '100%',
            marginBottom: '10px'
          }}
        >
          <ThemeToggle />
        </div>

        {/* Pulsante di toggle sidebar */}
        <div className="sidebar-toggle-container">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitials()}
            </div>
            <div className="user-details">
              <div className="user-name">{getUserDisplayName()}</div>
              <div className="user-role">{getRoleDisplay(user?.role)}</div>
            </div>
          </div>
          
          <div className="sidebar-actions">
            <button className="action-btn" title="Impostazioni">
              <Settings size={18} />
            </button>
            <button className="action-btn logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="main-header">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">
            {getPageTitle()}
          </h1>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;