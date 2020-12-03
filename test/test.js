"use strict";
const {app, initDB, closeDB} = require('../app');
const should = require('chai').should();
const server = app.listen();
const request = require('supertest').agent(server);

describe('Hello World', function() {
    /**
     * Needs to use async function or the result could be wrong.
     * Since the following tests won't wait for the DB to be connected.
     * */
    before(async function() {
        await initDB();
    });

    after(function() {
        server.close();
        closeDB();
    });

    it('Sum up total from 2020-11-02 to 2020-11-03', function(done) {
        request
        .post('/graphql')
        .send({ query: '{ entriesWithinCategories(timeStartInput: "2020-11-02", timeEndInput: "2020-11-03"){ total } }' })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            res.body.data.entriesWithinCategories.total.should.equal(220);
            done();
        })
    });

    it('Count the entries from 2020-11-02 to 2020-11-03', function(done) {
        request
        .post('/graphql')
        .send({ query: '{ entriesWithinCategories(timeStartInput: "2020-11-02", timeEndInput: "2020-11-03") { categories { name sum entries { amount date }}}}' })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            res.body.data.entriesWithinCategories.categories[0].entries.should.have.lengthOf(1);
            done();
        })
    });
});