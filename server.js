const url = require('url');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
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
}));

// initialize session
app.all('*', (req, res, next) => {
  // console.log(req.session);
  req.session.alert = req.session.alert || '';
  req.session.alertType = req.session.alertType || 'none';
  req.session.name = req.session.name || '';
  req.session.email = req.session.email || '';
  next();
});

//error test
app.get('/err', (req, res, next) => {
  let query = datastore
    .createQuery(exam.kind)
    .filter('part', '=', 0)
    .order('num', {
      ascending: true
    });
  datastore
    .runQuery(query)
    .then(result => {
      // data = result;
      console.log(result);
    })
    .catch(next);
  // next(new Error('eiei'));
});

// get session
app.get('/session', (req, res, next) => {
  console.log(req.session);
  next(new Error('don\'t come here!'));
});

app.get('/', (req, res, next) => {
  let alert = {alert: req.session.alert, alertType: req.session.alertType};
  req.session.alert = '';
  req.session.alertType = 'none';
  res.render('home.ejs', {name: req.session.email, alert: alert.alert, alertType: alert.alertType});
  // console.log(req.session);
});

let register = {kind: 'Users'};
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
    .createQuery(register.kind)
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
        .createQuery(register.kind)
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
            key: datastore.key(register.kind),
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
          req.session.alert = 'register success';
          req.session.alertType = 'success';
          res.redirect('/'); // http://bit.ly/2L75DwK
        })
        .catch(next);
    });
}); // register

app.post('/login', (req, res, next) => {
  if(!req.body || !req.body.email || !req.body.password) return next(new Error('missing email or password -> ' + JSON.stringify(req.body)));
  let query = datastore
    .createQuery(register.kind)
    .filter('email', '=', req.body.email);
  datastore
    .runQuery(query)
    .then(result => {
      if(result[0].length == 0) throw new Error('email not found -> ' + req.body.email);
      if(result[0].length > 1) throw new Error('duplicate email in Datastore -> ' + req.body.email); // http://bit.ly/2JBEGMf
      req.tempdata = result[0][0];
      return bcrypt.compare(req.body.password, result[0][0].password);
    })
    .then(result => {
      if(!result) throw new Error('wrong password -> ' + req.body.email);
      else {
        req.session.email = req.tempdata.email;
        console.log(req.session.email + ' just logged in');
        req.session.alert = 'login success';
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
    req.session.alert = 'logout success';
    req.session.alertType = 'success';
    res.redirect('/'); // http://bit.ly/2L75DwK
  });
});

let exam = {kind: 'Exam'};
let answers = {kind: 'Answers'};

app.get('/exam', (req, res, next) => {
  if(!req.session.email) return next(new Error('You are currently not logged in, please go login first.'));
  req.query.part = req.query.part || '0';
  let examData;
  let query = datastore
    .createQuery(exam.kind)
    .filter('part', '=', parseInt(req.query.part))
    .order('num', {
      ascending: true
    });
  datastore
    .runQuery(query)
    .then(result => {
      examData = result[0];
      let query = datastore
        .createQuery(answers.kind)
        .filter('part', '=', parseInt(req.query.part))
        .filter('email', '=', req.session.email)
      return datastore.runQuery(query)
    })
    .then(oldAnswer => {
      oldAnswer = oldAnswer[0];
      // console.log(oldAnswer);
      res.render('exam/normal.ejs', {part: req.query.part, exam: examData, oldAnswer: oldAnswer});
    })
    .catch(next);
});

app.post('/exam', multer.any(), (req, res, next) => {
  if (!req.session.email) {
    return next(new Error('Session error, no login data'));
  }
  req.body.part = parseInt(req.body.part);
  req.files.forEach(e => {
    let ext = e.originalname.split('.').slice(-1)[0];
    const gcspath = 'answers/' + e.fieldname + '/' + req.session.email + '-' + Date.now() + '.' + ext;
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
  for(let num in req.body) {
    if(num == 'part') continue;
    let query = datastore
      .createQuery(answers.kind)
      .filter('email', '=', req.session.email)
      .filter('num', '=', num);
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
          email: req.session.email,
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
            email: req.session.email,
            part: req.body.part,
          }
        });
      })
      .catch(err => {
        console.log('error when saving answer:');
        console.error(err.message);
      });
  }
  res.redirect('/exam?part=' + encodeURI(req.body.part + 1));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/favicon.ico');
});

app.use(express.static('dist'));
app.use(express.static('static'));

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