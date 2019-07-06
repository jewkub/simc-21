const express = require('express');
const router = express.Router();
const { name: projectId } = require('../package.json');

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});

router.get('/evaluation', async (req, res, next) => {
  try {
    if (!req.user) throw new Error('กรุณาเข้าสู่ระบบ');
    let alert = req.flash();
    res.render('exam/evaluation.ejs', { alert });
  } catch (e) {
    return next(e);
  }
});

router.post('/evaluation', async (req, res, next) => {
  try {
    await req.user.ref.update({ eva: true });

    for (let num in req.body) {
      num = +num;
      if (isNaN(num)) continue;

      let ans = await db.collection('evaluation')
        .where('email', '=', req.user.get('email'))
        .where('num', '=', num)
        .get();

      if (ans.empty) {
        await db.collection('evaluation').doc().create({
          user: req.user.ref,
          num: num,
          ans: req.body[num],
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

    req.flash('success', 'บันทึกคำตอบเรียบร้อย');
    res.redirect('/');
  } catch (e) {
    return next(e);
  }
});

// ใช้ตรวจข้อสอบแบบ realtime
/* router.get('/score', (req, res, next) => {
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

module.exports = router;