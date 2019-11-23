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

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

async function main(auth) {
  const sheets = google.sheets({version: 'v4', auth});

  let data = [];
  let cnt = 0;
  let done = (await db.collection('users')
    .where('done', '=', true)
    .where('pass', '=', true).get())
    .docs;
  done.forEach(async user => {
    let answers = [];
    let ans = (await db.collection('evaluation')
      .where('user', '=', user.ref)
      .get()).docs;
    ans.forEach(e => {
      answers[e.get('num')] = e.get('ans');
    });
    answers[0] = user.get('email');
    data.push(answers);
    // console.log(cnt++);
    // if (cnt == 200) break;
  });

  setTimeout(() => {
    // console.log(data);
    let range = 'ประเมิน!A4:BK4';
    sheets.spreadsheets.values.append({
      spreadsheetId: '1T9EbdvrXItjmRBt0VAjeCaYebqdHSzYM7ooUjPxl4_M',
      range: range,
      valueInputOption: 'RAW',
      insertDataOption: 'OVERWRITE',
      resource: {
        range: range,
        majorDimension: 'ROWS',
        values: data
      },
      auth: auth,
    }, function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
    });
  }, 15 * 1000);
}

// ------------------------

// Load client secrets from a local file.
fs.readFile('../secret/credentials.json', (err, content) => {
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