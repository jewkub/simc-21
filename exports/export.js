const fs = require('fs');
const readline = require('readline');
const store = require('node-persist');
const {google} = require('googleapis');

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

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

async function main(auth) {
  await store.init();
  const sheets = google.sheets({version: 'v4', auth});

  let cnt = 0;
  let query = datastore
    .createQuery('Users')
    .filter('done', '=', true);
  datastore
    .runQuery(query)
    .then(result => {
      result[0].forEach(async function(user) {
        let query = datastore
          .createQuery('Answers')
          .filter('part', '=', 5) // edit part
          .filter('num', '=', 7) // edit num
          .filter('email', '=', user.email);
        let res = await store.getItem(user.email + '-5-7'); // edit part and num
        if(res) {
          console.log('email ' + user.email + ' is duplicated');
          return ;
        }
        let ans = await datastore.runQuery(query);
        ans = ans[0][0];
        let desc = ans;
        query = datastore
          .createQuery('Answers')
          .filter('part', '=', 5) // *edit part
          .filter('num', '=', 6) // *edit num
          .filter('email', '=', user.email);
        ans = await datastore.runQuery(query);
        ans = ans[0][0];
        setTimeout(() => {
          let range = '5-7!A4:C4'; // edit part and cell
          sheets.spreadsheets.values.append({
            spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',
            range: range,
            valueInputOption: 'RAW',
            insertDataOption: 'OVERWRITE',
            resource: {
              range: range,
              majorDimension: 'ROWS',
              values: [
                [user.email, 'storage.googleapis.com/simc-20.appspot.com/' + ans.ans, desc.ans]
              ]
            },
            auth: auth,
          }, function(err, response) {
            if (err) {
              console.error(err);
              return;
            }
            store.setItem(user.email + '-5-7', true); // edit part and num
          });
        }, 2.4 * 1000 * (cnt++));
      });
    })
    .catch(err => {
      console.log(err);
    })

  /* var request = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',  // TODO: Update placeholder value.

    // The A1 notation of a range to search for a logical table of data.
    // Values will be appended after the last row of the table.
    range: 'part2!A4:B4',  // TODO: Update placeholder value.

    // How the input data should be interpreted.
    valueInputOption: 'RAW',  // TODO: Update placeholder value.

    // How the input data should be inserted.
    insertDataOption: 'INSERT_ROWS',  // TODO: Update placeholder value.

    resource: {
      range: 'part2!A4:B4',
      majorDimension: 'ROWS',
      values: [
        ['aaas', '222']
      ]
    },

    auth: auth,
  };

  sheets.spreadsheets.values.append(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
  
    // console.log(response);
  }); */

  /* sheets.spreadsheets.values.get({
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',
    range: 'Sheet2!:A',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res.data.values);
  }); */

  /*sheets.spreadsheets.batchUpdate({
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',
    resource: {
      requests: [{
        addSheet: {
          properties: {
            title: 'part3'
          }
        }
      }]
    }
  }, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(response);
  }); */
}

// ------------------------

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}