const express = require('express');
const { getPrismaClient } = require('../../config/database');
const { getTeamDataKey } = require('../../services/medicalKeyService');
const { aeadWrap } = require('../../security/medicalCrypto');
const { audit } = require('../../middleware/audit');
const router = express.Router();
const prisma = getPrismaClient();

function anonCaseNumber() { return 'MC-' + Math.random().toString(36).slice(2,8).toUpperCase(); }
function hashBodyArea(area) { return area ? require('crypto').createHash('sha256').update(String(area)).digest('hex').slice(0,16) : null; }
function severityBucket(s) {
  if (!s) return null;
  const map = { MINIMAL:'LOW', MILD:'LOW', MODERATE:'MEDIUM', SEVERE:'HIGH', CAREER_ENDING:'HIGH', UNKNOWN:null };
  return map[s] || null;
}

router.post('/', audit('CREATE', req => ({ type:'case', id:'(new)', playerId:req.body?.playerId })), async (req, res) => {
  try {
    const { playerId, type, onsetDate, severity, bodyArea, isAvailable } = req.body || {};
    const details = req.body?.details || {};

    const consent = await prisma.medicalConsent.findFirst({
      where: { teamId: req.teamId, playerId: Number(playerId), consentType: 'treatment', status: 'GRANTED', expiresAt: { gt: new Date() } }
    });
    if (!consent) return res.status(403).json({ success:false, error:'Consenso medico non presente o scaduto' });

    const key = await getTeamDataKey(req.teamId);
    const encryptedData = aeadWrap(key, JSON.stringify(details));

    const created = await prisma.medicalCase.create({
      data: {
        teamId: req.teamId,
        playerId: Number(playerId),
        caseNumber: anonCaseNumber(),
        type,
        status: 'OPEN',
        onsetDate: new Date(onsetDate),
        isAvailable: !!isAvailable,
        encryptedData,
        encryptionKeyId: `${req.teamId}_v1`,
        bodyAreaHash: hashBodyArea(bodyArea),
        severityCategory: severityBucket(severity),
        createdById: Number(req.user.id)
      }
    });

    res.status(201).json({ success:true, caseId: created.id, caseNumber: created.caseNumber });
  } catch (e) {
    res.status(500).json({ success:false, error:'Errore creazione caso' });
  }
});

router.get('/:id', audit('READ', req => ({ type:'case', id:req.params.id }),'LEGITIMATE_INTEREST'), async (req, res) => {
  const c = await prisma.medicalCase.findFirst({
    where: { id: req.params.id, teamId: req.teamId, deletedAt: null },
    select: { id:true, caseNumber:true, type:true, status:true, onsetDate:true, isAvailable:true, severityCategory:true, estimatedWeeksOut:true, playerId:true, createdAt:true, updatedAt:true }
  });
  if (!c) return res.status(404).json({ success:false, error:'Case non trovato' });
  res.json({ success:true, data: c });
});

module.exports = router;


