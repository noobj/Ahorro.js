<template>
  <div  @mouseover="active = true" @mouseleave="active = false" >
    <div :style="{ color: category.color }" class="cat" @click="$emit('active-category', category._id)">
        <span>{{ category.name }}</span>
        <span>{{ category.percentage }}%</span>
        <span>{{ category.sum | toCurrency }}</span>
        <input title="Exclude this category" v-show="active" type="image" src="../trashcan.png" style="float: left" @click="onClickButton(category._id)" />
    </div>
    <Entries v-if="activeCat === category._id" :entries="category.entries"></Entries>
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
    activeCat: Number
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

<style scoped>
div.cat {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    font-size: 21px;
    font-weight: bold;
}
div.cat:hover > input {
    background: #666;
}
</style>
