'use strict';

// Script for loading ahorro.json file into mongoDB
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'ahorro';
const client = new MongoClient(url, {useUnifiedTopology: true});

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials_for_cli.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), fetchAndInsert);
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

/**
 * Find and read the ahorro_backup file from google drive.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function fetchAndInsert(auth) {
    const drive = google.drive({version: 'v3', auth});
    // Find the newest ahorro backup file
    let res = await drive.files.list({
        orderBy: "createdTime desc",
        pageSize: 1,
        q: "name contains 'ahorro'"
    }).catch(err => {
        console.log(err);
    });

    console.log('Fetching ' + res.data.files[0].name + '...');

    // Read the file by stream
    let resultString = await drive.files.get({
        fileId: res.data.files[0].id,
        alt: 'media'
    }, {responseType: 'stream'})
    .then(async res => {
        let chucks = [];
        async function logChunks(readable) {
            for await (const chunk of readable) {
                chucks.push(chunk.toString());
            }
          }

         await logChunks(res.data);
          return chucks.join('');
    });

    const fetchedData = JSON.parse(resultString);
    insertEntries(fetchedData);
}

/**
 * Insert Json format data into mongoDB.
 * @param {object} jsonData
 */
async function insertEntries(jsonData) {
    await client.connect();
    console.log('mongodb is connected.');
    const db = client.db(dbName);
    let countInserted = 0;

    const collection = db.collection('entries');
    await collection.drop().then(() => console.log('Drop the old collection.'));
    await Promise.all(jsonData.tables[0].items.map((v) => {
        v._id = parseInt(v._id);
        v.amount = parseInt(v.amount);
        return collection.updateOne({ "_id" : v._id },
        { $set: v }, {upsert: true})
            .then(() => {
                countInserted++;
            })
            .catch(err => {
                console.log(err);
            });
    }))
    .then(() => {
        client.close();
    })
    .catch(error => {
        console.error(error);
    });

    console.log(countInserted + ' items have been inserted/updated.');
}