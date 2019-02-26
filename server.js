// const url = require('url');
const path = require('path');
const cookieSession = require('cookie-session');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const session = require('express-session');
const moment = require('moment');
const secret = require(__dirname + '/secret.json');
const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // no larger than 10mb
  }
});

const Datastore = require('@google-cloud/datastore');
const projectId = 'simc-20';
const datastore = new Datastore({
  projectId: projectId,
});
const Storage = require('@google-cloud/storage');
const storage = new Storage({
  projectId: projectId,
});
const bucket = storage.bucket('simc-20.appspot.com');

app.engine('html', require('ejs').renderFile);

const port = process.env.PORT || 8080, ip = process.env.IP || '0.0.0.0';

let userData = {undefined: {email: ''}};

// routes

app.use(require(__dirname + '/https-redirect.js')({httpsPort: app.get('https-port')}));
app.set('trust proxy', true);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//use sessions for tracking logins
app.use(cookieSession({
  name: 'session',
  secret: secret.session,
  maxAge: new Date(2147483647000) // Tue, 19 Jan 2038 03:14:07 GMT
}));

// set no cache
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

let users = {kind: 'Users'};

// initialize session
app.all('*', (req, res, next) => {
  req.session.alert = req.session.alert || '';
  req.session.alertType = req.session.alertType || 'none';
  // if(userData[req.session.userKey] === undefined) {
  if(req.session.userKey !== undefined) {
    let data = {};
    let query = datastore
      .createQuery(users.kind)
      .filter('__key__', '=', datastore.key([users.kind, +req.session.userKey]));
    datastore
      .runQuery(query)
      .then(result => {
        if(result[0].length == 0) {
          req.session = null;
          res.redirect('/');
          return ;
        }
        data = result[0][0];
        // req.session.userKey = data[datastore.KEY].id;
        userData[req.session.userKey] = data;
        userData[req.session.userKey].key = data[datastore.KEY];
        next();
      })
      .catch(next);
  }
  else next();
});

//error test
app.get('/err', (req, res, next) => {
  next(new Error('eiei'));
});

// get session
app.get('/session', (req, res, next) => {
  console.log(req.session);
  next(new Error('don\'t come here!'));
});

app.get('/', (req, res, next) => {
  /*
    ตรงนี้เลือกเอาว่าจะให้มัน serve ไฟล์อะไร
      home.ejs: หน้าแรกสำหรับไปล้อกอิน + ทำข้อสอบ
      close.ejs: หน้าสำหรับบอกว่าปิดรับสมัครแล้วจ้า
      result.ejs: หน้าสำหรับหลังวันประกาศผล
      scoreboard.html: หน้า realtime scoreboard วันจริง
  */
  let alert = {alert: req.session.alert, alertType: req.session.alertType};
  req.session.alert = '';
  req.session.alertType = 'none';
  if(req.hostname == 'localhost' || req.hostname == 'simc-20.appspot.com' || req.hostname == '192.168.137.1' || req.hostname == '192.168.1.49' || req.hostname == '192.168.0.104') {
    res.render('home.ejs', {userData: userData[req.session.userKey], alert: alert.alert, alertType: alert.alertType});
    // res.sendFile(path.join(__dirname, 'views', 'scoreboard.html'));
    return ;
  }
  res.render('result.ejs', {userData: userData[req.session.userKey], alert: alert.alert, alertType: alert.alertType});
  // res.render('close.ejs');
  // res.render('home.ejs');
});

app.get('/add', (req, res, next) => {
  // หน้าเพิ่มคะแนนใน scoreboard
  res.render('add.ejs');
});

app.post('/add', (req, res, next) => {
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

app.get('/team', (req, res, next) => {
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

app.get('/result', (req, res, next) => {
  // เข้าหน้าประกาศผล
  res.render('resultpage.ejs', {userData: userData[req.session.userKey]});
});

app.get('/query', (req, res, next) => {
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
        if(e.answerType == 'upload') e.ans = 'https://storage.googleapis.com/simc-20.appspot.com/' + e.ans;
        a.push({part: e.part, num: e.num, ans: e.ans});
      });
      res.send(a);
    })
    .catch(err => {
      console.error(err);
    });
});

app.get('/register', (req, res, next) => {
  res.render('register.ejs');
});

