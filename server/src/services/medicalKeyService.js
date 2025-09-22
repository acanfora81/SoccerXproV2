const crypto = require('crypto');
const argon2 = require('argon2');
const { PrismaClient } = require('../../prisma/generated/client');
const { aeadWrap, aeadUnwrap } = require('../security/medicalCrypto');
const prisma = new PrismaClient();

const MASTER_KEY = Buffer.from(process.env.MEDICAL_MASTER_KEY || '', 'base64');
if (MASTER_KEY.length !== 32) throw new Error('MEDICAL_MASTER_KEY (32B base64) non valido');

async function ensureVault(teamId) {
  let vault = await prisma.medicalVault.findUnique({ where: { teamId } });
  if (!vault) {
    const passSalt = crypto.randomBytes(16).toString('base64');
    const passHash = await argon2.hash(crypto.randomBytes(32).toString('hex'));
    const mk = crypto.randomBytes(32);
    const wrapped = aeadWrap(MASTER_KEY, mk.toString('base64'));
    vault = await prisma.medicalVault.create({
      data: {
        teamId,
        encryptedMasterKey: wrapped,
        masterKeySalt: crypto.randomBytes(16).toString('base64'),
        vaultPasswordHash: passHash,
        vaultPasswordSalt: passSalt
      }
    });
  }
  return vault;
}

async function getTeamDataKey(teamId) {
  const vault = await ensureVault(teamId);
  const b64 = aeadUnwrap(MASTER_KEY, vault.encryptedMasterKey);
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('Data key corrotta');
  return key;
}

async function setVaultPassphrase(teamId, passphrase, hint) {
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = await argon2.hash(`${passphrase}:${salt}`);
  return prisma.medicalVault.update({
    where: { teamId },
    data: { vaultPasswordHash: hash, vaultPasswordSalt: salt, vaultPasswordHint: hint || null }
  });
}

async function verifyVaultPassphrase(teamId, passphrase) {
  const v = await prisma.medicalVault.findUnique({ where: { teamId } });
  if (!v) return false;
  return argon2.verify(v.vaultPasswordHash, `${passphrase}:${v.vaultPasswordSalt}`);
}

module.exports = { getTeamDataKey, setVaultPassphrase, verifyVaultPassphrase };


