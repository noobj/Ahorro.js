const graphql = require('graphql');
const { ApolloServer, gql } = require('apollo-server-koa');

const typeDefs = gql`
    type Query  {
        entriesWithinCategories(timeStartInput: String, timeEndInput: String, entriesSortByDate: Boolean, categoriesExclude: [String]): EntryCateSummary
    }

    type EntryCateSummary {
        categories: [Category],
        total: Int
    }

    type Category {
        _id: Int,
        name: String,
        entries: [Entry],
        sum: Int,
        percentage: Float,
        color: String
    }

    type Entry {
        _id: Int,
        amount: Int,
        date: String,
        descr: String
    }
`;
module.exports =  typeDefs;