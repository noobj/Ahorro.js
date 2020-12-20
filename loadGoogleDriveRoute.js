'use strict';


const router = require('koa-router')();

/**
 * Trigger by the frontend load new json file action.
 *
 */
router.get('/load', async (ctx, next) => {
    try {
        const data = await fs.readFileSync('credentials.json');
        ctx.body = await authorize(JSON.parse(data), fetchAndInsert);
    } catch (err) {
        ctx.body = err;
    }
    await next();
});

/**
 * Wait for the google oauth callback.
 */
router.get('/googleCallback', async (ctx, next) => {
    try {
        const code = ctx.request.query.code;
        const data = await fs.readFileSync('credentials.json');
        const credentials = JSON.parse(data);
        const {client_secret, client_id, redirect_uris} = credentials.web;
        const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
        const token = await oAuth2Client.getToken(code);
        await oAuth2Client.setCredentials(token.tokens);
        await fetchAndInsert(oAuth2Client);
        ctx.body = 'done';
    } catch (err) {
        console.log(err.message);
        ctx.body = 'Error!';
    }
    await next();
});

// Script for loading ahorro.json file into mongoDB
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo:27017';
const dbName = 'ahorro';
const client = new MongoClient(url, {useUnifiedTopology: true});

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    try {
        const token = await fs.readFileSync(TOKEN_PATH);
        await oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
        return 'done';
    } catch (error) {
        return oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
    }
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
    .catch(error => {
        console.error(error);
    });

    console.log(countInserted + ' items have been inserted/updated.');
}

module.exports = router;