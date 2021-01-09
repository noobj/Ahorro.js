"use strict";

const MongoClient = require('mongodb').MongoClient
const moment = require('moment');

let client = null;
let db = null;

/**
 * Initialize Database.
 * @param {string} url
 * @returns {object}
 */
async function initDB(url) {
    if (!db) {
        client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        db = await new Promise((resolve, reject) =>
            client.connect((err) => {
                if (err)
                    return reject(err)
                let database = client.db('ahorro');
                resolve(database);
            })
        ).catch(e => {
            console.log('Could not get connection to MongoDB..\n' + e);
        })
    }

    return db;
}

/**
 * Shutdown Database.
 */
async function closeDB() {
    if (db) {
        await client.close()
        await db.close();
    }
}


/**
 * Get the monthly sum-up of specific year
 * @param {*} root
 * @param {*} param1
 * @param {string} [param1.year]
 */
async function getSumMonthly(root, {year}) {
    // Set the time range, if the date format is wrong then get the previous 30 days
    let timeStart = moment(`${year}-01-01`).toISOString();
    let timeEnd = moment(`${year}-12-31 23:59:59`).toISOString();

    let result = await db.collection('entries').aggregate([
        { $match: { date: { $gte: timeStart, $lte: timeEnd } } },
        {
            $group: {
                _id: { $substr: ["$date", 0, 7] },
                sum: { $sum: "$amount" }
            }
        },
        { $sort : { _id : 1 } }
    ]).toArray();

    result = result.map(v => {
        return {
            month: moment(v._id).format('MMMM'),
            sum: v.sum
        }
    })

    return result;
}

/**
 * Get the entries data from mongoDB and organize it.
 * @param {*} root
 * @param {object} [param1]
 * @param {string} [param1.timeStartInput]
 * @param {string} [param1.timeEndInput]
 * @param {boolean} [param1.entriesSortByDate]
 * @param {Array} [param1.categoriesExclude]
 * @returns {object}
 */
async function getCategorySummary(root, { timeStartInput, timeEndInput, entriesSortByDate, categoriesExclude }) {
    // Set the time range, if the date format is wrong then get the previous 30 days
    let timeStart = moment(timeStartInput, 'YYYY-MM-DD', true).isValid() ? timeStartInput : moment().add(-30, 'days').toISOString();
    let timeEnd = moment(timeEndInput, 'YYYY-MM-DD', true).isValid() ? timeEndInput : moment().add(0, 'days').toISOString();
    categoriesExclude = categoriesExclude ? categoriesExclude : [];

    // Used for deciding sort by which column, amount by default
    let sortByWhichColumn = "amount";
    if (entriesSortByDate == 1) sortByWhichColumn = "date";

    let sort = {};
    sort[sortByWhichColumn] = -1;

    let andCondition = [{ $gte: ["$date", timeStart] }, { $lte: ["$date", timeEnd] }, { $eq: ["$category_id", "$$cate_id"] }];
    andCondition = andCondition.concat(categoriesExclude.map(x => {
        return { $ne: ["$category_id", x] };
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
                { $project: { amount: 1, date: 1, descr: 1 } },
                { $sort: sort }]
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

module.exports = { getCategorySummary, initDB, closeDB, getSumMonthly };