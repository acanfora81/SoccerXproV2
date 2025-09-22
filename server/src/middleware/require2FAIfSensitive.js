module.exports = function require2FAIfSensitive(req, res, next) {
  const need2FA = String(process.env.MEDICAL_REQUIRE_2FA || 'true') === 'true';
  if (!need2FA || req.method === 'GET') return next();
  const token = req.headers['x-2fa-token'];
  if (!token || String(token).length < 6) {
    return res.status(428).json({ success:false, error:'2FA richiesta' });
  }
  // TODO: valida token con provider 2FA
  next();
};


