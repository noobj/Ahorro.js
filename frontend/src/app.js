import Vue from 'vue';
import moment from 'moment';
import Category from './components/Category';
import Chart from './components/Chart';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

Vue.use(BootstrapVue);
Vue.filter('toCurrency', function (value) {
    if (typeof value !== "number") {
        return value;
    }
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    });
    return formatter.format(value);
});

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
      Category, Chart
    },
    data () {
        return {
            categories: null,
            total: 0,
            start:  moment().add(-90, 'days').format('YYYY-MM-DD'),
            end: moment().add(0, 'days').format('YYYY-MM-DD'),
            datacollection: {
                labels: [1,2,3,4,5,6,7,8,9,10,11,12],
                datasets: [
                    {
                        label: 'Data One',
                        backgroundColor: '#f87979',
                        data: [1,2,3,4,5,6,7,8,9,10,11,12]
                    }
                ]
            }
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
            this.datacollection = {
                labels: [1,1,1,4,5,6,1,1,1,10,11,12],
                datasets: [
                    {
                        label: 'Data One',
                        backgroundColor: '#f87979',
                        data: [1,2,3,4,5,6,7,8,9,10,11,12]
                    }
                ]
            };
            this.categories = result.data.entriesWithinCategories.categories;
            return this.total = result.data.entriesWithinCategories.total;
          }
        }}
    }
})