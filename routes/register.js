const express = require('express');
const router = express.Router();
const User = require('../models/user.js');

router.get('/register', (req, res, next) => {
  res.render('register.ejs');
});

router.get('/register/validemail', async function (req, res, next) {
  res.set({
    'Cache-Control': 'no-store, must-revalidate'
  });
  let valid = await User.checkValidEmail(req.query.email);
  res.json({alreadyUsed: !valid});
});

router.post('/register', async function (req, res, next) {
  try {
    await User.createUser(req.body.email, req.body.password);
  } catch (e) {
    return next(e);
  }
  req.flash('success', 'สมัครเข้าค่ายสำเร็จ');
  res.redirect('/');
});

module.exports = router;