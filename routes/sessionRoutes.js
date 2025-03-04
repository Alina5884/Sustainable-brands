const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  loginShow,
  registerShow,
  registerDo,
  logout,
} = require('../controllers/sessionController');

router.route('/register').get(registerShow).post(registerDo);

router
  .route('/login')
  .get(loginShow)
  .post(
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/sessions/login',
      failureFlash: true,
    })
  );

router.route('/logout').post(logout);

module.exports = router;
