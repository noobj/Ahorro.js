'use strict';

// Script for loading ahorro.json file into mongoDB

const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const rawdata = fs.readFileSync('ahorro.json');

let objs = JSON.parse(rawdata);

const url = 'mongodb://localhost:27017';
const dbName = 'ahorro';
const client = new MongoClient(url, {});
client.connect()
    .then(async (connectedClient) => {
        console.log('mongodb is connected');
        const db = client.db(dbName);
        let countInserted = 0;
        const worker = async function (data) {
                const collection = db.collection('entries');
                await Promise.all(objs.tables[0].items.map((v) => {
                    v._id = parseInt(v._id);
                    v.amount = parseInt(v.amount);
                    return collection.insertOne(v)
                        .then(() => {
                            countInserted++;
                            console.log(countInserted);
                        })
                        .catch(err => {});
                }));
                return countInserted;
        };

        // 回應
        await worker(objs.tables[0])
            console.log('Inserted ' + countInserted + ' items.');
        // .catch(error => {
        //     console.error(error);
        // });
    })
    .then((a) => {
        client.close();
    })
    .catch(error => {
        console.error(error);
    });

