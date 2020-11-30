"use strict";

const Koa = require('koa');
const koaBody = require('koa-body');
const mongo = require("koa-mongo");
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
app.use(koaBody());

// Set up mongo minimal pool connections, set 0 for testing mode so the test script can be terminated.
let mongoMin = 1;
if(module.parent) mongoMin = 0;

app.use(mongo({
  uri: 'mongodb://localhost:27017/ahorro',
  max: 100,
  min: mongoMin
}));

let entries = require('./entries.js');
app.use(entries.routes());

if(!module.parent) app.listen(3000);
