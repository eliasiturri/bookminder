<template>
    <div v-if="!url.endsWith('cover-not-exists.png')" class="cover">
        <img  :src="url" alt="cover" >
    </div>
    <div v-else class="cover notfound">
        <img src="@/assets/images/components/book-cover-placeholder-cropped.png" alt="cover" >
    </div>
</template>

<script>

export default {
    name: 'SmartCover',
    data() {
        return {

        }
    },   
    props: {
        url: {
            type: String,
            required: true
        }
    },
    
    computed: {

    },
    methods: {

    },
    async mounted() {

    },    
    components: {

    }
    
}

</script>

<style>

</style>

<style scoped>

.cover img {
    max-width: 150px;
    height: auto;
}
.cover, .cover.notfound {
    display: flex;
    align-items: center;
    justify-content: center;
}
.cover.notfound {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    width: 100px;
    border: 1px solid #ccc;
}
.cover.notfound img {
    width: 60px;
    height: auto;
}
</style>