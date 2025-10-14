// 🔐 server/src/constants/errors.js
// Codici errore centralizzati per consistency

/**
 * 🚨 Codici errore autenticazione
 */
const AUTH_ERRORS = {
  // Token errors
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN', 
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_MALFORMED: 'TOKEN_MALFORMED',
  
  // Profile errors
  PROFILE_REQUIRED: 'PROFILE_REQUIRED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_INACTIVE: 'PROFILE_INACTIVE',
  
  // Account errors
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_INSUFFICIENT: 'ROLE_INSUFFICIENT',
  
  // System errors
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * 🔧 Codici errore API generici
 */
const API_ERRORS = {
  // Input validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
};

/**
 * 💼 Codici errore business specifici
 */
const BUSINESS_ERRORS = {
  // Contratti
  CONTRACT_EXPIRED: 'CONTRACT_EXPIRED',
  CONTRACT_NOT_RENEWABLE: 'CONTRACT_NOT_RENEWABLE',
  CONTRACT_ALREADY_SIGNED: 'CONTRACT_ALREADY_SIGNED',
  
  // Trasferimenti
  TRANSFER_WINDOW_CLOSED: 'TRANSFER_WINDOW_CLOSED',
  PLAYER_ALREADY_TRANSFERRED: 'PLAYER_ALREADY_TRANSFERRED',
  INSUFFICIENT_BUDGET: 'INSUFFICIENT_BUDGET',
  
  // Area medica
  MEDICAL_CLEARANCE_REQUIRED: 'MEDICAL_CLEARANCE_REQUIRED',
  PLAYER_INJURED: 'PLAYER_INJURED',
  MEDICAL_DATA_CONFIDENTIAL: 'MEDICAL_DATA_CONFIDENTIAL',
  
  // Scouting
  SCOUT_REPORT_OUTDATED: 'SCOUT_REPORT_OUTDATED',
  PLAYER_NOT_SCOUTEABLE: 'PLAYER_NOT_SCOUTEABLE'
};

/**
 * 📱 HTTP Status Code mapping
 */
const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * 🗺️ Mapping completo: Status → Code → Message → Details
 * Struttura centralizzata per consistency e i18n
 */
const ERROR_DEFINITIONS = {
  // 401 Unauthorized
  401: {
    [AUTH_ERRORS.MISSING_TOKEN]: {
      message: 'Token di autenticazione richiesto',
      message_en: 'Authentication token required',
      details: 'Fornire token Bearer nell\'header Authorization'
    },
    [AUTH_ERRORS.INVALID_TOKEN]: {
      message: 'Token non valido',
      message_en: 'Invalid token',
      details: 'Token malformato o non riconosciuto'
    },
    [AUTH_ERRORS.TOKEN_EXPIRED]: {
      message: 'Token scaduto',
      message_en: 'Token expired', 
      details: 'Client deve rinnovare il token tramite refresh'
    }
  },
  
  // 403 Forbidden
  403: {
    [AUTH_ERRORS.PROFILE_REQUIRED]: {
      message: 'Profilo utente non configurato',
      message_en: 'User profile not configured',
      details: 'Contattare amministratore per attivazione account'
    },
    [AUTH_ERRORS.ACCOUNT_DISABLED]: {
      message: 'Account disattivato',
      message_en: 'Account disabled',
      details: 'Account temporaneamente sospeso'
    },
    [AUTH_ERRORS.FORBIDDEN]: {
      message: 'Accesso negato',
      message_en: 'Access denied',
      details: 'Privilegi insufficienti per questa operazione'
    },
    [AUTH_ERRORS.PERMISSION_DENIED]: {
      message: 'Permesso insufficiente',
      message_en: 'Insufficient permission',
      details: 'Ruolo utente non autorizzato'
    }
  },
  
  // 400 Bad Request
  400: {
    [API_ERRORS.VALIDATION_FAILED]: {
      message: 'Validazione dati fallita',
      message_en: 'Data validation failed',
      details: 'Verificare formato e contenuto dei campi'
    },
    [API_ERRORS.REQUIRED_FIELD_MISSING]: {
      message: 'Campo obbligatorio mancante',
      message_en: 'Required field missing',
      details: 'Compilare tutti i campi richiesti'
    }
  },
  
  // 404 Not Found  
  404: {
    [API_ERRORS.RESOURCE_NOT_FOUND]: {
      message: 'Risorsa non trovata',
      message_en: 'Resource not found',
      details: 'ID risorsa inesistente o eliminata'
    }
  },
  
  // 409 Conflict
  409: {
    [API_ERRORS.EMAIL_ALREADY_EXISTS]: {
      message: 'Email già registrata',
      message_en: 'Email already exists',
      details: 'Provare con un indirizzo email differente'
    },
    [API_ERRORS.RESOURCE_ALREADY_EXISTS]: {
      message: 'Risorsa già esistente',
      message_en: 'Resource already exists',
      details: 'Utilizzare PUT per aggiornamento'
    },
    [BUSINESS_ERRORS.CONTRACT_ALREADY_SIGNED]: {
      message: 'Contratto già firmato',
      message_en: 'Contract already signed',
      details: 'Impossibile modificare contratto firmato'
    }
  },
  
  // 422 Unprocessable Entity
  422: {
    [BUSINESS_ERRORS.CONTRACT_EXPIRED]: {
      message: 'Contratto scaduto',
      message_en: 'Contract expired',
      details: 'Rinnovare contratto prima di procedere'
    },
    [BUSINESS_ERRORS.INSUFFICIENT_BUDGET]: {
      message: 'Budget insufficiente',
      message_en: 'Insufficient budget',
      details: 'Importo supera budget disponibile'
    },
    [BUSINESS_ERRORS.TRANSFER_WINDOW_CLOSED]: {
      message: 'Finestra trasferimenti chiusa',
      message_en: 'Transfer window closed',
      details: 'Operazione disponibile solo durante mercato'
    }
  },
  
  // 429 Too Many Requests
  429: {
    [API_ERRORS.RATE_LIMIT_EXCEEDED]: {
      message: 'Limite richieste superato',
      message_en: 'Rate limit exceeded',
      details: 'Attendere prima di riprovare'
    }
  },
  
  // 500 Internal Server Error
  500: {
    [AUTH_ERRORS.AUTH_ERROR]: {
      message: 'Errore interno autenticazione',
      message_en: 'Internal authentication error',
      details: 'Riprovare o contattare supporto'
    },
    [API_ERRORS.DATABASE_ERROR]: {
      message: 'Errore database',
      message_en: 'Database error',
      details: 'Problema temporaneo di connessione'
    }
  }
};

/**
 * 🎯 Helper migliorato per creare response errore
 * Usa mapping centralizzato e supporta i18n
 */
function createErrorResponse(code, customMessage = null, details = null, language = 'it') {
  // Trova definizione errore nel mapping
  let errorDef = null;
  let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  for (const [statusCode, errors] of Object.entries(ERROR_DEFINITIONS)) {
    if (errors[code]) {
      status = parseInt(statusCode);
      errorDef = errors[code];
      break;
    }
  }
  
  // Fallback se errore non trovato nel mapping
  if (!errorDef) {
    console.warn(`⚠️ Errore non mappato: ${code}`);
    errorDef = {
      message: 'Errore sconosciuto',
      message_en: 'Unknown error',
      details: 'Codice errore non riconosciuto'
    };
  }
  
  // Seleziona messaggio in base alla lingua
  const messageKey = language === 'en' ? 'message_en' : 'message';
  const message = customMessage || errorDef[messageKey] || errorDef.message;
  
  return {
    status,
    body: {
      error: message,
      code,
      details: details || errorDef.details,
      timestamp: new Date().toISOString(),
      language
    }
  };
}

module.exports = {
  AUTH_ERRORS,
  API_ERRORS, 
  BUSINESS_ERRORS,
  HTTP_STATUS,
  ERROR_DEFINITIONS,
  createErrorResponse
};