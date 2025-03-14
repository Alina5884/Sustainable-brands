const User = require('../models/User');
const parseVErr = require('../utils/parseValidationErrors');

const registerShow = (req, res) => {
  res.render('index', { csrfToken: req.csrfToken() });
};

const registerDo = async (req, res, next) => {
  if (req.body.password !== req.body.password1) {
    req.flash('error', 'The passwords entered do not match.');
    return res.render('index', {
      errors: req.flash('error'),
      formData: req.body,
    });
  }

  try {
    await User.create(req.body);
  } catch (e) {
    if (e.constructor.name === 'ValidationError') {
      parseVErr(e, req);
    } else if (e.name === 'MongoServerError' && e.code === 11000) {
      req.flash('error', 'That email address is already registered.');
    } else {
      return next(e);
    }
    return res.render('index', {
      errors: req.flash('error'),
      formData: req.body,
    });
  }

  req.flash('info', 'Registration successful!');
  res.redirect('/sessions/login');
};

const logout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};

const loginShow = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('login', { csrfToken: req.csrfToken() });
};

const loginDo = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.render('login', {
        errors: req.flash('error'),
        formData: req.body,
      });
    }

    const isMatch = await user.comparePassword(req.body.password);

    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.render('login', {
        errors: req.flash('error'),
        formData: req.body,
      });
    }

    const token = user.generateAuthToken();

    res.cookie('authToken', token, { httpOnly: true });

    req.flash('info', 'Successfully logged in!');
    res.redirect('/');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  registerShow,
  registerDo,
  logout,
  loginShow,
  loginDo,
};