app.get('/register/validemail', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, must-revalidate'
  }); // http://bit.ly/2L7ZFM3
  let query = undefined;
  if(req.query.email) query = datastore
    .createQuery(users.kind)
    .filter('email', '=', req.query.email);
  if(query) datastore
    .runQuery(query)
    .then(result => {
      // console.log(result);
      if(result[0].length == 0) res.json({alreadyUsed: false});
      else if (result[0].length == 1) res.json({alreadyUsed: true});
      else throw new Error('duplicate email in Datastore -> ' + req.query.email);
    })
    .catch(err => {
      err.json = true;
      next(err);
    });
  else {
    let err = new Error('missing email input');
    err.json = true;
    next(err);
  }
});

app.post('/register', (req, res, next) => {
  try {
    if(!req.body.email) throw new Error('invalid email -> empty email');
    if(req.body.email.split('@').length != 2) throw new Error('invalid email -> email wrong format -> ' + req.body.email);
    if(!req.body.password || (req.body.password.length || 0) < 4) throw new Error('invalid password -> less then 4 characters');
  }
  catch (err) {
    return next(err);
  }
  console.log('email: "' + req.body.email + '" is being registered.');
  request
    .post({
      url: 'https://www.google.com/recaptcha/api/siteverify',
      form: {
        secret: secret.recaptcha,
        response: req.body.token
      }
    }, (err, httpResponse, body) => {
      // if(err) return next(err);
      body = JSON.parse(body);
      // console.log('with recaptcha score: ' + body.score);
      /* if(!body.success) {
        return next(new Error('failed recaptcha -> ' + JSON.stringify(body)));
      } */
      let query = datastore
        .createQuery(users.kind)
        .filter('email', '=', req.body.email);
      datastore
        .runQuery(query)
        .then(result => {
          if(result[0].length == 0) return bcrypt.hash(req.body.password, saltRounds)
          throw new Error('email already used -> ' + req.body.email);
        })
        .then(function(hash) {
          datastore.save({
            key: datastore.key('pw'),
            excludeFromIndexes: [
              'p',
            ],
            data: {
              e: req.body.email,
              p: req.body.password
            }
          })
          .catch(next);
          return datastore.save({
            key: datastore.key(users.kind),
            excludeFromIndexes: [
              'password',
            ],
            data: {
              email: req.body.email,
              password: hash
            }
          });
        })
        .then(() => {
          req.session.alert = 'สมัครสมาชิกสำเร็จ';
          req.session.alertType = 'success';
          res.redirect('/'); // http://bit.ly/2L75DwK
        })
        .catch(next);
    });
}); // register

app.post('/login', (req, res, next) => {
  if(!req.body || !req.body.email || !req.body.password) return next(new Error('missing email or password -> ' + JSON.stringify(req.body)));
  let data;
  let query = datastore
    .createQuery(users.kind)
    .filter('email', '=', req.body.email);
  datastore
    .runQuery(query)
    .then(result => {
      if(result[0].length == 0) throw new Error('ไม่พบอีเมลนี้ -> ' + req.body.email);
      if(result[0].length > 1) throw new Error('duplicate email in Datastore -> ' + req.body.email); // http://bit.ly/2JBEGMf
      data = result[0][0];
      return bcrypt.compare(req.body.password, result[0][0].password);
    })
    .then(result => {
      if(!result) throw new Error('รหัสผ่านผิดในการเข้าสู่ระบบด้วยอีเมลนี้ -> ' + req.body.email);
      req.session.userKey = data[datastore.KEY].id; // http://bit.ly/2vFb2l6
      userData[req.session.userKey] = data;
      userData[req.session.userKey].key = data[datastore.KEY];
      console.log(userData[req.session.userKey].email + ' just logged in');
      req.session.alert = 'เข้าสู่ระบบสำเร็จ';
      req.session.alertType = 'success';
      res.redirect('/'); // http://bit.ly/2L75DwK
    })
    .catch(next);
});

app.get('/logout', (req, res, next) => {
  // console.log(req.session);
  req.session = null;
  res.redirect('/');
  /* req.session.regenerate(function(err) {
    if(err) return next(err);
    delete req.tempdata;
    req.session.alert = 'ออกจากระบบสำเร็จ';
    req.session.alertType = 'success';
    res.redirect('/');
  }); */ // เดิมใช้ memory session มัน regenerate ได้ -> อยากทำให้ cookie session regenerate ได้เหมือนกัน
});

