const Datastore = require('@google-cloud/datastore');
const projectId = 'simc-20';
const datastore = new Datastore({
  projectId: projectId,
});
/* const Storage = require('@google-cloud/storage');
const storage = new Storage({
  projectId: projectId,
});
const bucket = storage.bucket('simc-20.appspot.com'); */

let query = datastore
    .createQuery('Users');
    // .filter('agree', '=', true);
  datastore
    .runQuery(query)
    .then(res => {
      console.log(res[0].length);
    });