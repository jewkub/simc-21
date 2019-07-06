// const url = require('url');
// const path = require('path');
// const cookieSession = require('cookie-session');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// const request = require('request');
const User = require('./models/user.js');
const { name: projectId } = require('./package.json');

const session = require('express-session');
const secret = require(__dirname + '/secret/secret.json');

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Firestore = require('@google-cloud/firestore');
/* const db = new Firestore({
  projectId,
  keyFilename: '/secret/SIMC-Web-4d0cc28353fd.json',
}); */

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
  projectId,
});
const bucket = storage.bucket('simc-web.appspot.com');

app.locals.shuffle = function (array, length) {
  let counter = length || array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = (Math.random() * counter) | 0; // http://bit.ly/2LhrEt2

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
} // http://bit.ly/2uGCIFr

app.engine('html', require('ejs').renderFile);

const port = process.env.PORT || 8080, ip = process.env.IP || '0.0.0.0';

let userData = { undefined: { email: '' } };

// set up routes

app.use(require(__dirname + '/https-redirect.js')({ httpsPort: app.get('https-port') }));
app.set('trust proxy', true);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

/* app.use(session({
  name: 'session',
  secret: secret.session,
  cookie: {
    expires: new Date(2147483647000) // Tue, 19 Jan 2038 03:14:07 GMT
  },
  saveUninitialized: false,
  resave: true
})); */

// set no cache
app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

let users = {kind: 'Users'};

app.use(flash());

app.use('/', require('./routes/auth.js'));

// gzip
app.get('*.js', function (req, res, next) {
  req.url = req.url + '.gz';
  res.set('Content-Encoding', 'gzip');
  res.set('Content-Type', 'text/javascript');
  next();
});
app.get('*.css', function (req, res, next) {
  req.url = req.url + '.gz';
  res.set('Content-Encoding', 'gzip');
  res.set('Content-Type', 'text/css');
  next();
}); // https://stackoverflow.com/a/43711064/4468834

// real route

app.get('/', (req, res, next) => {
  /*
    ตรงนี้เลือกเอาว่าจะให้มัน serve ไฟล์อะไร
      home.ejs: หน้าแรกสำหรับไปล้อกอิน + ทำข้อสอบ
      close.ejs: หน้าสำหรับบอกว่าปิดรับสมัครแล้วจ้า
      result.ejs: หน้าสำหรับหลังวันประกาศผล
      scoreboard.html: หน้า realtime scoreboard วันจริง
  */
  let alert = req.flash();
  if(req.hostname == 'localhost' || req.hostname == 'simc-web.appspot.com' || req.hostname == '192.168.0.100') {
    res.render('home.ejs', {userData: req.user, alert: alert});
    // res.sendFile(path.join(__dirname, 'views', 'scoreboard.html'));
    return ;
  }
  res.render('result.ejs', {userData: userData[req.session.userKey], alert: alert.alert, alertType: alert.alertType});
  // res.render('close.ejs');
  // res.render('home.ejs');
});

app.use('/', require('./routes/debug.js'));
app.use('/', require('./routes/register.js'));
app.use('/', require('./routes/exam.js'));
app.use('/', require('./routes/evaluation.js'));
app.use('/', require('./routes/scoreboard.js'));

// set normal cache
/* app.use(function(req, res, next) {
  res.set('Cache-Control', 'public');
  next();
}); */

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/favicon.ico');
});

app.use(express.static('dist'));
app.use(express.static('static'));
app.use(express.static('views'));

// 404
app.use((req, res, next) => {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) res.render('404.ejs', { url: req.url });

  // respond with json
  else if (req.accepts('json')) res.send({ error: 'Not found' });

  // default to plain-text. send()
  else res.type('txt').send('Not found');
}); // http://bit.ly/2O01RDa

app.use((err, req, res, next) => {
  console.error(err);
  req.flash('error', err.message);
  res.redirect('/');
});

app.listen(port, ip, () => console.log('Server running on http://%s:%s', ip, port));

module.exports = app;
