module.exports = function requireMedicalRole(req, res, next) {
  const roles = req.roles || [];
  const ok = roles.some(r => ['MEDICAL_ADMIN','DOCTOR','PHYSIO','NUTRITIONIST'].includes(r));
  if (!ok) return res.status(403).json({ success:false, error:'Ruolo medico richiesto' });
  next();
};


