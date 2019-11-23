const fs = require('fs');
const readline = require('readline');
const store = require('node-persist');
const { google } = require('googleapis');
const { name: projectId } = require('../package.json');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  projectId,
  keyFilename: '../secret/SIMC-Web-4d0cc28353fd.json',
});

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  keyFilename: '../secret/SIMC-Web-4d0cc28353fd.json',
});

(async function(){
  /* let query = datastore
    .createQuery('Solution');
  let solution = await datastore.runQuery(query);
  solution = solution[0]; */

  let solution = (await db.collection('solution').get()).docs;

  let sol = [];
  let rule = [, , [, [2, 1], [2, 1], [2, 1], [2, 1], [2, 1]], [, ], [], [], []];
  for(let i = 1; i <= 25; i++) {
    rule[4][i] = [1];
    rule[6][i] = [1];
  }
  // rule[3][11] = [30/25,30/25,30/25,30/25,30/25];
  solution.forEach(e => {
    e.part = e.get('part');
    e.num = e.get('num');
    e.get('sol').forEach((el, i) => {
      sol[e.part] = sol[e.part] || [];
      sol[e.part][e.num] = sol[e.part][e.num] || [];

      sol[e.part][e.num][el] = i;
    });
  });
  // console.log(sol);
  let users = (await db.collection('users').where('done', '=', true).get()).docs;
  
  users.forEach(async (user, i) => {
    // console.log(user.get('email'));
    let answers = (await db.collection('answers').where('user', '=', user.ref).get()).docs;
    let sum = [0, 0, 0, 0, 0, 0, 0];
    answers.forEach(e => {
      e.part = e.get('part');
      e.num = e.get('num');
      e.ans = e.get('ans');
      if(sol[e.part] === undefined) return ;
      if(sol[e.part][e.num] === undefined) return ;
      if(sol[e.part][e.num][e.ans] === undefined) return ;
      sum[e.part] = sum[e.part]+(rule[e.part][e.num][sol[e.part][e.num][e.ans]] || 0);
      // if (e.part == 6) console.log((rule[e.part][e.num][sol[e.part][e.num][e.ans]] || 0));
    });
    // console.log(sum);
    await db.collection('score').doc().set({
      user: user.ref,
      email: user.get('email'),
      score: sum
    });
    /* return datastore.save({
      key: datastore.key('Score'),
      data: {
        email: user.email,
        choice: +(sum[0] + sum[1] + sum[2] + sum[3] + sum[4] + sum[5] + 0.001).toFixed(12)
      }
    })
    .catch(err => {
      console.error(err);
    }); */
  });
})();