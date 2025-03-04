const authMiddleware = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You must be logged in to perform this action.');
    return res.redirect('/sessions/login');
  }
  next();
};

module.exports = authMiddleware;
