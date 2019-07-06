const express = require('express');
const router = express.Router();
const { name: projectId } = require('../package.json');

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});

//error test
router.get('/err', (req, res, next) => {
  next(new Error('eiei'));
});

// get session
router.get('/session', (req, res, next) => {
  console.log(req.session);
  next(new Error('don\'t come here!'));
});

router.get('/email', (req, res, next) => {
  res.send(req.user.get('email'));
});

router.get('/new', async (req, res, next) => {
  /* for (let i = 1; i <= 59; i++) await db.collection('exam').doc().create({
    answerType: 'text',
    num: i,
    part: 1
  });
  await db.collection('exam').doc().create({
    answerType: 'upload',
    num: 60,
    part: 1
  });
  await db.collection('exam').doc().create({
    answerType: 'upload',
    num: 61,
    part: 1
  }); */

  res.send('ok');
});

module.exports = router;