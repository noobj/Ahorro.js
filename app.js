"use strict";
const fs = require('fs');
const Koa = require('koa');
const koaBody = require('koa-body');
const mongo = require("koa-mongo");
const app = new Koa();
const cors = require('@koa/cors');
const https = require('https');

const Logger = require('./logger');

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
app.use(Logger());

let router = require('./loadGoogleDriveRoute.js');

app.use(router.routes()).use(router.allowedMethods());;

const server = new ApolloServer({
    typeDefs,
    resolvers
});

app.use(server.getMiddleware());

let httpsConfig = {
    port: 3000,
    options: {
        key: fs.readFileSync('/https/nginx.key', 'utf8').toString(),
        cert: fs.readFileSync('/https/nginx.crt', 'utf8').toString(),
    },
}


if (!module.parent) {
    try {
        var httpsServer = https.createServer(httpsConfig.options, app.callback());
        httpsServer
            .listen(httpsConfig.port, function (err) {
                if (!!err) {
                    console.error('HTTPS server FAIL: ', err, (err && err.stack));
                }
                else {
                    console.log(`HTTPS server OK`);
                    initDB("mongodb://mongo:27017/");
                }
            });
    }
    catch (ex) {
        console.error('Failed to start HTTPS server\n', ex, (ex && ex.stack));
    }
}

process.on('SIGTERM', () => {
    closeDB();
    httpsServer.close();
})

module.exports = { app, initDB, closeDB };