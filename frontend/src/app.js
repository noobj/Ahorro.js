import Vue from 'vue';
import moment from 'moment';
import Category from './components/Category';
import Chart from './components/Chart';
import axios from 'axios';
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
  uri: 'https://192.168.56.101:3000/graphql'
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
            start:  moment().add(-30, 'days').format('YYYY-MM-DD'),
            end: moment().add(0, 'days').format('YYYY-MM-DD'),
            datacollection: {},
            randomColorsArr: null,
            entriesSortByDate: false,
            categoriesExclude: [],
            activeCat: -1
        }
    },
    apollo: {
        // Simple query that will update the 'hello' vue property
        entriesWithinCategories() {
            return {
         query: gql`
            query entriesWithinCategories($timeStartInput: String!, $timeEndInput: String!, $entriesSortByDate: Boolean, $categoriesExclude: [String]){
                entriesWithinCategories(timeStartInput: $timeStartInput, timeEndInput: $timeEndInput, entriesSortByDate: $entriesSortByDate, categoriesExclude: $categoriesExclude) {
                    categories {
                        _id
                        name
                        sum
                        percentage
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
                timeEndInput: this.end,
                entriesSortByDate: this.entriesSortByDate,
                categoriesExclude: this.categoriesExclude
            };
          },
          fetchPolicy: 'network-only',
          async result (result) {
            this.categories = await result.data.entriesWithinCategories.categories;
            this.total = result.data.entriesWithinCategories.total;

            let categoryNames = this.categories.map(v => v.name);
            let categoryPercent = this.categories.map(v => v.percentage);

            this.randomColorsArr = await this.randomColors(categoryNames.length);
            this.datacollection = {
                labels: categoryNames,
                datasets: [
                    {
                        label: 'Data One',
                        backgroundColor: this.randomColorsArr,
                        data: categoryPercent
                    }
                ]
            };

            return this.categories = this.categories.map((category, index) => {
                // Need to use Vue.set since Vue doesn't detect object property addition
                Vue.set(category, 'color', this.randomColorsArr[index]);
                return category;
            });
          }
        }}
    },
    methods: {
        loadNewData: function() {
            return axios
            .get('https://192.168.56.101:3000/load')
            .then(res => {
                window.open(res.data);
            })
            .catch(err => {
                alert('something wrong.');
            })
        },
        randomColors: function (size) {
            let result = [];
            for(let i = 0; i < size ; i++) {
                let color = '#' + Math.floor(Math.random()*16777215).toString(16);
                result.push(color);
            }

            return result;
        },
        excludeCategory: function (id) {
            this.categoriesExclude.push(id.toString());
        },
        activeCategory: function (id) {
            if(this.activeCat === id) id = -1;
            this.activeCat = id;
        },
        lastMonth: function () {
            this.start =  moment(this.end).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
            this.end = moment(this.end).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
            this.categoriesExclude = [];
            this.activeCat = -1;
        },
        nextMonth: function () {
            this.start =  moment(this.end).add(1, 'months').startOf('month').format('YYYY-MM-DD');
            this.end = moment(this.end).add(1, 'months').endOf('month').format('YYYY-MM-DD');
            this.categoriesExclude = [];
            this.activeCat = -1;
        },
    }
})