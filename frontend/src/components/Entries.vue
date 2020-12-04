<template>
    <div>
        <li :key="entry._id" v-for="entry in entries"> {{ entry.amount|toCurrency }} - {{ entry.date }} {{ entry.descr }}</li>
    </div>
</template>

<script>
    export default {
        name: "Entries",
        props: ['entries']
    }
</script>
