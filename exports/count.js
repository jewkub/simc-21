const Datastore = require('@google-cloud/datastore');
const { name: projectId } = require('../package.json');
const datastore = new Datastore({
  projectId: projectId,
});
/* const Storage = require('@google-cloud/storage');
const storage = new Storage({
  projectId: projectId,
});
const bucket = storage.bucket('simc-web.appspot.com'); */

let query = datastore
  .createQuery('Users')
  .filter('agree', '=', true);
datastore
  .runQuery(query)
  .then(res => {
    console.log(res[0].length);
    res[0].forEach(e => {
      let query = datastore
        .createQuery('Answers')
        .filter('email', '=', e.email)
        .filter('part', '=', 1)
        .filter('num', '=', 7);
      datastore
        .runQuery(query)
        .then(res => {
          if(res[0][0] == 'เขจรไลย์') console.log(e.email);
        });
    });
  });