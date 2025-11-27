// middleware/auth.js

// Ensure user is logged in
module.exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userId) {
    return next();
  }

  req.session.redirectTo = req.originalUrl;
  return res.redirect('/login');
};

// Prevent logged-in users from accessing auth pages
module.exports.preventLoggedInAccess = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};
