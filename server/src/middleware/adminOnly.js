/**
 * Admin-only middleware.
 * Must be used AFTER the auth middleware.
 * Checks that the authenticated user has the 'admin' role.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = adminOnly;
