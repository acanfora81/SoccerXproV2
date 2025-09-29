/**
 * Servizio per la gestione Two-Factor Authentication (TOTP)
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

/**
 * Genera una chiave segreta TOTP per un utente
 * @param {string} userEmail - Email dell'utente
 * @returns {object} - Oggetto con secret e QR code URL
 */
async function generateSecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `Soccer X Pro (${userEmail})`,
    issuer: 'Soccer X Pro',
    length: 32
  });

  // Genera QR code come data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl: qrCodeUrl
  };
}

/**
 * Genera codici di backup per l'utente
 * @param {number} count - Numero di codici da generare (default: 10)
 * @returns {string[]} - Array di codici di backup
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Genera codice alfanumerico di 8 caratteri
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verifica un token TOTP
 * @param {string} secret - Chiave segreta dell'utente
 * @param {string} token - Token da verificare
 * @returns {boolean} - True se il token è valido
 */
function verifyToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Permette un margine di ±2 periodi (60 secondi)
  });
}

/**
 * Ottiene lo stato 2FA per un utente
 * @param {number} userId - ID dell'utente
 * @returns {object} - Stato 2FA
 */
async function getTwoFactorStatus(userId) {
  if (!userId) throw new Error('Missing userId');

  const twoFA = await prisma.twoFactorAuth.findUnique({
    where: { userId: Number(userId) } // 👈 perché UserProfile.id è Int
  });

  return { enabled: twoFA?.isEnabled || false };
}

/**
 * Inizia il processo di setup 2FA per un utente
 * @param {number} userId - ID dell'utente
 * @param {string} userEmail - Email dell'utente
 * @returns {object} - Dati per il setup (QR code, secret, backup codes)
 */
async function enrollTwoFactor(userId, userEmail) {
  try {
    // Genera secret e QR code
    const { secret, qrCodeUrl } = await generateSecret(userEmail);
    
    // Genera codici di backup
    const backupCodes = generateBackupCodes();

    // Crea o aggiorna record 2FA (non ancora abilitato)
    await prisma.twoFactorAuth.upsert({
      where: { userId: userId },
      update: {
        secret: secret,
        backupCodes: backupCodes,
        isEnabled: false,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        secret: secret,
        backupCodes: backupCodes,
        isEnabled: false
      }
    });

    return {
      qrCodeUrl: qrCodeUrl,
      secret: secret,
      backupCodes: backupCodes
    };
  } catch (error) {
    console.error('Errore nel setup 2FA:', error);
    throw new Error('Errore nella configurazione 2FA');
  }
}

/**
 * Verifica il setup 2FA e lo abilita
 * @param {number} userId - ID dell'utente
 * @param {string} token - Token di verifica
 * @returns {object} - Risultato della verifica
 */
async function verifyTwoFactorSetup(userId, token) {
  try {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId: userId }
    });

    if (!twoFA) {
      throw new Error('Setup 2FA non trovato');
    }

    // Verifica il token
    const isValid = verifyToken(twoFA.secret, token);
    
    if (!isValid) {
      throw new Error('Token non valido');
    }

    // Abilita 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: userId },
      data: {
        isEnabled: true,
        lastUsed: new Date(),
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      backupCodes: twoFA.backupCodes
    };
  } catch (error) {
    console.error('Errore nella verifica setup 2FA:', error);
    throw error;
  }
}

/**
 * Verifica un token 2FA per operazioni sensibili
 * @param {number} userId - ID dell'utente
 * @param {string} token - Token da verificare
 * @returns {object} - Risultato della verifica
 */
async function verifyTwoFactorToken(userId, token) {
  try {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId: userId }
    });

    if (!twoFA || !twoFA.isEnabled) {
      throw new Error('2FA non configurato');
    }

    // Verifica token TOTP
    const isValidTOTP = verifyToken(twoFA.secret, token);
    
    // Verifica se è un codice di backup
    const isBackupCode = twoFA.backupCodes.includes(token.toUpperCase());

    if (!isValidTOTP && !isBackupCode) {
      throw new Error('Token non valido');
    }

    // Se è un codice di backup, rimuovilo
    if (isBackupCode) {
      const updatedBackupCodes = twoFA.backupCodes.filter(code => code !== token.toUpperCase());
      await prisma.twoFactorAuth.update({
        where: { userId: userId },
        data: {
          backupCodes: updatedBackupCodes,
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Aggiorna lastUsed per TOTP
      await prisma.twoFactorAuth.update({
        where: { userId: userId },
        data: {
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return {
      valid: true,
      usedBackupCode: isBackupCode
    };
  } catch (error) {
    console.error('Errore nella verifica token 2FA:', error);
    throw error;
  }
}

/**
 * Disabilita 2FA per un utente
 * @param {number} userId - ID dell'utente
 * @param {string} token - Token di conferma
 * @returns {object} - Risultato della disabilitazione
 */
async function disableTwoFactor(userId, token) {
  try {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId: userId }
    });

    if (!twoFA || !twoFA.isEnabled) {
      throw new Error('2FA non configurato');
    }

    // Verifica token di conferma
    const isValid = verifyToken(twoFA.secret, token);
    if (!isValid) {
      throw new Error('Token di conferma non valido');
    }

    // Disabilita 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: userId },
      data: {
        isEnabled: false,
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella disabilitazione 2FA:', error);
    throw error;
  }
}

/**
 * Genera nuovi codici di backup
 * @param {number} userId - ID dell'utente
 * @param {string} token - Token di conferma
 * @returns {object} - Nuovi codici di backup
 */
async function generateNewBackupCodes(userId, token) {
  try {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId: userId }
    });

    if (!twoFA || !twoFA.isEnabled) {
      throw new Error('2FA non configurato');
    }

    // Verifica token di conferma
    const isValid = verifyToken(twoFA.secret, token);
    if (!isValid) {
      throw new Error('Token di conferma non valido');
    }

    // Genera nuovi codici
    const newBackupCodes = generateBackupCodes();

    // Aggiorna nel database
    await prisma.twoFactorAuth.update({
      where: { userId: userId },
      data: {
        backupCodes: newBackupCodes,
        updatedAt: new Date()
      }
    });

    return { backupCodes: newBackupCodes };
  } catch (error) {
    console.error('Errore nella generazione backup codes:', error);
    throw error;
  }
}

module.exports = {
  getTwoFactorStatus,
  enrollTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorToken,
  disableTwoFactor,
  generateNewBackupCodes,
  generateBackupCodes,
  verifyToken
};
