import Vue from 'vue';
import axios from 'axios';
import moment from 'moment';
import Category from './components/Category';

new Vue({
    el: '#app',
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
    methods: {
        getEntries: function() {
            return axios
            .get(`http://192.168.56.101:3000/entries?start=${this.start}&end=${this.end}`)
            .then(response => {
                console.log(moment().day(0));
                this.total = response.data.total;
                return this.categories = response.data.categories;
            })
            .catch((err) => {
                alert('Something wrong!');
            })
        }
    },
    mounted () {
        axios
            .get('http://192.168.56.101:3000/entries')
            .then(response => {
                this.total = response.data.total;
                return this.categories = response.data.categories;
            })
            .catch((err) => {
                // redirect to err page
            })
    },
})