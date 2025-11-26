// middleware/auth.js

// Ensure user is logged in
module.exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userId) {
    return next(); // User authenticated → proceed
  }

  // If not logged in → store original URL (optional)
  req.session.redirectTo = req.originalUrl;

  return res.redirect('/login');
};


// Optional: Ensure the user is a specific role (e.g., admin)
module.exports.requireRole = (role) => {
  return (req, res, next) => {
    if (
      req.session &&
      req.session.user &&
      req.session.user.role &&
      req.session.user.role === role
    ) {
      return next(); // Role matches → allow access
    }

    return res.status(403).send("Access Denied: You don't have permission.");
  };
};


// Optional: Prevent logged-in users from accessing pages like /login or /register
module.exports.preventLoggedInAccess = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard'); // Change if needed
  }
  next();
};
