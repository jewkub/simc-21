const fs = require('fs');
const { name: projectId } = require('../package.json');

const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({
  projectId: projectId,
});
const Storage = require('@google-cloud/storage');
const storage = new Storage({
  projectId: projectId,
});
const bucket = storage.bucket('simc-web.appspot.com');

let rawdata = fs.readFileSync('export_answers_10_06.json', 'utf-8');
rawdata = rawdata.replace(/\r/g, '').replace(/\n/g, '\n,');
// console.log(rawdata);
let file = JSON.parse(rawdata);
let z = [];
z[4] = [];
z[5] = [];
let list = [[4, 6], [4, 7], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8]];
list.forEach(e => {
  z[e[0]][e[1]] = [];
});
file.forEach((e, i, arr) => {
  delete e.__key__;
  delete e.__error__;
  delete e.__has_error__;
  // e['ตรวจ'] = '';
  if(e.part == undefined) console.log('zzz');
  if((e.part == 1 && (e.num == 61 || e.num == 62)) || (e.part == 5 && e.num == 6)) e.ans = 'https://storage.googleapis.com/simc-web.appspot.com/' + e.ans;
  if(z[e.part] && z[e.part][e.num]) z[e.part][e.num].push(e);
  // if(e.part == 4 && e.num == 6) console.log(e);
});
list.forEach(e => {
  fs.writeFile(`converted-${e[0]}-${e[1]}.json`, JSON.stringify(z[e[0]][e[1]]), function(err) {
    if(err) console.log(err);
  });
});