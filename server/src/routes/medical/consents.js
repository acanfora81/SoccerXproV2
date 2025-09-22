const express = require('express');
const { PrismaClient } = require('../../../prisma/generated/client');
const { audit } = require('../../middleware/audit');
const router = express.Router();
const prisma = new PrismaClient();

router.post('/', audit('CONSENT_GRANT', req => ({ type:'consent', id:'(new)', playerId:req.body?.playerId })), async (req, res) => {
  const { playerId, consentType, purpose, lawfulBasis, dataCategories, expiresAt, consentFormText } = req.body || {};
  if (!playerId || !consentType || !lawfulBasis || !consentFormText) {
    return res.status(400).json({ success:false, error:'Campi obbligatori mancanti' });
  }
  const c = await prisma.medicalConsent.create({
    data: {
      teamId: req.teamId,
      playerId: Number(playerId),
      consentType, purpose: purpose || '',
      lawfulBasis,
      dataCategories: dataCategories || {},
      status: 'GRANTED',
      grantedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      consentFormText
    }
  });
  res.status(201).json({ success:true, consentId: c.id });
});

module.exports = router;


