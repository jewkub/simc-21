const express = require('express');
const router = express.Router();
const { name: projectId } = require('../package.json');

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

router.get('/upload', (req, res) => {
  res.render('upload.ejs');
});
router.post('/upload', multer.any(), (req, res, next) => {
  req.files.forEach(e => {
    let ext = e.originalname.split('.').slice(-1)[0];
    // const gcspath = 'answers/' + req.body.part + '/' + e.fieldname + '/' + req.user.get('email') + '-' + Date.now() + '.' + ext;
    const gcspath = req.body.path + e.originalname
    if (!gcspath) return ;
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
  res.send('ok');
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