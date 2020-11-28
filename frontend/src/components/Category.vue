<template>
  <div>
    <h3 @click="toggle = !toggle"> {{ category._id }}. {{ category.name }} - {{ calculatePercentage }}%    ${{ category.sum }}</h3>
    <Entries v-if="toggle" :entries="category.entries"></Entries>
  </div>
</template>

<script>
  import Entries from './Entries.vue';

  export default {
    name: "Category",
    components: {
      Entries
    },
    props: {
      category: Object,
      total: Number
    },
    computed: {
      calculatePercentage: function () {
        return  (this.category.sum / this.total * 100).toFixed(2);
      }
    },
    data: () => {
      return {
        toggle: false,
      }
    }
  }
</script>
