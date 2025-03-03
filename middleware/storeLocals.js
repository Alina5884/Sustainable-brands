const storeLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.info = req.flash('info');
  res.locals.errors = req.flash('error');
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null; // Добавляем CSRF-токен
  next();
};

module.exports = storeLocals;
