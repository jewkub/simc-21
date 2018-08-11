// const url = require('url');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
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

// routes

app.use(require(__dirname + '/https-redirect.js')({httpsPort: app.get('https-port')}));
app.set('trust proxy', true);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//use sessions for tracking logins
app.use(session({
  secret: secret.session,
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: new Date(2147483647000)} // Tue, 19 Jan 2038 03:14:07 GMT
}));

// set no cache
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});


// initialize session
app.all('*', (req, res, next) => {
  // console.log(req.session);
  req.session.alert = req.session.alert || '';
  req.session.alertType = req.session.alertType || 'none';
  req.session.userData = req.session.userData || {};
  req.session.userData.email = req.session.userData.email || '';
  next();
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
  // console.log(req.session);
  if(req.hostname == 'simc20.com' || req.hostname == 'www.simc20.com') {
    res.render('soon.ejs');
    return ;
  }
  let alert = {alert: req.session.alert, alertType: req.session.alertType};
  req.session.alert = '';
  req.session.alertType = 'none';
  res.render('home.ejs', {userData: req.session.userData, alert: alert.alert, alertType: alert.alertType});
});

let users = {kind: 'Users'};
app.get('/register', (req, res, next) => {
  res.render('register.ejs');
});
/* const errorhandle = (err, res) => {
  console.error(err);
  if(!res.headersSent) res.json({error: true, message: err.message});
} */
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
      if(err) return next(err);
      body = JSON.parse(body);
      console.log('with recaptcha score: ' + body.score);
      if(!body.success) {
        return next(new Error('failed recaptcha -> ' + JSON.stringify(body)));
      }
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
  let userData;
  let query = datastore
    .createQuery(users.kind)
    .filter('email', '=', req.body.email);
  datastore
    .runQuery(query)
    .then(result => {
      if(result[0].length == 0) throw new Error('ไม่พบอีเมลนี้ -> ' + req.body.email);
      if(result[0].length > 1) throw new Error('duplicate email in Datastore -> ' + req.body.email); // http://bit.ly/2JBEGMf
      userData = result[0][0];
      // console.log(result[0][0]);
      // console.log(userData);
      return bcrypt.compare(req.body.password, result[0][0].password);
    })
    .then(result => {
      if(!result) throw new Error('รหัสผ่านผิดในการเข้าสู่ระบบด้วยอีเมลนี้ -> ' + req.body.email);
      else {
        req.session.userData = userData;
        req.session.userKey = userData[datastore.KEY];
        console.log(req.session.userData.email + ' just logged in');
        req.session.alert = 'เข้าสู่ระบบสำเร็จ';
        req.session.alertType = 'success';
        res.redirect('/'); // http://bit.ly/2L75DwK
      }
    })
    .catch(next);
});

app.get('/logout', (req, res, next) => {
  req.session.regenerate(function(err) {
    if(err) return next(err);
    delete req.tempdata;
    req.session.alert = 'ออกจากระบบสำเร็จ';
    req.session.alertType = 'success';
    res.redirect('/'); // http://bit.ly/2L75DwK
  });
});

let exam = {kind: 'Exam'};
let answers = {kind: 'Answers'};
let solution = {kind: 'Solution'};

app.get('/exam', (req, res, next) => {
  if(!req.session.userData.email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  if(req.session.userData.done) return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  req.query.part = +req.query.part || 1;
  if(!req.session.userData.agree) {
    req.query.part = 0;
  }
  let renderData = {};
  let query = datastore
    .createQuery(exam.kind)
    // .filter('part', '=', req.query.part)
    .order('num', {
      ascending: true
    });
  datastore
    .runQuery(query)
    .then(result => {
      renderData.exam = result[0];
      let query = datastore
        .createQuery(answers.kind)
        .filter('email', '=', req.session.userData.email)
        .order('part')
        .order('num');
      return datastore.runQuery(query)
    })
    .then(oldAnswer => {
      oldAnswer = oldAnswer[0];
      // console.log(oldAnswer);
      renderData.oldAnswer = oldAnswer;
      return bucket.getFiles({prefix: 'public/question/' + req.query.part});
    })
    .then(pic => {
      if(req.query.part == 0) {
        res.render('exam/agree.ejs');
      }
      else if(req.query.part == 1) {
        res.render('exam/profile.ejs', {oldAnswer: renderData.oldAnswer, part: req.query.part});
      }
      else if(req.query.part == 3) {
        res.render('exam/prepare.ejs', {part: req.query.part});
      }
      else if(req.query.part == 6) {
        // console.log(renderData.oldAnswer);
        // console.log(renderData.exam);
        res.render('exam/review.ejs', {
          oldAnswer: renderData.oldAnswer,
          exam: renderData.exam,
          user: req.session.userData,
        });
      }
      else if(req.query.part > 6 || req.query.part < 0) {
        throw new Error('ไม่มีข้อสอบชุดนี้')
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
        files: pic[0]
      });
    })
    .catch(next);
});

