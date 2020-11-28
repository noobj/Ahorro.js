import Vue from 'vue';
import axios from 'axios';
import Category from './components/Category';

new Vue({
    el: '#app',
    components: {
      Category
    },
    data () {
        return {
            categories: null,
            total: 0
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
    }
})