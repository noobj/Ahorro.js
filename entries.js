"use strict";

const Router = require('koa-router');

// Prefix all routes with: /books
const router = new Router({
    prefix: '/entries'
});


// Get the entries data from mongoDB and organize it.
router.get('/', async (ctx, next) => {
    // Fetch entries from Mongo left join categories
    let categories = await ctx.db.collection('categories').aggregate([
        {$lookup:
            {
                as: 'entries',
                from: 'entries',
                let: {
                    cate_id: "$_id"
                 },
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: [ "$category_id", "$$cate_id" ]
                        }
                    },
                },
                { $project : { "date" : 1, amount: {$toInt: "$amount"}, descr: 1 }},
                { $sort: { amount: -1}}]
            }
        },
    ]).toArray();

    // Filter empty categories
    categories = await categories.filter((category) => {
        return category.entries.length != 0;
    });

    // Sum up amounts of each category and sort by the sum in descending order
    categories = await categories.map((category) => {
        category.sum = category.entries.map( x => x.amount).reduce((sum, current) => {
            return parseInt(sum) + parseInt(current);
        }, 0);
        return category
    }).sort((a, b) => b.sum - a.sum);

    // Sum up all the entries
    const total = categories.map( x => x.sum).reduce((sum, current) => {
       return parseInt(sum) + parseInt(current);
    });

    // wrapping the response
    let result = {
        categories: categories,
        total: total
    }
    ctx.body = result;
    ctx.mongo.close();
    next();
});

module.exports = router;