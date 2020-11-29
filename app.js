// app.js

const Koa = require('koa');
const koaBody  = require('koa-body');
const mongo = require("koa-mongo");

// create app instance
const app = module.exports = new Koa();
const cors = require('@koa/cors');

// Middleware for calculating the timespan of a request
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
  });

app.use(cors());
app.use(mongo({
    uri: 'mongodb://mongo:27017/ahorro',
    max: 100,
    min: 1
}));

// middleware functions
app.use(koaBody());

// Require the router here
let entries = require('./entries.js');

// use the router here
app.use(entries.routes());
if(!module.parent) app.listen(3000);
