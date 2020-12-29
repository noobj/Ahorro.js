const { MongoClient } = require('mongodb');
const fs = require('fs');
const { initDB, closeDB, getCategorySummary } = require('../model/entryFunctions');

describe('Test connection error', () => {

    it('should close no db if no db have created', async () => {
        const closedb = await closeDB();

        expect(closedb).toBeUndefined();
    });

    it('should throw error connection', async () => {
        // Mock the console log
        console.log = jest.fn();
        const dbReturn = await initDB("what");


        expect(console.log).toHaveBeenCalledWith('Could not get connection to MongoDB..\nMongoParseError: Invalid connection string');
        expect(dbReturn).toBeUndefined();
    });
});

describe('Test entry model', () => {
    let db;

    beforeAll(async () => {
        db = await initDB(global.__MONGO_URI__);
        const categoriesData = await fs.readFileSync('test/categories.json');
        const categories = db.collection('categories');

        await categories.insertMany(JSON.parse(categoriesData));
        const entriesData = await fs.readFileSync('test/entries.json');
        const entries = db.collection('entries');
        await entries.insertMany(JSON.parse(entriesData));
    });

    afterAll(async () => {
        await closeDB();
    });

    it('should return ahorro db connection', async () => {
        const dbReturn = await initDB();

        expect(dbReturn).toHaveProperty('databaseName', "ahorro");
    });


    it('should get categories with entries with no exclusive category', async () => {
        const result = await getCategorySummary(null, { timeStartInput: '2020-10-01', timeEndInput: '2020-10-31' });

        expect(result).toHaveProperty('total', 36207);
        expect(result.categories[0].sum).toEqual(23280);
        expect(result.categories[0].name).toEqual('Entertainment');
        expect(result.categories[0].percentage).toEqual('64.30');
        expect(result.categories[0].entries[0].amount).toEqual(8000);
    });

    it('should get categories with entries with some exclusive category', async () => {
        const result = await getCategorySummary(null, { timeStartInput: '2020-10-01', timeEndInput: '2020-10-31', categoriesExclude: ['7', '8'] });

        expect(result).toHaveProperty('total', 10237);
        expect(result.categories[0].sum).toEqual(3340);
        expect(result.categories[0].name).toEqual('Training');
        expect(result.categories[0].percentage).toEqual('32.63');
        expect(result.categories[0].entries[0].amount).toEqual(1700);
    });

    it('should get categories with entries sorted by date', async () => {
        const result = await getCategorySummary(null, { timeStartInput: '2020-10-01', timeEndInput: '2020-10-31', categoriesExclude: ['7', '8'], entriesSortByDate: 1 });

        expect(result).toHaveProperty('total', 10237);
        expect(result.categories[0].sum).toEqual(3340);
        expect(result.categories[0].name).toEqual('Training');
        expect(result.categories[0].percentage).toEqual('32.63');
        expect(result.categories[0].entries[0].amount).toEqual(890);
    });

    it('should get categories without date range', async () => {
        const result = await getCategorySummary(null, {});

        expect(result).toHaveProperty('total');
    });
});