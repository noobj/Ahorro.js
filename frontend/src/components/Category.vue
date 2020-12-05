<template>
  <div>
    <h4 :style="{ color: category.color }" @click="toggle = !toggle">
      {{ category.name }} - {{ category.percentage }}%
      {{ category.sum | toCurrency }}
    </h4>
    <Entries v-if="toggle" :entries="category.entries"></Entries>
  </div>
</template>

<script>
import Entries from "./Entries.vue";

export default {
  name: "Category",
  components: {
    Entries,
  },
  props: {
    category: Object,
    total: Number,
  },
  computed: {
    calculatePercentage: function () {
      console.log(this.category);
      return this.category.color;
    },
  },
  data: () => {
    return {
      toggle: false,
    };
  },
};
</script>
