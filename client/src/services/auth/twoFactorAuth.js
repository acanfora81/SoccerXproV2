/**
 * Servizi per la gestione Two-Factor Authentication (TOTP)
 */

const BASE_URL = '/api/auth';

// Helper per gestire le risposte HTTP
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP Error: ${response.status}`);
  }
  return response.json();
};

/**
 * Verifica lo stato attuale del 2FA per l'utente
 * @returns {Promise<{enabled: boolean, setupRequired: boolean}>}
 */
export const getTwoFactorStatus = async () => {
  const response = await fetch(`${BASE_URL}/2fa/status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

/**
 * Inizia il processo di setup 2FA - genera QR code
 * @returns {Promise<{qrCodeUrl: string, secret: string, backupCodes: string[]}>}
 */
export const enrollTwoFactor = async () => {
  const response = await fetch(`${BASE_URL}/2fa/enroll`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

/**
 * Verifica il codice TOTP e completa il setup 2FA
 * @param {string} token - Codice a 6 cifre dal dispositivo TOTP
 * @returns {Promise<{success: boolean, backupCodes: string[]}>}
 */
export const verifyTwoFactorSetup = async (token) => {
  const response = await fetch(`${BASE_URL}/2fa/verify-setup`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return handleResponse(response);
};

/**
 * Verifica un codice TOTP per operazioni sensibili
 * @param {string} token - Codice a 6 cifre dal dispositivo TOTP
 * @returns {Promise<{valid: boolean, sessionToken?: string}>}
 */
export const verifyTwoFactorToken = async (token) => {
  const response = await fetch(`${BASE_URL}/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return handleResponse(response);
};

/**
 * Disabilita il 2FA per l'utente
 * @param {string} token - Codice a 6 cifre per conferma
 * @returns {Promise<{success: boolean}>}
 */
export const disableTwoFactor = async (token) => {
  const response = await fetch(`${BASE_URL}/2fa/disable`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return handleResponse(response);
};

/**
 * Genera nuovi codici di backup
 * @param {string} token - Codice a 6 cifre per conferma
 * @returns {Promise<{backupCodes: string[]}>}
 */
export const generateBackupCodes = async (token) => {
  const response = await fetch(`${BASE_URL}/2fa/backup-codes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return handleResponse(response);
};

/**
 * Invia una richiesta con header 2FA per operazioni sensibili
 * @param {string} url - URL dell'API
 * @param {object} options - Opzioni fetch
 * @param {string} twoFactorToken - Token 2FA
 * @returns {Promise<Response>}
 */
export const fetchWithTwoFactor = async (url, options = {}, twoFactorToken) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (twoFactorToken) {
    headers['X-2FA-Code'] = twoFactorToken;
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
};
