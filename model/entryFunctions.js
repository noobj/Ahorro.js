"use strict";

const MongoClient = require('mongodb').MongoClient
const { UserInputError } = require('apollo-server-koa');
const moment = require('moment');

let client = null;
let db  =  null;

async function initDB(url) {
  if (!db)
  {
    url = url ? url : "mongodb://mongo:27017/";
    client  = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true  });
    db = await new Promise( (resolve, reject) =>
      client.connect((err) =>
      {
        if (err)
          return reject(err)
        let database = client.db('ahorro');
        resolve (database);
     })
   ).catch(e => {
      console.log('Could not get connection to MongoDB..\n' + e);
    })
  }

  return db;
}

async function closeDB() {
    if (db) {
      await client.close()
      await db.close();
    }
  }

// Get the entries data from mongoDB and organize it.
async function getCategorySummary(root, {timeStartInput, timeEndInput, entriesSortByDate, categoriesExclude}) {
    // Set the time range, if the date format is wrong then get the previous 30 days
    let timeStart = moment(timeStartInput, 'YYYY-MM-DD', true).isValid() ? timeStartInput : moment().add(-30, 'days').toISOString();
    let timeEnd = moment(timeEndInput, 'YYYY-MM-DD', true).isValid() ?timeEndInput : moment().add(0, 'days').toISOString();
    categoriesExclude = categoriesExclude ? categoriesExclude : [];

    // Used for deciding sort by which column, amount by default
    let sortByWhichColumn = "amount";
    if(entriesSortByDate == 1) sortByWhichColumn = "date";

    let sort = {};
    sort[sortByWhichColumn] = -1;

    let andCondition = [{ $gte: ["$date", timeStart] }, { $lte: ["$date", timeEnd] }, { $eq: ["$category_id", "$$cate_id"] }];
    andCondition = andCondition.concat(categoriesExclude.map(x => {
        return {$ne: ["$category_id", x]};
    }));
    // Fetch entries from Mongo left join categories
    let categories = await db.collection('categories').aggregate([
        {
            $lookup:
            {
                as: 'entries',
                from: 'entries',
                let: {
                    cate_id: "$_id"
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: andCondition
                        }
                    },
                },
                { $project: { amount: 1, date: 1, descr: 1} },
                { $sort: sort}]
            }
        },
    ]).toArray();

    // Filter empty categories
    categories = await categories.filter((category) => {
        return category.entries.length != 0;
    });

    // Sum up amounts of each category and sort by the sum in descending order
    categories = await categories.map((category) => {
        category.sum = category.entries.map(x => x.amount).reduce((sum, current) => {
            return parseInt(sum) + parseInt(current);
        }, 0);
        return category
    }).sort((a, b) => b.sum - a.sum);   // Sort by sum desc

    // Sum up all the entries
    const total = await categories.map(x => x.sum).reduce((sum, current) => {
        return parseInt(sum) + parseInt(current);
    }, 0);

    categories = await categories.map((category) => {
        category.percentage = ((category.sum / total) * 100).toFixed(2);
        return category;
    });

    // wrapping the response
    let result = {
        categories: categories,
        total: total
    }
    return result;
};

module.exports = { getCategorySummary, initDB, closeDB };