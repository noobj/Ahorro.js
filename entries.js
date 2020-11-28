// books.js

const Router = require('koa-router');

// Prefix all routes with: /books
const router = new Router({
    prefix: '/books'
});


// Routes will go here
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
                 { $project: { routine_id: 0 } },
            ]
            }},
        ]).toArray();

    // Sum up amounts of each category
    categories = await categories.map((category) => {
        category.sum = category.entries.map( x => x.amount).reduce((sum, current) => {
            return parseInt(sum) + parseInt(current);
        }, 0);
        return category
    });

    // Sum up all the entries
    const total = categories.map( x => x.sum).reduce((sum, current) => {
       return parseInt(sum) + parseInt(current);
    });

    let result = {
        categories: categories,
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