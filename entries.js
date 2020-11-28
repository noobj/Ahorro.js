// books.js

const Router = require('koa-router');

// Prefix all routes with: /books
const router = new Router({
    prefix: '/books'
});


// Routes will go here
router.get('/', async (ctx, next) => {
    // Fetch entries from Mongo left join categories
    let entries = await ctx.db.collection('entries').aggregate([
        {$lookup:
            {
                as: 'category',
                from: 'categories',
                let: { 
                    cate_id: "$category_id"
                 },
                 pipeline: [{
                    $match: {
                       $expr: {
                          $eq: [ "$_id", "$$cate_id" ]
                       }
                    },
                 },
                { $project: { _id: 0 } },
            ]
            }},
             {"$unwind":"$category"}
        ]).toArray();
        
    entries = await entries.map((entry) => {
        entry.category = entry.category.name;
        return entry
    });

    // Sum up all the entries
    const total = entries.map( x => x.amount).reduce((sum, current) => {
       return parseInt(sum) + parseInt(current);
    });

    let result = {
        entries: entries,
        total: total
    }
    ctx.body = result;
    next();
});


router.get('/:id', (ctx, next) => {
    let getCurrentBook = books.filter(function(book) {
        if (book.id == ctx.params.id) {
            return true;
        }
    });

    if (getCurrentBook.length) {
        ctx.body = getCurrentBook[0];
    } else {
        ctx.response.status = 404;
        ctx.body = 'Book Not Found';
    }
    next();
});

module.exports = router;