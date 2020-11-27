<template>
  <div>
    <p @click="toggle = !toggle"> {{ item._id }}. ${{ item.amount }}</p>
    <p v-if="toggle"> {{ item }}</p>
  </div>
</template>

<script>
  export default {
    name: "Entry",
    props: ['item'],
    data: () => {
      return {
        toggle: false,
      }
    }
  }
</script>
