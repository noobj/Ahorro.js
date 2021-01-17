import Vue from 'vue';
import moment from 'moment';
import Category from './components/Category';
import Chart from './components/Chart';
import axios from 'axios';
import Yearlychart from './components/YearlyChart';
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
        Category, Chart, Yearlychart
    },
    data() {
        return {
            categories: null,
            total: 0,
            start: moment().add(-30, 'days').format('YYYY-MM-DD'),
            end: moment().add(0, 'days').format('YYYY-MM-DD'),
            datacollection: {},
            randomColorsArr: null,
            entriesSortByDate: false,
            categoriesExclude: [],
            yearlyCollection: {},
            skipQuery: true,
            activeCat: -1,
            yearDisplay: "2020",
            myStyles: {
                height: '300px',
                width: '100%',
                position: 'relative',
            },
            options: {
                legend: {
                    display: false,
                },
                responsive: true,
                maintainAspectRatio: false
            }
        }
    },
    apollo: {
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
                        color
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
                variables() {
                    return {
                        timeStartInput: this.start,
                        timeEndInput: this.end,
                        entriesSortByDate: this.entriesSortByDate,
                        categoriesExclude: this.categoriesExclude
                    };
                },
                fetchPolicy: 'network-only',
                async result(result) {
                    this.categories = await result.data.entriesWithinCategories.categories;
                    this.total = result.data.entriesWithinCategories.total;

                    let categoryNames = this.categories.map(v => v.name);
                    let categoryPercent = this.categories.map(v => v.percentage);
                    let categoryColors = this.categories.map(v => v.color);

                    this.datacollection = {
                        labels: categoryNames,
                        datasets: [
                            {
                                label: 'Data One',
                                backgroundColor: categoryColors,
                                data: categoryPercent
                            }
                        ]
                    };
                }
            }
        },
        monthlySum() {
            return {
                query: gql`
                    query monthlySum($year: String!) {
                        monthlySum(year: $year) {
                            month
                            sum
                        }
                    }
                 `,
                variables() {
                    return {
                        year: this.yearDisplay,
                    };
                },
                fetchPolicy: 'network-only',
                // Disable the query
                skip() {
                    return this.skipQuery
                  },
                async result(result) {
                    let labels = result.data.monthlySum.map(v => v.month);
                    let values = result.data.monthlySum.map(v => v.sum);

                    this.yearlyCollection = {
                        labels: labels,
                        datasets: [
                            {
                                label: 'sum',
                                backgroundColor: '#004daa',
                                data: values
                            }
                        ]
                    };
                }
            }
        }
    },
    methods: {
        loadNewData: function () {
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
            for (let i = 0; i < size; i++) {
                let color = '#' + Math.floor(Math.random() * 16777215).toString(16);
                result.push(color);
            }

            return result;
        },
        excludeCategory: function (id) {
            this.categoriesExclude.push(id.toString());
        },
        activeCategory: function (id) {
            if (this.activeCat === id) id = -1;
            this.activeCat = id;
        },
        lastMonth: function () {
            this.start = moment(this.end).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
            this.end = moment(this.end).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
            this.skipQuery = true;
            this.categoriesExclude = [];
            this.activeCat = -1;
        },
        nextMonth: function () {
            this.start = moment(this.end).add(1, 'months').startOf('month').format('YYYY-MM-DD');
            this.end = moment(this.end).add(1, 'months').endOf('month').format('YYYY-MM-DD');
            this.yearDisplay = moment(this.end).endOf('year').format('YYYY');
            this.skipQuery = true;
            this.categoriesExclude = [];
            this.activeCat = -1;
        },
        yearlyDisplay: function() {
            if(this.skipQuery) {
                this.start = moment(this.end).startOf('year').format('YYYY-MM-DD');
                this.end = moment(this.end).endOf('year').format('YYYY-MM-DD');
                this.yearDisplay = moment(this.end).endOf('year').format('YYYY');
            }

            this.skipQuery = !this.skipQuery;
        }
    }
})