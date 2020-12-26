<template>
  <div  @mouseover="active = true" @mouseleave="active = false" >
    <input title="Exclude this category" v-show="active" type="image" src="../trashcan.png" style="float: left" @click="onClickButton(category._id)" />
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
  methods: {
    // Emit event to the parent for exclude this category.
    onClickButton: function (categoryId) {
      this.$emit("exclude-category", categoryId);
    }
  },
  data: () => {
    return {
      toggle: false,
      active: false
    };
  },
};
</script>
