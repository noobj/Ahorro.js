"use strict";

const MongoClient = require('mongodb').MongoClient
const { UserInputError } = require('apollo-server-koa');
const moment = require('moment');

const client  = new MongoClient("'mongodb://mongo:27017/", { useNewUrlParser: true, useUnifiedTopology: true  })
let db  =  null;

async function initDB() {
  if (!db)
  {
    db = await new Promise( (resolve, reject) =>
      client.connect((err) =>
      {
        if (err)
          return reject(err)
        let database = client.db('ahorro')
        resolve (database);
     })
   ).catch(e => {
      console.log('Could not get connection to MongoDB..\n' + e)
      process.exit(1)
    })
  }
}

function closeDB() {
    if (db)
      client.close()
  }

// Get the entries data from mongoDB and organize it.
async function getCategorySummary(root, {timeStartInput, timeEndInput, entriesSortByDate}) {
    // Set the time range, if the date format is wrong then get the previous 3 months
    let timeStart = moment(timeStartInput, 'YYYY-MM-DD', true).isValid() ? timeStartInput : moment().add(-90, 'days').toISOString();
    let timeEnd = moment(timeEndInput, 'YYYY-MM-DD', true).isValid() ?timeEndInput : moment().add(0, 'days').toISOString();

    // Used for deciding sort by which column, amount by default
    let sortByWhichColumn = "amount";
    if(entriesSortByDate == 1) sortByWhichColumn = "date";

    let sort = {};
    sort[sortByWhichColumn] = -1;

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
                            $and: [{ $gte: ["$date", timeStart] }, { $lte: ["$date", timeEnd] }, { $eq: ["$category_id", "$$cate_id"] }]
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