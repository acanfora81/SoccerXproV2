// server/src/middleware/subscription.js
// Enforce active subscription for protected API routes

function requireActiveSubscription(req, res, next) {
  const status = req.user?.subscriptionStatus;
  if (!status || status === 'ACTIVE') return next();
  return res.status(402).json({
    success: false,
    error: 'Subscription pending payment',
    code: 'SUBSCRIPTION_PENDING'
  });
}

module.exports = { requireActiveSubscription };














