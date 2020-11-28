<template>
    <div>
        <li v-for="entry in entries"> ${{ entry.amount }} - {{ entry.date }} {{ entry.descr }}</li>
    </div>
</template>
  
<script>
    export default {
        name: "Entries",
        props: ['entries']
    }
</script>
  