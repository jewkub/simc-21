const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const secret = require('../secret/secret.json');
const { name: projectId } = require('../package.json');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});
const bucket = storage.bucket('simc-web.appspot.com');

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});

router.get('/scoreboard', (req, res, next) => {
  res.render('scoreboard.ejs');
});

router.get('/add', (req, res, next) => {
  // หน้าเพิ่มคะแนนใน scoreboard
  res.render('add.ejs');
});


router.post('/add', async (req, res, next) => {
  try {
    res.redirect('/scoreboard');

    let data = {}, name;
    for (key in req.body) {
      if (key == 'nameinput') name = req.body[key];
      data[key] = req.body[key];
    }
    data.timestamp = new Date().getTime();
    await db.collection('log').doc().create(data);

    for (let e in req.body) {
      if (isNaN(+e)) continue;
      e = +e;
      let score;
      let log = [];

      let team = (await db.collection('team').where('team', '==', e).get()).docs[0];
      if (!team) {
        team = db.collection('team').doc();
        await team.create({
          team: e,
          score: 0,
          log: [],
        });
        score = 0;
      }
      else {
        score = team.get('score');
        log = team.get('log');
        team = team.ref;
      }

      if (req.body['' + e]) log.push({
        name,
        score: +req.body['' + e]
      });
      await team.update({
        score: +req.body['' + e] + score,
        log
      });

    }

  } catch (e) {
    return next(e);
  }
});

router.get('/log', async (req, res, next) => {
  let log = (await db.collection('log').get()).docs;
  res.render('log.ejs', { log });
});
router.get('/group', async (req, res, next) => {
  let team = (await db.collection('team').get()).docs;
  res.render('group.ejs', { team });
});

router.get('/team', async (req, res, next) => {
  // get team data in json
  let team = [];
  (await db.collection('team').orderBy('team').get()).docs.forEach((e, i) => {
    // console.log(e.get('team'));
    team[i] = {
      name: e.get('team'),
      score: e.get('score'),
      log: e.get('log'),
    }
  });
  res.json(team);
});

router.get('/result', (req, res, next) => {
  // เข้าหน้าประกาศผล
  if (req.hostname == 'www.sirirajmedcamp.com' && (new Date()).getTime() < 1571058000000) return res.redirect('/');
  res.render('result.ejs', {
    user: req.user,
  });
});

router.get('/query', (req, res, next) => {
  // เอาไว้ query ทุกคำตอบของอีเมลนึง ใช้ตอนพี่นุ่นขอ
  let query = datastore
    .createQuery('Answers')
    .filter('email', '=', req.query.email)
    .order('part')
    .order('num');
  datastore
    .runQuery(query)
    .then(r => {
      let a = [];
      r[0].forEach(e => {
        if(e.answerType == 'upload') e.ans = 'https://storage.googleapis.com/simc-web.appspot.com/' + e.ans;
        a.push({part: e.part, num: e.num, ans: e.ans});
      });
      res.send(a);
    })
    .catch(err => {
      console.error(err);
    });
});

module.exports = router;
/*{"1":"92","2":"99","3":"89","4":"99","5":"99","6":"87","7":"90","8":"81","9":"90","10":"90","11":"78","12":"88","13":"99","14":"89","15":"99","16":"88","17":"99","18":"88","19":"99","20":"88","timestamp":"Sat Nov 16 2019 23:46:58 GMT+0000 (Coordinated Universal Time)","nameinput":"ปรสิต"}*/