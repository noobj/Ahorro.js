// app.js

const Koa = require('koa');
const koaBody = require('koa-body');
const mongo = require("koa-mongo");

// create app instance
const app = new Koa();
const cors = require('@koa/cors');

app.use(cors());
app.use(mongo({
    uri: 'mongodb://localhost:27017/ahorro',
    max: 100,
    min: 1
}));

// middleware functions
app.use(koaBody());

// Require the router here
let books = require('./entries.js');

// use the router here
app.use(books.routes());

app.listen(3000);
