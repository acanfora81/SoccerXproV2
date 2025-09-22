const express = require('express');
const { PrismaClient } = require('../../../prisma/generated/client');
const { audit } = require('../../middleware/audit');
const router = express.Router();
const prisma = new PrismaClient();

router.post('/request', audit('ACCESS_REQUEST', req => ({ type:'gdpr_request', id:'(new)', playerId:req.body?.playerId }),'LEGAL_OBLIGATION'), async (req, res) => {
  const { playerId, requestType, details, email } = req.body || {};
  if (!playerId || !requestType || !email) return res.status(400).json({ success:false, error:'Campi obbligatori mancanti' });
  const r = await prisma.gDPRRequest.create({
    data: {
      teamId: req.teamId,
      playerId: Number(playerId),
      requestType,
      requestDetails: details || '',
      requestedBy: email,
      status: 'pending'
    }
  });
  res.status(201).json({ success:true, requestId: r.id });
});

module.exports = router;


