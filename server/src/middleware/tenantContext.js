// server/src/middleware/tenantContext.js
// Middleware Multi-Tenant Context IRROBUSTITO per SoccerXpro V2

const { getPrismaClient } = require('../config/database');

console.log('🟢 Caricamento middleware tenantContext irrobustito...'); // INFO - rimuovere in produzione

/**
 * Middleware per gestione contesto multi-tenant con controlli di sicurezza rigorosi
 */
module.exports = async function tenantContext(req, res, next) {
  try {
    console.log('🔵 tenantContext: verifica contesto team...'); // INFO DEV - rimuovere in produzione

    // 1. Estrazione ID utente con validazione rigorosa
    const userProfileId = 
      req?.user?.profile?.id ??   
      req?.user?.profileId ??     
      req?.user?.id ??            
      req?.auth?.userId ??        
      null;

    // 2. Validazione tipo ID (deve essere numero intero)
    if (!userProfileId || typeof userProfileId !== 'number' || userProfileId <= 0) {
      console.log('🟡 tenantContext: ID utente non valido:', typeof userProfileId, userProfileId); // WARNING - rimuovere in produzione
      return res.status(401).json({ 
        error: 'Sessione non valida',
        code: 'INVALID_SESSION'
      });
    }

    console.log('🔵 tenantContext: verifica utente ID:', userProfileId); // INFO DEV - rimuovere in produzione

    // 3. Query database con timeout e validazioni
    const prisma = getPrismaClient();
    
    let user;
    try {
      // Query con timeout implicito e selezione rigorosa
      user = await prisma.userProfile.findUnique({
        where: { id: userProfileId },
        select: { 
          id: true, 
          role: true, 
          teamId: true,
          is_active: true,        // Controllo attivazione account
          first_name: true,       // Per logging business
          last_name: true,        // Per logging business
          email: true            // Per audit trail
        }
      });
    } catch (dbError) {
      console.log('🔴 tenantContext: errore database:', dbError.message); // ERROR - mantenere essenziali
      return res.status(500).json({ 
        error: 'Errore interno del sistema',
        code: 'DATABASE_ERROR'
      });
    }

    // 4. Validazione esistenza utente
    if (!user) {
      console.log('🔴 tenantContext: utente non trovato nel database:', userProfileId); // ERROR - mantenere per audit
      return res.status(401).json({ 
        error: 'Account non riconosciuto',
        code: 'USER_NOT_FOUND'
      });
    }

    // 5. Validazione account attivo
    if (!user.is_active) {
      console.log('🟡 tenantContext: account disattivato:', user.email); // WARNING - mantenere per audit
      return res.status(403).json({ 
        error: 'Account disattivato. Contattare amministratore.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 6. CONTROLLO CRITICO: Validazione team assignment (SICUREZZA MULTI-TENANT)
    if (!user.teamId || typeof user.teamId !== 'string' || user.teamId.trim() === '') {
      console.log('🔴 SECURITY: utente senza team assegnato:', {
        userId: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim()
      }); // ERROR - mantenere per audit sicurezza
      
      return res.status(403).json({ 
        error: 'Account non configurato per multi-tenancy. Contattare amministratore per assegnazione team.',
        code: 'MISSING_TEAM_ASSIGNMENT',
        details: 'Richiesta configurazione account'
      });
    }

    // 7. Validazione formato teamId (deve essere UUID valido)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.teamId)) {
      console.log('🔴 SECURITY: teamId formato non valido:', user.teamId); // ERROR - mantenere per audit
      return res.status(403).json({ 
        error: 'Configurazione team non valida',
        code: 'INVALID_TEAM_ID'
      });
    }

    // 8. Validazione ruolo utente
    const validRoles = ['ADMIN', 'DIRECTOR_SPORT', 'MEDICAL_STAFF', 'SECRETARY', 'SCOUT', 'PREPARATORE_ATLETICO'];
    if (!validRoles.includes(user.role)) {
      console.log('🟡 tenantContext: ruolo non riconosciuto:', user.role); // WARNING - mantenere per audit
      return res.status(403).json({ 
        error: 'Ruolo utente non valido',
        code: 'INVALID_USER_ROLE'
      });
    }

    // 9. OPZIONALE: Verifica esistenza team nel database (extra sicurezza)
    try {
      const teamExists = await prisma.team.findUnique({
        where: { id: user.teamId },
        select: { id: true, isActive: true }
      });

      if (!teamExists) {
        console.log('🔴 SECURITY: team non esistente nel database:', user.teamId); // ERROR - mantenere per audit
        return res.status(403).json({ 
          error: 'Team non valido',
          code: 'TEAM_NOT_FOUND'
        });
      }

      if (!teamExists.isActive) {
        console.log('🟡 tenantContext: team disattivato:', user.teamId); // WARNING - mantenere per audit
        return res.status(403).json({ 
          error: 'Team temporaneamente sospeso',
          code: 'TEAM_SUSPENDED'
        });
      }
    } catch (teamCheckError) {
      console.log('🟡 tenantContext: warning verifica team:', teamCheckError.message); // WARNING - non bloccare il flusso
      // Non interrompere il flusso per errori di verifica team - il controllo principale è sul teamId
    }

    // 10. Inietta contesto multi-tenant VALIDATO
    req.context = { 
      userId: user.id, 
      role: user.role, 
      teamId: user.teamId,
      userName: `${user.first_name} ${user.last_name}`.trim(),
      userEmail: user.email,
      isActive: user.is_active
    };

    // 11. AUDIT LOG per sicurezza (business logic)
    console.log('🟣 AUDIT: contesto team impostato', {
      userId: user.id,
      email: user.email,
      role: user.role, 
      teamId: user.teamId,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    }); // BUSINESS LOGIC - mantenere per audit

    next();

  } catch (error) {
    console.log('🔴 CRITICAL: tenantContext errore non gestito:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }); // ERROR - mantenere essenziali
    
    return res.status(500).json({ 
      error: 'Errore critico del sistema di sicurezza',
      code: 'TENANT_CONTEXT_CRITICAL_ERROR'
    });
  }
};

/**
 * Middleware opzionale per endpoint che non richiedono team (es. health checks)
 */
const optionalTenantContext = async (req, res, next) => {
  try {
    const userProfileId = req?.user?.profile?.id ?? req?.user?.id ?? null;

    if (!userProfileId) {
      req.context = { userId: null, role: 'GUEST', teamId: null };
      return next();
    }

    const prisma = getPrismaClient();
    const user = await prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: { id: true, role: true, teamId: true, is_active: true }
    });

    req.context = user && user.is_active ? { 
      userId: user.id, 
      role: user.role, 
      teamId: user.teamId || null 
    } : { 
      userId: null, 
      role: 'GUEST', 
      teamId: null 
    };

    console.log('🔵 optionalTenantContext: contesto impostato (opzionale)'); // INFO DEV - rimuovere in produzione
    next();

  } catch (error) {
    console.log('🟡 optionalTenantContext error (non critico):', error.message); // WARNING - rimuovere in produzione
    req.context = { userId: null, role: 'GUEST', teamId: null };
    next();
  }
};

module.exports.optionalTenantContext = optionalTenantContext;