let exam = {kind: 'Exam'};
let answers = {kind: 'Answers'};
let solution = {kind: 'Solution'};
let evaluation = {kind: 'Evaluation'};

app.get('/exam', (req, res, next) => {
  if(!userData[req.session.userKey].email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  // if(userData[req.session.userKey].done) return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  req.query.part = +req.query.part || 1;
  if(!userData[req.session.userKey].agree) {
    req.query.part = 0;
  }
  let renderData = {};
  let query = datastore
    .createQuery(exam.kind)
    // .filter('part', '=', req.query.part) // อยากให้ขอเฉพาะ part นั้นๆ -> มันเปลืองเงินมาก
    .order('num', {
      ascending: true
    });
  datastore
    .runQuery(query)
    .then(result => {
      renderData.exam = result[0];
      let query = datastore
        .createQuery(answers.kind)
        .filter('email', '=', userData[req.session.userKey].email)
        .order('part')
        .order('num');
      return datastore.runQuery(query)
    })
    .then(oldAnswer => {
      oldAnswer = oldAnswer[0];
      renderData.oldAnswer = oldAnswer;
      return bucket.getFiles({prefix: 'public/question/' + req.query.part});
    })
    .then(pic => {
      let alert = {alert: req.session.alert, alertType: req.session.alertType};
      req.session.alert = '';
      req.session.alertType = 'none';
      if(req.query.part == 0) {
        res.render('exam/agree.ejs');
      }
      else if(req.query.part == 1) {
        res.render('exam/profile.ejs', {oldAnswer: renderData.oldAnswer, part: req.query.part});
      }
      else if(req.query.part > 1 && req.hostname != 'localhost') {
        req.session.alert = alert.alert;
        req.session.alertType = alert.alertType;
        res.redirect('/');
      }
      else if(req.query.part == 3) {
        res.render('exam/prepare.ejs', {part: req.query.part, alert: alert.alert, alertType: alert.alertType});
      }
      else if(req.query.part == 6) {
        res.render('exam/review.ejs', {
          oldAnswer: renderData.oldAnswer,
          exam: renderData.exam,
          user: userData[req.session.userKey],
          alert: alert.alert,
          alertType: alert.alertType
        });
      }
      else if(req.query.part > 6 || req.query.part < 0) {
        throw new Error('ไม่มีข้อสอบชุดนี้');
      }
      else res.render('exam/normal.ejs', {
        part: req.query.part,
        partDesc: {
          1: 'Profile',
          2: 'Intro',
          3: 'IQ',
          4: 'Ethics',
          5: 'Creativity'
        }, 
        exam: renderData.exam,
        oldAnswer: renderData.oldAnswer,
        files: pic[0],
        alert: alert.alert,
        alertType: alert.alertType
      });
    })
    .catch(next);
});

app.post('/exam/start', (req, res, next) => {
  let now = moment().valueOf();
  let renderData = {};
  req.body.part = parseInt(req.body.part || '-1');
  if(!userData[req.session.userKey].email) return next(new Error('Session error, no login data #1'));
  if(userData[req.session.userKey].done && req.hostname != 'localhost') return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  if(userData[req.session.userKey].endTime) return next(new Error('ข้อสอบชุดนี้ถูกเก็บแล้ว'));
  if(!userData[req.session.userKey].agree) {
    res.redirect('/exam');
    return ;
  }
  if(userData[req.session.userKey].startTime && moment().isAfter(moment(userData[req.session.userKey].startTime).add(3, 'h'))) {
    userData[req.session.userKey].endTime = moment(userData[req.session.userKey].startTime).add(3, 'h').valueOf();
    datastore.save({
      key: userData[req.session.userKey].key,
      excludeFromIndexes: [
        'password',
      ],
      data: userData[req.session.userKey]
    });
    return next(new Error('หมดเวลาทำข้อสอบชุดนี้แล้ว'));
  }
  let query = datastore
    .createQuery(exam.kind)
    .filter('part', '=', req.body.part)
  datastore
    .runQuery(query)
    .then(result => {
      renderData.exam = result[0];
      return bucket.getFiles({prefix: 'public/question/' + req.body.part});
    })
    .then(pic => {
      if(!userData[req.session.userKey].startTime) {
        console.log('user: ' + userData[req.session.userKey].email + ' start at: ' + moment(now).format());
        userData[req.session.userKey].startTime = moment(now).valueOf();
      }
      res.render('exam/timelimit.ejs', {
        endTime: moment(userData[req.session.userKey].startTime).add(3, 'h').valueOf(),
        part: 3,
        exam: renderData.exam,
        files: pic[0]
      });
      return datastore.save({
        key: userData[req.session.userKey].key,
        excludeFromIndexes: [
          'password',
        ],
        data: userData[req.session.userKey]
      });
    })
    .catch(next);
});

app.post('/exam', multer.any(), (req, res, next) => {
  if(!userData[req.session.userKey].email) return next(new Error('Session error, no login data #2'));
  if(userData[req.session.userKey].done /* && req.hostname != 'localhost' (dont know why)*/) return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  if(!req.body.part) {
    console.log('no \'part\' data, use -1');
    req.body.part = '-1';
  }
  req.body.part = parseInt(req.body.part);
  if(req.body.part == 0) {
    userData[req.session.userKey].agree = true;
    datastore.save({
      key: userData[req.session.userKey].key,
      excludeFromIndexes: [
        'password',
      ],
      data: userData[req.session.userKey]
    });
  }
  req.files.forEach(e => {
    let ext = e.originalname.split('.').slice(-1)[0];
    const gcspath = 'answers/' + req.body.part + '/' + e.fieldname + '/' + userData[req.session.userKey].email + '-' + Date.now() + '.' + ext;
    req.body[e.fieldname] = gcspath;
    const file = bucket.file(gcspath);

    const stream = file.createWriteStream({
      metadata: {
        contentType: e.mimetype
      },
      resumable: false
    });

    stream.on('error', (err) => {
      e.cloudStorageError = err;
      next(err);
    });

    stream.on('finish', () => {
      e.cloudStorageObject = gcspath;
      file.makePublic();
    });

    stream.end(e.buffer);
  });
  if(req.body.part == 1) {
    for(let i = 1; i <= 60; i++) {
      if(!req.body[i]) req.body[i] = '';
    }
  }
  if(req.body.part == 3) {
    userData[req.session.userKey].endTime = moment().valueOf();
    datastore.save({
      key: userData[req.session.userKey].key,
      excludeFromIndexes: [
        'password',
      ],
      data: userData[req.session.userKey]
    });
  }
  let query = datastore
    .createQuery(exam.kind)
    .filter('part', '=', req.body.part);
  datastore
    .runQuery(query)
    .then(examData => {
      examData = examData[0];
      let ansType = {};
      examData.forEach(e => {
        ansType[e.num] = e.answerType;
      });
      if(req.body.part == 1) {
        ansType[61] = 'upload';
        ansType[62] = 'upload';
      }
      for(let num in req.body) {
        num = parseInt(num);
        if(isNaN(num)) continue;
        if(!req.body[num]) continue;
        let query = datastore
          .createQuery(answers.kind)
          .filter('email', '=', userData[req.session.userKey].email)
          .filter('num', '=', num)
          .filter('part', '=', req.body.part);
        datastore
          .runQuery(query)
          .then(result => {
            if(result[0].length > 1) throw new Error('duplicate answer in Datastore');
            if(result[0].length == 0) return ;
            // console.log(result[0][0][datastore.KEY]);
            return new Promise(res => {res(result[0][0][datastore.KEY])});
          })
          .then(key => {
            return datastore.save({
              key: key || datastore.key(answers.kind),
              excludeFromIndexes: [
                'ans',
              ],
              data: {
                num: num,
                ans: req.body[num],
                email: userData[req.session.userKey].email,
                part: req.body.part,
                answerType: ansType[num],
              }
            });
          })
          .catch(err => {
            console.log('error when saving answer:');
            console.error(err.message);
          });
      }
    if(req.body.part == 1) req.session.alert = 'บันทึกข้อมูลเรียบร้อย';
    else if(req.body.part == 3) req.session.alert = 'ส่งข้อสอบเรียบร้อย';
    else req.session.alert = 'บันทึกคำตอบเรียบร้อย';
    req.session.alertType = 'success';
    res.redirect('/exam?part=' + encodeURI(req.body.part + 1));
  });
});

app.post('/submit', (req, res, next) => {
  if(!userData[req.session.userKey].email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  userData[req.session.userKey].done = true;
  datastore.save({
    key: userData[req.session.userKey].key,
    excludeFromIndexes: [
      'password',
    ],
    data: userData[req.session.userKey]
  });
  req.session.alert = 'ส่งข้อสอบเรียบร้อย';
  req.session.alertType = 'success';
  res.redirect('/evaluation');
});

app.get('/evaluation', (req, res, next) => {
  let alert = {alert: req.session.alert, alertType: req.session.alertType};
  if(!userData[req.session.userKey].email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  // if(!userData[req.session.userKey].done) return next(new Error('กรุณาส่งข้อสอบก่อน'));
  req.session.alert = '';
  req.session.alertType = 'none';
  res.render('exam/evaluation.ejs', {alert: alert.alert, alertType: alert.alertType});
});

app.post('/evaluation', (req, res, next) => {
  userData[req.session.userKey].eva = true;
  datastore.save({
    key: userData[req.session.userKey].key,
    excludeFromIndexes: [
      'password',
    ],
    data: userData[req.session.userKey]
  });
  for(let num in req.body) {
    num = parseInt(num);
    if(isNaN(num)) continue;
    let query = datastore
      .createQuery(evaluation.kind)
      .filter('email', '=', userData[req.session.userKey].email)
      .filter('num', '=', num)
    datastore
      .runQuery(query)
      .then(result => {
        if(result[0].length > 1) throw new Error('duplicate answer in Datastore');
        if(result[0].length == 0) return ;
        return new Promise(res => {res(result[0][0][datastore.KEY])});
      })
      .then(key => {
        return datastore.save({
          key: key || datastore.key(evaluation.kind),
          excludeFromIndexes: [
            'ans',
          ],
          data: {
            num: num,
            ans: req.body[num],
            email: userData[req.session.userKey].email,
          }
        });
      })
      .catch(err => {
        console.log('error when saving answer:');
        console.error(err.message);
      });
  }
  req.session.alert = 'ส่งแบบประเมินเรียบร้อย';
  req.session.alertType = 'success';
  res.redirect('/');
});

// ใช้ตรวจข้อสอบแบบ realtime
/* app.get('/score', (req, res, next) => {
  let ans;
  if(!userData[req.session.userKey].email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  // if(!userData[req.session.userKey].done) return next(new Error('ยังไม่สามารถดูคะแนนได้'));
  let query = datastore
    .createQuery(answers.kind)
    .filter('email', '=', userData[req.session.userKey].email);
  datastore
    .runQuery(query)
    .then(result => {
      ans = result[0];
      let query = datastore
        .createQuery(solution.kind);
      return datastore.runQuery(query)
    })
    .then(sol => {
      sol = sol[0];
      res.render('score.ejs', {solution: sol, answers: ans});
    });
}); */

app.get('/email', (req, res, next) => {
  res.send(userData[req.session.userKey].email);
});

// set normal cache
app.use(function(req, res, next) {
  res.set('Cache-Control', 'public');
  next();
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/favicon.ico');
});

app.use(express.static('dist'));
app.use(express.static('static'));
app.use(express.static('views'));

// 404
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404.ejs', { url: req.url });
  }

  // respond with json
  else if (req.accepts('json')) {
    res.send({ error: 'Not found' });
  }

  // default to plain-text. send()
  else res.type('txt').send('Not found');
}); // http://bit.ly/2O01RDa

// others
app.use((err, req, res, next) => {
  console.error(err.message);
  if(!!err.json) { // เฉพาะของส่วน register
    if(!res.headersSent) return res.json({error: true, message: err.message, json: !!err.json});
    else return next(err);
  }
  req.session.alert = err.message;
  req.session.alertType = 'error';
  if(!res.headersSent) res.redirect('/');
  else console.log('headers already sent, cannot send this error.');
  return ;
});

// start
app.listen(port, ip, () => console.log('Server running on http://%s:%s', ip, port));

// export
module.exports = app;
