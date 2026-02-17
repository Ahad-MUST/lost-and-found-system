function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.Role !== 'Admin') return res.redirect('/');
  next();
}
module.exports = { requireLogin, requireAdmin };
