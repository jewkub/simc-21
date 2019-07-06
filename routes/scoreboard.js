const express = require('express');
const router = express.Router();
const User = require('../models/user.js');

router.get('/add', (req, res, next) => {
  // หน้าเพิ่มคะแนนใน scoreboard
  res.render('add.ejs');
});

router.post('/add', (req, res, next) => {
  for(let e in req.body) {
    if(e == 'nameinput') {
      req.body.timestamp = new Date().getTime();
      datastore.save({
        key: datastore.key('Log'),
        data: req.body
      });
    }
    if(isNaN(+e.slice(5))) continue;
    let query = datastore
      .createQuery('Team')
      .filter('team', '=', +e.slice(5));
    datastore
      .runQuery(query)
      .then(result => {
        if(result[0].length == 0){
          datastore.save({
            key: datastore.key('Team'),
            data: {
              team: +e.slice(5),
              score: +req.body[e]
            }
          })
          .catch(next);
        }
        else {
          result[0][0].score += +req.body[e];
          datastore.update(result[0][0])
          .catch(next);
        }
      });
  }
  res.redirect('/add');
});

router.get('/team', (req, res, next) => {
  // get team data in json
  let query = datastore
      .createQuery('Team')
      .order('team')
    datastore
      .runQuery(query)
      .then(result => {
        res.json(result[0]);
      });
});

router.get('/result', (req, res, next) => {
  // เข้าหน้าประกาศผล
  res.render('resultpage.ejs', {userData: userData[req.session.userKey]});
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