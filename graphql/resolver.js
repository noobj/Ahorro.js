const { ApolloServer } = require('apollo-server-koa');
const { getCategorySummary, getSumMonthly } = require('../model/entryFunctions');

const resolvers = {
  Query: {
    entriesWithinCategories:  getCategorySummary,
    monthlySum: getSumMonthly
  },
}
module.exports = resolvers;