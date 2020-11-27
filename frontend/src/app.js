import Vue from 'vue';
import axios from 'axios';
import Entry from './components/entry';

new Vue({
    el: '#app',
    components: {
      Entry,
    },
    data () {
        return {
            items: null
        }
    },
    mounted () {
        axios
            .get('http://192.168.56.101:3000/books')
            .then(response => (this.items = response.data.entries))
            .catch((err) => {
                // redirect to err page
            })
    }
})