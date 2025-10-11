// server/src/utils/permissions.js
// MODIFICA: Aggiungi PREPARATORE_ATLETICO e suoi permessi

/**
 * 🎯 Definizione ruoli del sistema - AGGIORNATO
 */
const ROLES = {
  ADMIN: 'ADMIN',
  DIRECTOR_SPORT: 'DIRECTOR_SPORT', 
  MEDICAL_STAFF: 'MEDICAL_STAFF',
  SECRETARY: 'SECRETARY',
  SCOUT: 'SCOUT',
  PREPARATORE_ATLETICO: 'PREPARATORE_ATLETICO', // 🟢 NUOVO RUOLO
  GUEST: 'GUEST'
};

/**
 * 🔥 Nuovi permessi per Performance Analytics
 */
const PERMISSIONS = {
  // 👤 Gestione Giocatori (esistenti)
  PLAYERS_READ: 'players:read',
  PLAYERS_WRITE: 'players:write',
  PLAYERS_DELETE: 'players:delete',
  
  // 📊 NUOVI: Performance Analytics
  PERFORMANCE_READ: 'performance:read',
  PERFORMANCE_WRITE: 'performance:write',
  PERFORMANCE_DELETE: 'performance:delete',
  PERFORMANCE_IMPORT: 'performance:import',
  PERFORMANCE_EXPORT: 'performance:export',
  PERFORMANCE_ANALYTICS: 'performance:analytics',
  
  // 📋 Gestione Contratti (esistenti)
  CONTRACTS_READ: 'contracts:read',
  CONTRACTS_WRITE: 'contracts:write',
  CONTRACTS_DELETE: 'contracts:delete',
  CONTRACTS_APPROVE: 'contracts:approve',
  
  // 🥼 Area Medica (esistenti)
  MEDICAL_READ: 'medical:read',
  MEDICAL_WRITE: 'medical:write',
  MEDICAL_DELETE: 'medical:delete',
  MEDICAL_CONFIDENTIAL: 'medical:confidential',
  
  // 💰 Amministrazione (esistenti)
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write', 
  ADMIN_DELETE: 'admin:delete',
  ADMIN_BUDGET: 'admin:budget',
  
  // 📄 Mercato e Scouting (esistenti)
  MARKET_READ: 'market:read',
  MARKET_WRITE: 'market:write',
  MARKET_DELETE: 'market:delete',
  SCOUT_REPORTS: 'scout:reports',
  
  // ⚙️ Sistema (esistenti)
  SYSTEM_ADMIN: 'system:admin',
  AUDIT_READ: 'audit:read',
  USER_MANAGEMENT: 'user:management'
};

/**
 * 🗂️ Matrice Ruoli → Permessi - AGGIORNATA
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access a tutto
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.DIRECTOR_SPORT]: [
    // Gestione sportiva completa
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.PLAYERS_WRITE,
    PERMISSIONS.PERFORMANCE_READ,
    PERMISSIONS.PERFORMANCE_ANALYTICS,
    PERMISSIONS.CONTRACTS_READ,
    PERMISSIONS.CONTRACTS_WRITE,
    PERMISSIONS.CONTRACTS_APPROVE,
    PERMISSIONS.MEDICAL_READ,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.MARKET_READ,
    PERMISSIONS.MARKET_WRITE,
    PERMISSIONS.SCOUT_REPORTS,
    PERMISSIONS.AUDIT_READ
  ],
  
  [ROLES.MEDICAL_STAFF]: [
    // Solo area medica + lettura giocatori
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.MEDICAL_READ,
    PERMISSIONS.MEDICAL_WRITE,
    PERMISSIONS.MEDICAL_CONFIDENTIAL,
    PERMISSIONS.PERFORMANCE_READ // Per correlazioni infortuni
  ],
  
  [ROLES.SECRETARY]: [
    // Amministrazione + supporto contratti
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.CONTRACTS_READ,
    PERMISSIONS.CONTRACTS_WRITE,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.MARKET_READ
  ],
  
  [ROLES.SCOUT]: [
    // Solo scouting e lettura giocatori/mercato
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.MARKET_READ,
    PERMISSIONS.MARKET_WRITE,
    PERMISSIONS.SCOUT_REPORTS
  ],

  // 🟢 NUOVO: Preparatore Atletico - Focus su Performance
  [ROLES.PREPARATORE_ATLETICO]: [
    PERMISSIONS.PLAYERS_READ,           // Legge lista giocatori
    PERMISSIONS.PERFORMANCE_READ,       // Visualizza dati performance
    PERMISSIONS.PERFORMANCE_WRITE,      // Modifica dati performance
    PERMISSIONS.PERFORMANCE_IMPORT,     // Import CSV/Excel
    PERMISSIONS.PERFORMANCE_EXPORT,     // Export reports
    PERMISSIONS.PERFORMANCE_ANALYTICS,  // Dashboard analytics
    PERMISSIONS.MEDICAL_READ,          // Correlazioni infortuni
    PERMISSIONS.AUDIT_READ             // Log delle attività
  ],
  
  [ROLES.GUEST]: [
    // Nessun permesso
  ]
};

console.log('🟢 [INFO] Sistema RBAC aggiornato con PREPARATORE_ATLETICO'); // INFO - rimuovere in produzione

/**
 * ✅ Verifica se un ruolo ha un permesso specifico
 */