app.post('/exam/start', (req, res, next) => {
  let now = moment().valueOf();
  let renderData = {};
  req.body.part = parseInt(req.body.part || '-1');
  if(!req.session.userData.email) return next(new Error('Session error, no login data #1'));
  if(req.session.userData.done) return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  if(req.session.userData.endTime) return next(new Error('ข้อสอบชุดนี้ถูกเก็บแล้ว'));
  if(req.session.userData.startTime && moment().isAfter(moment(req.session.userData.startTime).add(3, 'h'))) {
    req.session.userData.endTime = moment(req.session.userData.startTime).add(3, 'h').valueOf();
    datastore.save({
      key: req.session.userKey,
      excludeFromIndexes: [
        'password',
      ],
      data: req.session.userData
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
      if(!req.session.userData.startTime) {
        console.log('user: ' + req.session.userData.email + ' start at: ' + moment(now).format());
        req.session.userData.startTime = moment(now).valueOf();
      }
      res.render('exam/timelimit.ejs', {
        endTime: moment(req.session.userData.startTime).add(3, 'h').valueOf(),
        part: 3,
        exam: renderData.exam,
        files: pic[0]
      });
      // console.log(req.session.userData.key);
      return datastore.save({
        key: req.session.userKey,
        excludeFromIndexes: [
          'password',
        ],
        data: req.session.userData
      });
    })
    .catch(next);
});

app.post('/exam', multer.any(), (req, res, next) => {
  // console.log(req.body);
  if (!req.session.userData.email) return next(new Error('Session error, no login data #2'));
  if(req.session.userData.done) return next(new Error('ข้อสอบถูกเก็บแล้ว'));
  if(!req.body.part) {
    console.log('no \'part\' data, use -1');
    req.body.part = '-1';
  }
  req.body.part = parseInt(req.body.part);
  if(req.body.part == 0) {
    req.session.userData.agree = true;
    datastore.save({
      key: req.session.userKey,
      excludeFromIndexes: [
        'password',
      ],
      data: req.session.userData
    });
  }
  req.files.forEach(e => {
    let ext = e.originalname.split('.').slice(-1)[0];
    const gcspath = 'answers/' + req.body.part + '/' + e.fieldname + '/' + req.session.userData.email + '-' + Date.now() + '.' + ext;
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
    });

    stream.end(e.buffer);
  });
  if(req.body.part == 1) {
    for(let i = 1; i <= 60; i++) {
      if(!req.body[i]) req.body[i] = '';
    }
  }
  if(req.body.part == 3) {
    req.session.userData.endTime = moment().valueOf();
    datastore.save({
      key: req.session.userKey,
      excludeFromIndexes: [
        'password',
      ],
      data: req.session.userData
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
      for(let num in req.body) {
        // if(num == 'part' || num == 'will-go' || num == 'check') continue;
        num = parseInt(num);
        if(isNaN(num)) continue;
        let query = datastore
          .createQuery(answers.kind)
          .filter('email', '=', req.session.userData.email)
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
            /* console.log({
              num: num,
              ans: req.body[num],
              email: req.session.userData.email,
              part: req.body.part,
            }); */
            return datastore.save({
              key: key || datastore.key(answers.kind),
              excludeFromIndexes: [
                'ans',
              ],
              data: {
                num: num,
                ans: req.body[num],
                email: req.session.userData.email,
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
    if(req.body['will-go']) res.redirect('/exam?part=' + parseInt(req.body['will-go']));
    else res.redirect('/exam?part=' + encodeURI(req.body.part + 1));
  });
});

app.get('/submit', (req, res, next) => {
  if(!req.session.userData.email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  req.session.userData.done = true;
  datastore.save({
    key: req.session.userKey,
    excludeFromIndexes: [
      'password',
    ],
    data: req.session.userData
  });
  req.session.alert = 'ส่งข้อสอบเรียบร้อย';
  req.session.alertType = 'success';
  res.redirect('/');
});

app.get('/score', (req, res, next) => {
  let ans;
  if(!req.session.userData.email) return next(new Error('กรุณาเข้าสู่ระบบ'));
  let query = datastore
    .createQuery(answers.kind)
    .filter('email', '=', req.session.userData.email);
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
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/favicon.ico');
});

// set normal cache
app.use(function(req, res, next) {
  res.set('Cache-Control', 'public');
  next();
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
  if(!!err.json) {
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