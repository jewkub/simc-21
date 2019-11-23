const express = require('express');
const router = express.Router();
const User = require('../models/user.js');

router.get('/register', (req, res, next) => {
  return res.redirect('/');
  res.render('register.ejs');
});

router.get('/register/validemail', async function (req, res, next) {
  try {
    res.set({
      'Cache-Control': 'no-store, must-revalidate'
    });
    let valid = await User.checkValidEmail(req.query.email);
    res.json({alreadyUsed: !valid});
  } catch (e) {
    console.log('check valid email error: ');
    console.log(e);
  }
});

router.post('/register', async function (req, res, next) {
  try {
    await User.createUser(req.body.email, req.body.password);
  } catch (e) {
    return next(e);
  }
  req.flash('success', 'สมัครเข้าค่ายสำเร็จ กดเข้าสู่ระบบที่มุมบนขวาได้เลยครับ');
  res.redirect('/');
});

module.exports = router;