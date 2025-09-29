module.exports = function requireMedicalRole(req, res, next) {
  // Usa req.user.role (singolo ruolo applicativo) oppure fallback a req.roles
  const roles = req.roles || (req.user?.role ? [req.user.role] : []);
  // Consenti accesso a ruoli medici e amministratore/segretaria per test e gestione
  const allowed = ['MEDICAL_ADMIN','DOCTOR','PHYSIO','NUTRITIONIST','ADMIN','SECRETARY'];
  const ok = roles.some(r => allowed.includes(r));
  if (!ok) return res.status(403).json({ success:false, error:'Ruolo medico richiesto' });
  next();
};


