const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const secret = require('../secret/secret.json');
const { name: projectId } = require('../package.json');
const moment = require('moment');

const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // no larger than 10mb
  }
});

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

let exam;

router.get('/exam', async function (req, res, next) {
  try {
    if (!req.user) throw new Error('กรุณาเข้าสู่ระบบ');
    if (req.user.get('done')) throw new Error('ข้อสอบถูกเก็บแล้ว');
    if (req.query.part > 6 || req.query.part < 0) throw new Error('ไม่มีข้อสอบชุดนี้');
    let alert = req.flash();

    req.query.part = +req.query.part || 1;
    if (!req.user.get('agree')) req.query.part = 0;
    if (!exam) exam = (await db.collection('exam').orderBy('num').get()).docs;
    
    let oldAnswer = db
      .collection('answers')
      .where('user', '=', req.user.ref);
    if (req.query.part != 6) oldAnswer = oldAnswer.where('part', '=', req.query.part);
    else oldAnswer = oldAnswer.where('part', '>', 1);
    oldAnswer = (await oldAnswer.get()).docs;

    let pic = await bucket.getFiles({ prefix: 'public/question/' + req.query.part });
    if (req.query.part == 0) return res.render('exam/agree.ejs');
    if (req.query.part == 1) return res.render('exam/profile.ejs', { oldAnswer: oldAnswer, part: req.query.part });
    if (req.query.part == 3) return res.render('exam/prepare.ejs', { part: req.query.part, alert, done: req.user.get('endTime') });
    if (req.query.part == 6) return res.render('exam/review.ejs', {
      oldAnswer,
      exam,
      user: req.user,
      alert,
      part: req.query.part,
    });
    return res.render('exam/normal.ejs', {
      part: req.query.part,
      partDesc: {
        1: 'Profile',
        2: 'Intro',
        3: 'IQ',
        4: 'Ethics',
        5: 'Creativity'
      }, 
      exam,
      oldAnswer,
      files: pic[0],
      alert
    });
  } catch (e) {
    return next(e);
  }
});

router.post('/exam/start', async (req, res, next) => {
  try {
    let now = new Date();
    req.body.part = parseInt(req.body.part || '-1');
    if (!req.user) throw new Error('No login data');
    if (req.user.get('done')) throw new Error('ข้อสอบถูกเก็บแล้ว');
    if (req.user.get('endTime')) throw new Error('ข้อสอบชุดนี้ถูกเก็บแล้ว');
    if (!req.user.get('agree')) {
      res.redirect('/exam');
      return ;
    }
    let startTime = req.user.get('startTime');
    startTime = startTime && startTime.toMillis();
    // console.log(startTime);
    if (moment().isAfter(moment(startTime).add(3, 'h'))) {
      await req.user.ref.update({
        endTime: moment(startTime).add(3, 'h').toDate()
      });
      throw new Error('หมดเวลาทำข้อสอบชุดนี้แล้ว');
    }

    let exam = (await db.collection('exam')
      .where('part', '=', 3)
      .get()).docs;
    let pic = await bucket.getFiles({prefix: 'public/question/' + req.body.part});
    if (!req.user.get('startTime')) {
      console.log('user: ' + req.user.get('email') + ' start at: ' + moment(now).format());
      await req.user.ref.update({
        startTime: now
      });
    }
    res.render('exam/timelimit.ejs', {
      endTime: moment(startTime).add(3, 'h').valueOf(),
      part: req.body.part,
      exam: exam,
      files: pic[0]
    });
  } catch (e) {
    return next(e);
  }
});

let ansType;

router.post('/exam', multer.any(), async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No login data');
    if (req.user.get('done')) throw new Error('ข้อสอบถูกเก็บแล้ว');
    if (req.body.part == 0) await req.user.ref.update({ agree: true });
    req.body.part = +req.body.part || -1;

    req.files.forEach(e => {
      let ext = e.originalname.split('.').slice(-1)[0];
      const gcspath = 'answers/' + req.body.part + '/' + e.fieldname + '/' + req.user.get('email') + '-' + Date.now() + '.' + ext;
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

    if (req.body.part == 1) {
      for (let i = 1; i <= 60; i++) req.body[i] = req.body[i] ||  '';
    }

    if (req.body.part == 3) {
      await req.user.ref.update('endTime', new Date());
    }

    if (!ansType) {
      ansType = [];
      let exam = await db.collection('exam').get();
      exam.docs.forEach((e, i, arr) => {
        let part = e.get('part');
        if (!ansType[part]) ansType[part] = [];
        ansType[part][e.get('num')] = e.get('answerType');
      });
      /* ansType[1] = ansType[1] || [];
      ansType[1][61] = 'upload';
      ansType[1][62] = 'upload'; */
    }

    for (let num in req.body) {
      num = +num;
      if (isNaN(num)) continue;
      if (!req.body[num]) continue;
      let ans = await db
        .collection('answers')
        .where('user', '=', req.user.ref)
        .where('part', '=', req.body.part)
        .where('num', '=', num).get();
      if (ans.empty) {
        await db.collection('answers').doc().create({
          user: req.user.ref,
          part: req.body.part,
          num: num,
          ans: req.body[num],
          answerType: ansType[req.body.part][num],
          email: req.user.get('email')
        });
      }
      else {
        if (ans.size > 1) {
          console.log('duplicate answer :(');
          console.log(req.user.get('email'));
          ans.docs.splice(1).forEach(async e => {
            await e.ref.delete();
          });
        }
        await ans.docs[0].ref.update({
          ans: req.body[num],
        });
      }
    }

    if (req.body.part == 1) req.flash('success', 'บันทึกข้อมูลเรียบร้อย');
    else if (req.body.part == 3) req.flash('success', 'ส่งข้อสอบเรียบร้อย');
    else req.flash('success', 'บันทึกคำตอบเรียบร้อย');
    res.redirect('/exam?part=' + encodeURI(req.body.part + 1));

  } catch (e) {
    return next(e);
  }
});

router.post('/submit', async (req, res, next) => {
  try {
    if (!req.user) throw new Error('กรุณาเข้าสู่ระบบ');
    await req.user.ref.update({ done: true });
    req.flash('success', 'ส่งข้อสอบเรียบร้อย');
    res.redirect('/evaluation');

  } catch (e) {
    return next(e);
  }
});

module.exports = router;