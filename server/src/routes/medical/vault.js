const express = require('express');
const { PrismaClient } = require('../../../prisma/generated/client');
const { setVaultPassphrase, verifyVaultPassphrase } = require('../../services/medicalKeyService');
const prisma = new PrismaClient();
const router = express.Router();

router.post('/enable', async (req, res) => {
  if (!(req.roles||[]).includes('MEDICAL_ADMIN')) return res.status(403).json({ success:false, error:'Solo MEDICAL_ADMIN' });
  const { passphrase, hint } = req.body || {};
  if (!passphrase || passphrase.length < 10) return res.status(400).json({ success:false, error:'Passphrase troppo corta' });
  await setVaultPassphrase(req.teamId, passphrase, hint);
  res.json({ success:true });
});

router.post('/unlock', async (req, res) => {
  const { passphrase, reason } = req.body || {};
  if (!passphrase || !reason) return res.status(400).json({ success:false, error:'Passphrase e reason obbligatori' });
  const ok = await verifyVaultPassphrase(req.teamId, passphrase);
  if (!ok) return res.status(401).json({ success:false, error:'Passphrase errata' });

  const ttl = Number(process.env.MEDICAL_VAULT_SESSION_MINUTES || 15);
  const expiresAt = new Date(Date.now()+ttl*60*1000);
  const access = await prisma.medicalVaultAccess.create({
    data: { teamId: req.teamId, userId: Number(req.user.id), accessType: 'normal', reason, grantedAt: new Date(), expiresAt }
  });
  res.json({ success:true, expiresAt, accessId: access.id });
});

router.post('/lock', async (req, res) => {
  await prisma.medicalVaultAccess.updateMany({
    where: { teamId: req.teamId, userId: Number(req.user.id), revokedAt: null },
    data: { revokedAt: new Date() }
  });
  res.json({ success:true });
});

module.exports = router;


