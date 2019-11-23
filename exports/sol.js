const fs = require('fs');
const readline = require('readline');
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

(async () => {
  // part 2
  await db.collection('solution').doc().set({
    part: 2,
    num: 1,
    sol: [2, 1]
  });
  await db.collection('solution').doc().set({
    part: 2,
    num: 2,
    sol: [1, 4]
  });
  await db.collection('solution').doc().set({
    part: 2,
    num: 3,
    sol: [3, 1]
  });
  await db.collection('solution').doc().set({
    part: 2,
    num: 4,
    sol: [4, 5]
  });
  await db.collection('solution').doc().set({
    part: 2,
    num: 5,
    sol: [4, 2]
  });
  
  // part 4
  [[2], [4], [5], [2], [1], [3], [1], [1], [3], [1], [4], [4], [3], [3], [5]].forEach(async (e, i) => {
    await db.collection('solution').doc().set({
      part: 4,
      num: i+1,
      sol: e
    });
  });

  // part 6
  [[4], [2], [2], [2], [5], [5], [2], [5], [4], [1], [1], [5], [2], [5], [1], [3], [1], [4], [4], [1], [2], [3], [4], [2], [2]].forEach(async (e, i) => {
    await db.collection('solution').doc().set({
      part: 6,
      num: i+1,
      sol: e
    });
  });
})();