const { ApolloServer } = require('apollo-server-koa');
const { getCategorySummary } = require('../model/entryFunctions');

const resolvers = {
  Query: {
    entriesWithinCategories:  getCategorySummary
  },
}
module.exports = resolvers;