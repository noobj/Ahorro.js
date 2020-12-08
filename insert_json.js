'use strict';

// Script for loading ahorro.json file into mongoDB

const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const rawdata = fs.readFileSync('ahorro.json');

let objs = JSON.parse(rawdata);

const readline = require('readline');
const { google } = require('googleapis');

const url = 'mongodb://localhost:27017';
const dbName = 'ahorro';
const client = new MongoClient(url, {});

insertEntries();

async function insertEntries() {
    await client.connect();
    console.log('mongodb is connected');
    const db = client.db(dbName);
    let countInserted = 0;
    const worker = async function (data) {
        const collection = db.collection('entries');
        await Promise.all(objs.tables[0].items.map((v) => {
            v._id = parseInt(v._id);
            v.amount = parseInt(v.amount);
            return collection.updateOne({ "_id" : v._id },
            { $set: v }, {upsert: true})
                .then(() => {
                    countInserted++;
                    console.log(countInserted);
                })
                .catch(err => {
                    console.log(err);
                });
        }));
        return countInserted;
    };

    await worker(objs.tables[0])
    .then((a) => {
        client.close();
    })
    .catch(error => {
        console.error(error);
    });

    console.log('Inserted ' + countInserted + ' items.');
}


