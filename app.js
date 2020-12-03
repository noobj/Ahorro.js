"use strict";

const Koa = require('koa');
const koaBody = require('koa-body');
const mongo = require("koa-mongo");
const app = new Koa();
const cors = require('@koa/cors');

const { ApolloServer } = require('apollo-server-koa');
const { initDB, closeDB } = require('./model/entryFunctions');
const typeDefs = require('./graphql/entryType');
const resolvers = require('./graphql/resolver');

// Middleware for calculating the timespan of a request
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

app.use(cors());
app.use(koaBody());

const server = new ApolloServer ({
    typeDefs,
    resolvers
});

app.use(server.getMiddleware());

let koaServer;
if (!module.parent) koaServer = app.listen(3000, () => {
    console.log(`listening....at path ${server.graphqlPath}`);
    initDB();
});

process.on('SIGTERM', () => {
    closeDB();
    koaServer.close();
  })

module.exports = {app, initDB, closeDB};