function hasPermission(userRole, permission) {
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  const hasAccess = rolePerms.includes(permission);
  
  console.log(`🔵 [DEBUG] Check permesso: ${userRole} → ${permission} = ${hasAccess}`); // INFO - rimuovere in produzione
  
  return hasAccess;
}

/**
 * 🛡️ Verifica se utente ha uno dei ruoli permessi
 */
function checkRole(user, allowedRoles = []) {
  if (!user || !user.role) {
    console.log('🟡 [WARN] Utente o ruolo mancante'); // WARNING - rimuovere in produzione
    throw new Error('Utente non autenticato');
  }
  
  const userRole = user.role;
  const hasRole = allowedRoles.includes(userRole);
  
  console.log(`🔵 [DEBUG] Check ruolo: ${userRole} in [${allowedRoles.join(', ')}] = ${hasRole}`); // INFO - rimuovere in produzione
  
  if (!hasRole) {
    console.log(`🟡 [WARN] Accesso negato per ruolo: ${userRole}`); // WARNING - rimuovere in produzione
    throw new Error(`Accesso negato. Ruolo richiesto: ${allowedRoles.join(' o ')}`);
  }
  
  return true;
}

/**
 * 🔐 Verifica permesso specifico per l'utente
 */
function checkPermission(user, permission) {
  if (!user || !user.role) {
    console.log('🟡 [WARN] Utente o ruolo mancante per permesso'); // WARNING - rimuovere in produzione
    throw new Error('Utente non autenticato');
  }
  
  const hasAccess = hasPermission(user.role, permission);
  
  if (!hasAccess) {
    console.log(`🟡 [WARN] Permesso negato: ${user.role} → ${permission}`); // WARNING - rimuovere in produzione
    throw new Error(`Permesso negato: ${permission}`);
  }
  
  return true;
}

/**
 * 🎯 Middleware Express per controllo ruoli
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      checkRole(req.user, allowedRoles);
      console.log(`🟢 [INFO] Accesso autorizzato: ${req.user.role}`); // INFO - rimuovere in produzione
      next();
    } catch (error) {
      console.log(`🔴 Accesso negato: ${error.message}`); // ERROR - mantenere essenziali
      
      res.status(403).json({
        error: error.message,
        code: 'FORBIDDEN',
        required_roles: allowedRoles,
        user_role: req.user?.role || 'UNKNOWN'
      });
    }
  };
}

/**
 * 🔐 Middleware Express per controllo permessi
 */
function requirePermission(permission) {
  return (req, res, next) => {
    try {
      checkPermission(req.user, permission);
      console.log(`🟢 [INFO] Permesso autorizzato: ${permission}`); // INFO - rimuovere in produzione
      next();
    } catch (error) {
      console.log(`🔴 Permesso negato: ${error.message}`); // ERROR - mantenere essenziali
      
      res.status(403).json({
        error: error.message,
        code: 'PERMISSION_DENIED',
        required_permission: permission,
        user_role: req.user?.role || 'UNKNOWN'
      });
    }
  };
}

/**
 * 📊 Ottieni tutti i permessi per un ruolo
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 👤 Verifica se utente può accedere ai propri dati o è admin
 */
function canAccessUserData(currentUser, targetUserId) {
  // Admin può accedere a tutto
  if (currentUser.role === ROLES.ADMIN) {
    return true;
  }
  
  // Utente può accedere solo ai propri dati
  return currentUser.id === targetUserId;
}

const requireModuleAccess = (moduleKey) => (req, res, next) => {
  // 🔓 ESCLUSIONE: Le rotte di import sono sempre accessibili (necessarie per caricare dati)
  // Controlla sia req.path che req.url per compatibilità con router Express nidificati
  const fullPath = req.originalUrl || req.url || req.path || '';
  
  // Log di debug temporaneo
  console.log('🔵 [requireModuleAccess] module:', moduleKey, 'path:', fullPath);
  
  if (fullPath.includes('/import/')) {
    console.log('✅ [requireModuleAccess] Import route detected - bypassing module access check');
    return next();
  }
  
  const { plan, modules } = req.user || {};
  const enabled = Array.isArray(modules) ? modules.includes(moduleKey) : true;
  if (!enabled) {
    console.log('❌ [requireModuleAccess] Access denied - module not in plan');
    return res.status(403).json({ success:false, message:`Modulo ${moduleKey} non incluso nel piano` });
  }
  next();
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  checkRole,
  checkPermission,
  requireRole,
  requirePermission,
  getRolePermissions,
  canAccessUserData,
  requireModuleAccess
};