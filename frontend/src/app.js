import Vue from 'vue';
import moment from 'moment';
import Category from './components/Category';

import ApolloClient from 'apollo-boost'
const apolloClient = new ApolloClient({
  uri: 'http://192.168.56.101:3000/graphql'
});

import VueApollo from 'vue-apollo'
Vue.use(VueApollo);
const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
});

import gql from 'graphql-tag';

new Vue({
    el: '#app',
    apolloProvider,
    components: {
      Category
    },
    data () {
        return {
            categories: null,
            total: 0,
            start:  moment().add(-90, 'days').format('YYYY-MM-DD'),
            end: moment().add(0, 'days').format('YYYY-MM-DD')
        }
    },
    apollo: {
        // Simple query that will update the 'hello' vue property
        entriesWithinCategories() {
            return {
         query: gql`
            query entriesWithinCategories($timeStartInput: String!, $timeEndInput: String!){
                entriesWithinCategories(timeStartInput: $timeStartInput, timeEndInput: $timeEndInput) {
                    categories {
                        name
                        sum
                        entries {
                            amount
                            date
                            descr
                        }
                    }
                    total
                }
            }
          `,
          variables () {
            return {
                timeStartInput: this.start,
                timeEndInput: this.end
            };
          },
          result (result) {
            this.categories = result.data.entriesWithinCategories.categories;
            return this.total = result.data.entriesWithinCategories.total;
          }
        }}

    }
})